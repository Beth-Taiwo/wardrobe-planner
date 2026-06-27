// Email delivery seam.
//
// No email provider is wired yet. Until one is, password-reset links are logged server-side so the
// flow is fully testable in development. To enable real delivery, implement `sendEmail` against your
// provider (Resend / SendGrid / SMTP) and add its credentials to `.env` + `.env.example`.
export async function sendEmail(message: { to: string, subject: string, text: string }) {
  // TODO: replace with a real provider call.
  console.info("[mail] (not sent — no provider configured)\n  to: " + message.to
    + "\n  subject: " + message.subject + "\n  " + message.text)
}

export async function deliverPasswordResetEmail(to: string, link: string) {
  await sendEmail({
    to,
    subject: "Reset your Wardrobe Planner password",
    text: "Use this link to set a new password (valid for 1 hour): " + link
  })
}
