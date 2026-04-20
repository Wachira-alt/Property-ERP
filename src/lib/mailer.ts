// @ts-nocheck
import nodemailer from "nodemailer"

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ""),
    },
  })

  return transporter
}

export type Attachment = {
  filename: string
  content:  Buffer
  mimetype: string
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments = [],
}: {
  to:          string
  subject:     string
  html:        string
  attachments?: Attachment[]
}) {
  const mail = getTransporter()

  await mail.sendMail({
    from:        `"Lifestyle Properties" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    attachments: attachments.map((a) => ({
      filename:    a.filename,
      content:     a.content,
      contentType: a.mimetype,
    })),
  })
}

export async function verifyMailer(): Promise<boolean> {
  try {
    const mail = getTransporter()
    await mail.verify()
    return true
  } catch {
    return false
  }
}