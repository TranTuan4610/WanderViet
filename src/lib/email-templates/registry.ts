import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as bookingConfirmation } from './booking-confirmation'
import { template as welcomeSignup } from './welcome-signup'
import { template as ownerBookingNotification } from './owner-booking-notification'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'booking-confirmation': bookingConfirmation,
  'welcome-signup': welcomeSignup,
  'owner-booking-notification': ownerBookingNotification,
}
