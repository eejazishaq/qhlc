/**
 * Sends temporary password to WhatsApp.
 *
 * Configure one provider:
 *
 * **Twilio WhatsApp** (recommended for many setups)
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_FROM  (e.g. whatsapp:+14155238886 or your approved sender)
 *
 * **Meta WhatsApp Cloud API**
 * - WHATSAPP_ACCESS_TOKEN
 * - WHATSAPP_PHONE_NUMBER_ID
 * - Optional: WHATSAPP_TEMPLATE_NAME + WHATSAPP_TEMPLATE_LANGUAGE (default en)
 *   For messages outside the 24h customer-care window, Meta requires an approved template
 *   with one body variable: the password.
 */

export type WhatsAppSendResult =
  | { ok: true; provider: 'twilio' | 'meta' }
  | { ok: false; error: string; skipped?: boolean }

/** Digits only, no leading + (Meta). */
export function normalizeWhatsAppDigits(phone: string): string | null {
  let d = phone.replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length < 10) return null
  return d
}

function buildPasswordMessage(fullName: string | null | undefined, password: string): string {
  const greeting = fullName?.trim() ? `Hello ${fullName.trim()}, ` : 'Hello, '
  return `${greeting}your QHLC temporary password is: ${password}. Sign in at the portal and change your password right away. Do not share this code.`
}

async function sendViaTwilio(toDigits: string, body: string): Promise<WhatsAppSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  if (!sid || !token || !from) {
    return { ok: false, error: 'twilio_not_configured', skipped: true }
  }

  const to = `whatsapp:+${toDigits}`
  const fromNorm = from.trim().startsWith('whatsapp:')
    ? from.trim()
    : `whatsapp:${from.trim().startsWith('+') ? from.trim() : `+${from.trim()}`}`

  const params = new URLSearchParams({
    From: fromNorm,
    To: to,
    Body: body,
  })

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  const data = (await res.json().catch(() => ({}))) as { message?: string; code?: number }
  if (!res.ok) {
    console.error('[WhatsApp Twilio]', res.status, data)
    return { ok: false, error: data.message || `twilio_${res.status}` }
  }
  return { ok: true, provider: 'twilio' }
}

async function sendViaMeta(
  toDigits: string,
  password: string,
  fullMessage: string
): Promise<WhatsAppSendResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!accessToken || !phoneNumberId) {
    return { ok: false, error: 'meta_not_configured', skipped: true }
  }

  const templateName = process.env.WHATSAPP_TEMPLATE_NAME?.trim()
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANGUAGE?.trim() || 'en'
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`

  const payload = templateName
    ? {
        messaging_product: 'whatsapp',
        to: toDigits,
        type: 'template',
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: password }],
            },
          ],
        },
      }
    : {
        messaging_product: 'whatsapp',
        to: toDigits,
        type: 'text',
        text: { body: fullMessage },
      }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('[WhatsApp Meta]', res.status, data)
    const msg =
      typeof (data as { error?: { message?: string } }).error?.message === 'string'
        ? (data as { error: { message: string } }).error.message
        : JSON.stringify(data)
    return { ok: false, error: msg }
  }
  return { ok: true, provider: 'meta' }
}

/**
 * Twilio is tried first if fully configured; otherwise Meta Cloud API.
 */
export async function sendPasswordResetWhatsApp(options: {
  phone: string
  password: string
  fullName?: string | null
}): Promise<WhatsAppSendResult> {
  const digits = normalizeWhatsAppDigits(options.phone)
  if (!digits) {
    console.warn('[WhatsApp] Invalid phone, skip send')
    return { ok: false, error: 'invalid_phone', skipped: true }
  }

  const body = buildPasswordMessage(options.fullName, options.password)

  const twilioReady =
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM

  if (twilioReady) {
    const r = await sendViaTwilio(digits, body)
    if (r.ok || !r.skipped) return r
  }

  const metaReady = process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
  if (metaReady) {
    return sendViaMeta(digits, options.password, body)
  }

  console.warn(
    '[WhatsApp] No provider configured (Twilio or Meta). Set env vars to enable password delivery.'
  )
  return { ok: false, error: 'not_configured', skipped: true }
}
