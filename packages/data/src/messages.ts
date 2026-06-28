import { getBandieClient } from './context';
import { normalizeUsername } from './username';

export type UserMessage = {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  sender_display_name: string | null;
  sender_username: string | null;
  recipient_display_name: string | null;
  recipient_username: string | null;
  body: string;
  read_at: string | null;
  reply_to_message_id: string | null;
  reply_to_body: string | null;
  created_at: string;
};

export type SendDirectMessageInput = {
  recipientUsername: string;
  body: string;
  replyToMessageId?: string | null;
};

export type ReplyToMessageInput = {
  messageId: string;
  body: string;
};

export async function listMyMessages(): Promise<UserMessage[]> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_list_my_messages');

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function countUnreadMessages(): Promise<number> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_count_my_unread_messages');

  if (error) {
    throw new Error(error.message);
  }

  return typeof data === 'number' ? data : 0;
}

async function resolveRecipientUserId(username: string): Promise<string> {
  const client = getBandieClient();
  const normalized = normalizeUsername(username);

  if (!normalized) {
    throw new Error('Enter a valid Bandie username.');
  }

  const { data, error } = await client
    .from('bandie_profiles')
    .select('user_id')
    .eq('username', normalized)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.user_id) {
    throw new Error('No Bandie user found with that username.');
  }

  return data.user_id;
}

export async function sendDirectMessageToUser(recipientUserId: string, body: string): Promise<void> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in to send a message.');
  }

  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new Error('Message cannot be empty.');
  }

  if (recipientUserId === user.id) {
    throw new Error('You cannot send a message to yourself.');
  }

  const { error } = await client.from('bandie_user_messages').insert({
    sender_user_id: user.id,
    recipient_user_id: recipientUserId,
    body: trimmedBody,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendDirectMessage(input: SendDirectMessageInput): Promise<void> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in to send a message.');
  }

  const body = input.body.trim();
  if (!body) {
    throw new Error('Message cannot be empty.');
  }

  const recipientUserId = await resolveRecipientUserId(input.recipientUsername);

  if (recipientUserId === user.id) {
    throw new Error('You cannot send a message to yourself.');
  }

  const { error } = await client.from('bandie_user_messages').insert({
    sender_user_id: user.id,
    recipient_user_id: recipientUserId,
    body,
    reply_to_message_id: input.replyToMessageId ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function replyToMessage(input: ReplyToMessageInput): Promise<void> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in to reply.');
  }

  const body = input.body.trim();
  if (!body) {
    throw new Error('Message cannot be empty.');
  }

  const { data: parent, error: parentError } = await client
    .from('bandie_user_messages')
    .select('id, sender_user_id, recipient_user_id')
    .eq('id', input.messageId)
    .maybeSingle();

  if (parentError) {
    throw new Error(parentError.message);
  }

  if (!parent) {
    throw new Error('Original message not found.');
  }

  if (parent.sender_user_id !== user.id && parent.recipient_user_id !== user.id) {
    throw new Error('You cannot reply to this message.');
  }

  const recipientUserId =
    parent.sender_user_id === user.id ? parent.recipient_user_id : parent.sender_user_id;

  if (recipientUserId === user.id) {
    throw new Error('You cannot send a message to yourself.');
  }

  const { error } = await client.from('bandie_user_messages').insert({
    sender_user_id: user.id,
    recipient_user_id: recipientUserId,
    body,
    reply_to_message_id: parent.id,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function markMessageRead(messageId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client
    .from('bandie_user_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('read_at', null);

  if (error) {
    throw new Error(error.message);
  }
}
