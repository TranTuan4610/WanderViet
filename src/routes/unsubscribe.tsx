import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute('/unsubscribe')({
  component: UnsubscribePage,
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) ?? '' }),
})

function UnsubscribePage() {
  const { token } = Route.useSearch()
  const [state, setState] = useState<'loading' | 'valid' | 'already' | 'invalid' | 'done' | 'error'>('loading')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) { setState('invalid'); return }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) setState('valid')
        else if (d.reason === 'already_unsubscribed') setState('already')
        else setState('invalid')
      })
      .catch(() => setState('error'))
  }, [token])

  async function confirm() {
    setSubmitting(true)
    try {
      const res = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const d = await res.json()
      if (d.success) setState('done')
      else if (d.reason === 'already_unsubscribed') setState('already')
      else setState('error')
    } catch {
      setState('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <h1 className="text-2xl font-bold font-heading mb-4">Hủy đăng ký email</h1>
        {state === 'loading' && <p className="text-muted-foreground">Đang kiểm tra…</p>}
        {state === 'valid' && (
          <>
            <p className="text-muted-foreground mb-6">Bạn sẽ không nhận thêm email từ WanderViet.</p>
            <Button onClick={confirm} disabled={submitting}>
              {submitting ? 'Đang xử lý…' : 'Xác nhận hủy đăng ký'}
            </Button>
          </>
        )}
        {state === 'already' && <p className="text-muted-foreground">Bạn đã hủy đăng ký trước đó.</p>}
        {state === 'done' && <p className="text-emerald-600">Đã hủy đăng ký thành công.</p>}
        {state === 'invalid' && <p className="text-destructive">Liên kết không hợp lệ hoặc đã hết hạn.</p>}
        {state === 'error' && <p className="text-destructive">Có lỗi xảy ra. Vui lòng thử lại.</p>}
      </Card>
    </div>
  )
}
