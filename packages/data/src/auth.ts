import type { Session, User } from '@supabase/supabase-js';
import { getBandieClient } from './context';
import { mapAuthError } from './errors';

export type AuthResult = {
  user: User | null;
  session: Session | null;
  message?: string;
};

type AuthRedirectOptions = {
  emailRedirectTo?: string;
};

/**
 * Email confirmation is temporarily disabled (see supabase/config.toml and docs).
 * Re-enable confirmation emails and emailRedirectTo when turning verification back on.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
  options?: AuthRedirectOptions,
): Promise<AuthResult> {
  const client = getBandieClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: displayName ? { display_name: displayName } : undefined,
      emailRedirectTo: options?.emailRedirectTo,
    },
  });

  if (error) {
    throw new Error(mapAuthError(error.message));
  }

  return { user: data.user, session: data.session };
}

export async function signUpAndSignInWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResult> {
  const result = await signUpWithEmail(email, password, displayName);

  if (result.session) {
    return result;
  }

  return signInWithEmail(email, password);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const client = getBandieClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(mapAuthError(error.message));
  }

  if (data.user) {
    const { data: deleted, error: deletedError } = await client.rpc('bandie_profile_account_is_deleted', {
      p_user_id: data.user.id,
    });

    if (deletedError) {
      await client.auth.signOut();
      throw new Error(mapAuthError(deletedError.message));
    }

    if (deleted === true) {
      await client.auth.signOut();
      throw new Error('This account has been deleted.');
    }
  }

  return { user: data.user, session: data.session };
}

export async function resolveLoginEmail(identifier: string): Promise<string | null> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_resolve_login_email', {
    p_identifier: identifier.trim(),
  });

  if (error) {
    throw new Error(mapAuthError(error.message));
  }

  return typeof data === 'string' && data.trim() ? data.trim() : null;
}

export async function signInWithEmailOrUsername(
  identifier: string,
  password: string,
): Promise<AuthResult> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    throw new Error('Enter your email or username.');
  }

  const email = await resolveLoginEmail(trimmed);
  if (!email) {
    throw new Error('Email or password is incorrect.');
  }

  return signInWithEmail(email, password);
}

export async function signOut(): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.auth.signOut();
  if (error) {
    throw new Error(mapAuthError(error.message));
  }
}

export async function requestPasswordReset(
  identifier: string,
  redirectTo?: string,
): Promise<void> {
  const client = getBandieClient();
  const email = (await resolveLoginEmail(identifier)) ?? identifier.trim();
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    throw new Error(mapAuthError(error.message));
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.auth.updateUser({ password: newPassword });

  if (error) {
    throw new Error(mapAuthError(error.message));
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const client = getBandieClient();
  const { data, error } = await client.auth.getSession();
  if (error) {
    throw new Error(mapAuthError(error.message));
  }
  return data.session;
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  const client = getBandieClient();
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}
