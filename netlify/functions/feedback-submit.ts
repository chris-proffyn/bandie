import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  buildFeedbackEmailContent,
  FEEDBACK_INBOX,
  validateFeedbackBody,
  type FeedbackRequestBody,
} from './lib/feedbackEmail';
import { errorResponse, jsonResponse } from './lib/http';
import { isResendConfigured, sendResendEmail } from './lib/resend';
import { getSupabaseAdmin, getUserFromBearerToken } from './lib/supabase';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  if (!isResendConfigured()) {
    return errorResponse('Feedback is not available yet. Email delivery is not configured.', 503);
  }

  try {
    const user = await getUserFromBearerToken(
      new Request('http://localhost', {
        headers: event.headers as HeadersInit,
      }),
    );

    if (!user) {
      return errorResponse('Authentication required.', 401);
    }

    const body = event.body ? (JSON.parse(event.body) as FeedbackRequestBody) : {};
    const payload = validateFeedbackBody(body);

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('bandie_profiles')
      .select('display_name, username')
      .eq('user_id', user.id)
      .maybeSingle();

    const displayName =
      (profile?.display_name as string | null)?.trim() ||
      (user.user_metadata?.display_name as string | undefined)?.trim() ||
      user.email?.split('@')[0] ||
      'Bandie user';

    const emailContent = buildFeedbackEmailContent(payload, {
      userId: user.id,
      email: user.email ?? null,
      displayName,
      username: (profile?.username as string | null) ?? null,
    });

    await sendResendEmail({
      to: FEEDBACK_INBOX,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      replyTo: emailContent.replyTo,
    });

    return jsonResponse({ sent: true });
  } catch (err) {
    console.error('feedback-submit failed', err);
    return errorResponse(err instanceof Error ? err.message : 'Unable to send feedback.', 400);
  }
};
