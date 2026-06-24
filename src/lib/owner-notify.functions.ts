// Backwards-compat shim. The project now sends emails via the Google Apps
// Script mailer (see src/lib/email/google-mail.functions.ts). This file
// re-exports the new server function under the old name so any remaining
// callers keep working.
export { notifyOwnerOfBooking as notifyHotelOwnerOfBooking } from "@/lib/email/google-mail.functions";
