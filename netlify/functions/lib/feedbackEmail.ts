export const FEEDBACK_INBOX = 'info@dontpanicapps.click';

export const FEEDBACK_MESSAGE_MAX_LENGTH = 5000;
export const FEEDBACK_SUBJECT_MAX_LENGTH = 160;

export type FeedbackRequestBody = {
  subject?: string;
  message?: string;
  pageUrl?: string;
};

export type FeedbackSenderContext = {
  userId: string;
  email: string | null;
  displayName: string;
  username: string | null;
};

export type ValidatedFeedbackPayload = {
  subject: string;
  message: string;
  pageUrl: string | null;
};

function normalizeOptionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

export function validateFeedbackBody(body: FeedbackRequestBody): ValidatedFeedbackPayload {
  const message = normalizeOptionalText(body.message, FEEDBACK_MESSAGE_MAX_LENGTH);
  if (!message) {
    throw new Error('Please enter your feedback message.');
  }

  const subject =
    normalizeOptionalText(body.subject, FEEDBACK_SUBJECT_MAX_LENGTH) ?? 'Bandie feedback';
  const pageUrl = normalizeOptionalText(body.pageUrl, 500);

  return {
    subject,
    message,
    pageUrl,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildFeedbackEmailContent(
  payload: ValidatedFeedbackPayload,
  sender: FeedbackSenderContext,
): { subject: string; html: string; text: string; replyTo?: string } {
  const subject = `[Bandie feedback] ${payload.subject}`;
  const senderLabel = sender.displayName || sender.email || sender.userId;
  const lines = [
    `From: ${senderLabel}`,
    sender.email ? `Email: ${sender.email}` : null,
    sender.username ? `Username: @${sender.username}` : null,
    `User ID: ${sender.userId}`,
    payload.pageUrl ? `Page: ${payload.pageUrl}` : null,
    '',
    payload.message,
  ].filter((line): line is string => line !== null);

  const text = lines.join('\n');
  const html = [
    '<p><strong>Bandie user feedback</strong></p>',
    '<ul>',
    `<li><strong>From:</strong> ${escapeHtml(senderLabel)}</li>`,
    sender.email ? `<li><strong>Email:</strong> ${escapeHtml(sender.email)}</li>` : '',
    sender.username ? `<li><strong>Username:</strong> @${escapeHtml(sender.username)}</li>` : '',
    `<li><strong>User ID:</strong> ${escapeHtml(sender.userId)}</li>`,
    payload.pageUrl ? `<li><strong>Page:</strong> ${escapeHtml(payload.pageUrl)}</li>` : '',
    '</ul>',
    `<p>${escapeHtml(payload.message).replaceAll('\n', '<br />')}</p>`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject,
    html,
    text,
    replyTo: sender.email ?? undefined,
  };
}
