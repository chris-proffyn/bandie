import { getCurrentSession } from './auth';

export type SubmitFeedbackInput = {
  subject?: string;
  message: string;
  pageUrl?: string;
};

async function parseFeedbackApiJson<T>(response: Response): Promise<T> {
  const body = await response.text();
  try {
    return JSON.parse(body) as T;
  } catch {
    const firstLine = body.split('\n').find((line) => line.trim())?.trim();
    throw new Error(firstLine?.slice(0, 240) ?? 'Unexpected response from feedback API.');
  }
}

export async function submitFeedback(input: SubmitFeedbackInput): Promise<void> {
  const message = input.message.trim();
  if (!message) {
    throw new Error('Please enter your feedback message.');
  }

  const session = await getCurrentSession();
  if (!session?.access_token) {
    throw new Error('Sign in to send feedback.');
  }

  const response = await fetch('/api/feedback/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject: input.subject?.trim() || undefined,
      message,
      pageUrl: input.pageUrl?.trim() || undefined,
    }),
  });

  const payload = await parseFeedbackApiJson<{ sent?: boolean; error?: string }>(response);
  if (!response.ok || !payload.sent) {
    throw new Error(payload.error ?? 'Unable to send feedback.');
  }
}
