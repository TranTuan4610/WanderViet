import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'WanderViet'

interface WelcomeSignupProps {
  customerName?: string
  email?: string
}

const WelcomeSignupEmail = ({ customerName, email }: WelcomeSignupProps) => (
  <Html lang="vi" dir="ltr">
    <Head />
    <Preview>Chào mừng bạn đến với {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Đăng ký thành công 🎉</Heading>
        <Text style={text}>
          {customerName ? `Xin chào ${customerName},` : 'Xin chào,'}
        </Text>
        <Text style={text}>
          Cảm ơn bạn đã tạo tài khoản tại {SITE_NAME}. Tài khoản của bạn đã
          sẵn sàng để khám phá các tour du lịch, đặt phòng khách sạn và vé
          máy bay với ưu đãi tốt nhất.
        </Text>
        <Section style={card}>
          <Text style={row}>
            <span style={label}>Tài khoản:</span>{' '}
            <b style={value}>{email || '—'}</b>
          </Text>
          {customerName && (
            <Text style={row}>
              <span style={label}>Họ tên:</span>{' '}
              <b style={value}>{customerName}</b>
            </Text>
          )}
        </Section>
        <Text style={text}>
          Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email.
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
  component: WelcomeSignupEmail,
  subject: `Chào mừng bạn đến với ${SITE_NAME}`,
  displayName: 'Chào mừng đăng ký',
  previewData: {
    customerName: 'Nguyễn Văn A',
    email: 'user@example.com',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 14px' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', margin: '16px 0' }
const row = { fontSize: '14px', color: '#334155', margin: '6px 0' }
const label = { color: '#64748b' }
const value = { color: '#0f172a' }
const footer = { fontSize: '13px', color: '#64748b', margin: '24px 0 0' }
