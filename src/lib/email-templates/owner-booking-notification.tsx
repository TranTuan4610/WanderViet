import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'WanderViet'

interface OwnerBookingNotificationProps {
  ownerName?: string
  hotelName?: string
  bookingCode?: string
  roomInfo?: string
  scheduleInfo?: string
  bookingDate?: string
  paymentMethod?: string
  total?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  customerCccd?: string
}

const OwnerBookingNotificationEmail = ({
  ownerName,
  hotelName,
  bookingCode,
  roomInfo,
  scheduleInfo,
  bookingDate,
  paymentMethod,
  total,
  customerName,
  customerPhone,
  customerEmail,
  customerCccd,
}: OwnerBookingNotificationProps) => (
  <Html lang="vi" dir="ltr">
    <Head />
    <Preview>Có khách mới đặt phòng tại {hotelName || 'chỗ nghỉ của bạn'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bạn có khách đặt phòng mới 🛎️</Heading>
        <Text style={text}>
          {ownerName ? `Xin chào ${ownerName},` : 'Xin chào,'}
        </Text>
        <Text style={text}>
          Một khách hàng vừa thanh toán thành công đơn đặt phòng tại{' '}
          <b>{hotelName || 'chỗ nghỉ của bạn'}</b>. Dưới đây là thông tin chi tiết:
        </Text>

        <Section style={card}>
          <Text style={sectionTitle}>Thông tin đơn</Text>
          {bookingCode && (
            <Text style={row}><span style={label}>Mã đơn:</span> <b style={value}>#{bookingCode}</b></Text>
          )}
          {hotelName && (
            <Text style={row}><span style={label}>Chỗ nghỉ:</span> <b style={value}>{hotelName}</b></Text>
          )}
          {roomInfo && (
            <Text style={row}><span style={label}>Phòng:</span> <b style={value}>{roomInfo}</b></Text>
          )}
          {scheduleInfo && (
            <Text style={row}><span style={label}>Lịch trình:</span> <b style={value}>{scheduleInfo}</b></Text>
          )}
          {bookingDate && (
            <Text style={row}><span style={label}>Thời điểm đặt:</span> <b style={value}>{bookingDate}</b></Text>
          )}
          {paymentMethod && (
            <Text style={row}><span style={label}>Thanh toán:</span> <b style={value}>{paymentMethod}</b></Text>
          )}
          {total && (
            <>
              <Hr style={hr} />
              <Text style={totalRow}><span style={label}>Tổng tiền:</span> <b style={totalValue}>{total}</b></Text>
            </>
          )}
        </Section>

        <Section style={card}>
          <Text style={sectionTitle}>Thông tin khách hàng</Text>
          {customerName && (
            <Text style={row}><span style={label}>Họ tên:</span> <b style={value}>{customerName}</b></Text>
          )}
          {customerPhone && (
            <Text style={row}><span style={label}>SĐT:</span> <b style={value}>{customerPhone}</b></Text>
          )}
          {customerEmail && (
            <Text style={row}><span style={label}>Email:</span> <b style={value}>{customerEmail}</b></Text>
          )}
          {customerCccd && (
            <Text style={row}><span style={label}>CCCD:</span> <b style={value}>{customerCccd}</b></Text>
          )}
        </Section>

        <Text style={text}>
          Vui lòng chuẩn bị phòng và liên hệ khách hàng để xác nhận khi cần thiết.
        </Text>
        <Text style={footer}>
          Trân trọng,<br />
          Đội ngũ {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OwnerBookingNotificationEmail,
  subject: (data: Record<string, any>) =>
    `[${SITE_NAME}] Khách mới đặt phòng${data?.hotelName ? ` tại ${data.hotelName}` : ''}${data?.bookingCode ? ` - #${data.bookingCode}` : ''}`,
  displayName: 'Thông báo chủ chỗ nghỉ - Có khách đặt phòng',
  previewData: {
    ownerName: 'Anh Minh',
    hotelName: 'Sunrise Boutique Hotel',
    bookingCode: 'A1B2C3D4',
    roomInfo: 'Phòng Deluxe x 2',
    scheduleInfo: '01/06/2026 → 03/06/2026 · 3 khách',
    bookingDate: '21/05/2026 10:30',
    paymentMethod: 'Chuyển khoản QR',
    total: '3.200.000 ₫',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    customerEmail: 'nguyenvana@example.com',
    customerCccd: '012345678901',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', margin: '16px 0' }
const sectionTitle = { fontSize: '13px', fontWeight: 'bold', color: '#0ea5e9', textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 8px' }
const row = { fontSize: '14px', color: '#334155', margin: '6px 0' }
const totalRow = { fontSize: '15px', color: '#0f172a', margin: '6px 0' }
const label = { color: '#64748b' }
const value = { color: '#0f172a' }
const totalValue = { color: '#0ea5e9', fontSize: '17px' }
const hr = { borderColor: '#e2e8f0', margin: '12px 0' }
const footer = { fontSize: '13px', color: '#64748b', margin: '24px 0 0' }
