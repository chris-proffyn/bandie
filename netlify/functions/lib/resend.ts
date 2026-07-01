const RESEND_API_URL = 'https://api.resend.com/emails';

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getResendFromEmail(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured) {
    return configured;
  }

  return 'Bandie Feedback <onboarding@resend.dev>';
}

type SendResendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendResendEmail(input: SendResendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getResendFromEmail(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const detail = body.trim().slice(0, 240) || response.statusText;
    throw new Error(`Resend request failed (${response.status}): ${detail}`);
  }
}
