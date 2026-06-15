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

interface BookingConfirmationProps {
  customerName?: string
  bookingCode?: string
  bookingType?: string
  refTitle?: string
  total?: string
  paymentMethod?: string
  bookingDate?: string
  scheduleInfo?: string
}

const labelForType = (t?: string) => {
  switch (t) {
    case 'tour':
      return 'Tour du lịch'
    case 'hotel':
      return 'Đặt phòng khách sạn'
    case 'flight':
      return 'Vé máy bay'
    default:
      return 'Đơn đặt'
  }
}

const BookingConfirmationEmail = ({
  customerName,
  bookingCode,
  bookingType,
  refTitle,
  total,
  paymentMethod,
  bookingDate,
  scheduleInfo,
}: BookingConfirmationProps) => (
  <Html lang="vi" dir="ltr">
    <Head />
    <Preview>Xác nhận thanh toán thành công - {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Thanh toán thành công 🎉</Heading>
        <Text style={text}>
          {customerName ? `Xin chào ${customerName},` : 'Xin chào,'}
        </Text>
        <Text style={text}>
          Cảm ơn bạn đã đặt dịch vụ tại {SITE_NAME}. Chúng tôi đã nhận được
          thanh toán của bạn. Dưới đây là thông tin chi tiết đơn đặt:
        </Text>

        <Section style={card}>
          {bookingCode && (
            <Text style={row}>
              <span style={label}>Mã đơn:</span>{' '}
              <b style={value}>#{bookingCode}</b>
            </Text>
          )}
          <Text style={row}>
            <span style={label}>Loại dịch vụ:</span>{' '}
            <b style={value}>{labelForType(bookingType)}</b>
          </Text>
          {refTitle && (
            <Text style={row}>
              <span style={label}>Dịch vụ:</span>{' '}
              <b style={value}>{refTitle}</b>
            </Text>
          )}
          {scheduleInfo && (
            <Text style={row}>
              <span style={label}>Thời gian:</span>{' '}
              <b style={value}>{scheduleInfo}</b>
            </Text>
          )}
          {bookingDate && (
            <Text style={row}>
              <span style={label}>Ngày đặt:</span>{' '}
              <b style={value}>{bookingDate}</b>
            </Text>
          )}
          {paymentMethod && (
            <Text style={row}>
              <span style={label}>Phương thức thanh toán:</span>{' '}
              <b style={value}>{paymentMethod}</b>
            </Text>
          )}
          <Hr style={hr} />
          <Text style={totalRow}>
            <span style={label}>Tổng thanh toán:</span>{' '}
            <b style={totalValue}>{total}</b>
          </Text>
        </Section>

        <Text style={text}>
          Vui lòng giữ lại email này để đối chiếu khi cần thiết. Bạn có thể
          xem chi tiết đơn trong mục "Đơn của tôi" trên website.
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
  component: BookingConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Xác nhận đơn đặt${data?.bookingCode ? ` #${data.bookingCode}` : ''} - ${SITE_NAME}`,
  displayName: 'Xác nhận đặt & thanh toán',
  previewData: {
    customerName: 'Nguyễn Văn A',
    bookingCode: 'A1B2C3D4',
    bookingType: 'tour',
    refTitle: 'Tour Đà Nẵng - Hội An 4N3Đ',
    total: '6.500.000 ₫',
    paymentMethod: 'Chuyển khoản QR',
    bookingDate: '21/05/2026 10:30',
    scheduleInfo: 'Khởi hành 01/06/2026, 2 khách',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', margin: '16px 0' }
const row = { fontSize: '14px', color: '#334155', margin: '6px 0' }
const totalRow = { fontSize: '15px', color: '#0f172a', margin: '6px 0' }
const label = { color: '#64748b' }
const value = { color: '#0f172a' }
const totalValue = { color: '#0ea5e9', fontSize: '17px' }
const hr = { borderColor: '#e2e8f0', margin: '12px 0' }
const footer = { fontSize: '13px', color: '#64748b', margin: '24px 0 0' }
