import * as React from 'react'
import { createServerFn } from '@tanstack/react-start'
import { sendLovableEmail } from '@lovable.dev/email-js'
import { render } from '@react-email/components'
import { z } from 'zod'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'WanderViet'
const SENDER_DOMAIN = 'notify.wandervietuth.com'
const FROM_DOMAIN = 'wandervietuth.com'

function formatVND(n: number) {
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
  } catch {
    return `${n} đ`
  }
}

export const notifyHotelOwnerOfBooking = createServerFn({ method: 'POST' })
  .inputValidator((input) =>
    z.object({ bookingId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY
    if (!apiKey) {
      console.error('Missing LOVABLE_API_KEY')
      return { sent: false, reason: 'missing_api_key' }
    }

    // 1. Load booking
    const { data: booking, error: bErr } = await supabaseAdmin
      .from('bookings')
      .select('id, type, ref_id, ref_title, total, payment_method, customer_info, created_at')
      .eq('id', data.bookingId)
      .maybeSingle()
    if (bErr || !booking) {
      console.error('notifyHotelOwnerOfBooking: booking not found', { bErr })
      return { sent: false, reason: 'booking_not_found' }
    }
    if (booking.type !== 'hotel') {
      return { sent: false, reason: 'not_hotel_booking' }
    }

    // 2. Load hotel + owner
    const { data: hotel } = await supabaseAdmin
      .from('hotels')
      .select('id, name, owner_id')
      .eq('id', booking.ref_id)
      .maybeSingle()
    if (!hotel?.owner_id) {
      return { sent: false, reason: 'no_owner' }
    }

    // 3. Get owner email + name
    const { data: ownerUser, error: uErr } = await supabaseAdmin.auth.admin.getUserById(hotel.owner_id)
    if (uErr || !ownerUser?.user?.email) {
      console.error('notifyHotelOwnerOfBooking: owner email not found', { uErr })
      return { sent: false, reason: 'owner_email_not_found' }
    }
    const ownerEmail = ownerUser.user.email
    const { data: ownerProfile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', hotel.owner_id)
      .maybeSingle()
    const ownerName =
      ownerProfile?.name ||
      (ownerUser.user.user_metadata as { name?: string } | null)?.name ||
      undefined

    // 4. Build template data
    const ci = (booking.customer_info ?? {}) as Record<string, any>
    const scheduleParts: string[] = []
    if (ci.checkIn && ci.checkOut) scheduleParts.push(`${ci.checkIn} → ${ci.checkOut}`)
    else if (ci.date) scheduleParts.push(`Ngày: ${ci.date}`)
    if (ci.people) scheduleParts.push(`${ci.people} khách`)
    if (ci.rooms) scheduleParts.push(`${ci.rooms} phòng`)

    const paymentLabel: Record<string, string> = {
      qr: 'Chuyển khoản QR - TP Bank',
      vnpay: 'VNPay',
      momo: 'Momo',
      zalopay: 'ZaloPay',
      bank: 'Chuyển khoản ngân hàng',
    }

    const templateData = {
      ownerName,
      hotelName: hotel.name,
      bookingCode: booking.id.slice(0, 8).toUpperCase(),
      roomInfo: ci.roomName ? `${ci.roomName}${ci.rooms ? ` x ${ci.rooms}` : ''}` : booking.ref_title || undefined,
      scheduleInfo: scheduleParts.join(' · '),
      bookingDate: new Date(booking.created_at).toLocaleString('vi-VN'),
      paymentMethod: paymentLabel[booking.payment_method ?? ''] ?? booking.payment_method ?? undefined,
      total: formatVND(Number(booking.total ?? 0)),
      customerName: ci.name,
      customerPhone: ci.phone,
      customerEmail: ci.email,
      customerCccd: ci.cccd,
    }

    // 5. Render + send
    const template = TEMPLATES['owner-booking-notification']
    if (!template) return { sent: false, reason: 'template_missing' }
    const element = React.createElement(template.component, templateData)
    const html = await render(element)
    const plainText = await render(element, { plainText: true })
    const subject =
      typeof template.subject === 'function' ? template.subject(templateData) : template.subject

    const messageId = crypto.randomUUID()
    const idempotencyKey = `owner-notify-${booking.id}`

    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'owner-booking-notification',
      recipient_email: ownerEmail,
      status: 'pending',
    })

    try {
      await sendLovableEmail(
        {
          message_id: messageId,
          to: ownerEmail,
          from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject,
          html,
          text: plainText,
          purpose: 'transactional',
          label: 'owner-booking-notification',
          idempotency_key: idempotencyKey,
          
        },
        { apiKey, sendUrl: process.env.LOVABLE_SEND_URL },
      )
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'owner-booking-notification',
        recipient_email: ownerEmail,
        status: 'sent',
      })
      return { sent: true }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('notifyHotelOwnerOfBooking send failed', { msg })
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'owner-booking-notification',
        recipient_email: ownerEmail,
        status: 'failed',
        error_message: msg.slice(0, 1000),
      })
      return { sent: false, reason: 'send_failed' }
    }
  })
