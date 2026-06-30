import type { Handler, HandlerEvent } from '@netlify/functions';
import { errorResponse, jsonResponse } from './lib/http';
import { copySongToBandServer } from './lib/songCopyServer';
import { getSupabaseAdmin, getUserFromBearerToken, userOwnsBand } from './lib/supabase';

type CopyBody = {
  sourceBandId?: string;
  sourceSongId?: string;
  targetBandId?: string;
  title?: string;
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const user = await getUserFromBearerToken(
      new Request('http://localhost', { headers: event.headers as HeadersInit }),
    );

    if (!user) {
      return errorResponse('Authentication required.', 401);
    }

    const body = event.body ? (JSON.parse(event.body) as CopyBody) : {};
    const sourceBandId = body.sourceBandId?.trim();
    const sourceSongId = body.sourceSongId?.trim();
    const targetBandId = body.targetBandId?.trim();
    const title = body.title?.trim();

    if (!sourceBandId || !sourceSongId || !targetBandId) {
      return errorResponse('sourceBandId, sourceSongId and targetBandId are required.', 400);
    }

    const [ownsSource, ownsTarget] = await Promise.all([
      userOwnsBand(user.id, sourceBandId),
      userOwnsBand(user.id, targetBandId),
    ]);

    if (!ownsSource || !ownsTarget) {
      return errorResponse('Only band leaders can copy songs between bands they lead.', 403);
    }

    const admin = getSupabaseAdmin();
    const result = await copySongToBandServer(admin, user.id, {
      sourceBandId,
      sourceSongId,
      targetBandId,
      title: title || undefined,
    });

    return jsonResponse({ result });
  } catch (err) {
    console.error('songs-copy-to-band failed', err);
    return errorResponse(err instanceof Error ? err.message : 'Unable to copy song.', 500);
  }
};
