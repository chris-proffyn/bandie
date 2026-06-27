export function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Email or password is incorrect.';
  }

  if (normalized.includes('user already registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.';
  }

  if (normalized.includes('password should be at least')) {
    return 'Password must be at least 6 characters.';
  }

  return message;
}
