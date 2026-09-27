import i18n from '../i18n';

/**
 * Sanitizes technical developer errors (e.g., JSON parse errors, network failures, stack traces)
 * into clean, user-friendly internationalized messages for end users.
 */
export function sanitizeErrorMessage(err: unknown, fallbackKey = 'error.general'): string {
  if (!err) return i18n.t('error.general', 'An unexpected error occurred. Please try again.');

  const rawMessage = typeof err === 'string' 
    ? err 
    : (err as any)?.message || String(err);

  const lower = rawMessage.toLowerCase();

  // 1. Technical / Internal Parser errors
  if (
    lower.includes('unexpected end of json') ||
    lower.includes('failed to execute') ||
    lower.includes('json.parse') ||
    lower.includes('syntaxerror') ||
    lower.includes('typeerror') ||
    lower.includes('unexpected token')
  ) {
    return i18n.t('error.serverError', 'The server returned an invalid response. Please try again later.');
  }

  // 2. Network / Connection errors
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('econnrefused') ||
    lower.includes('abort')
  ) {
    return i18n.t('error.networkError', 'Unable to connect to the server. Please check your internet connection.');
  }

  // 3. Unauthorized / Invalid Credentials
  if (
    lower.includes('invalid credentials') ||
    lower.includes('invalid email') ||
    lower.includes('invalid password') ||
    lower.includes('unauthorized') ||
    lower.includes('user not found')
  ) {
    return i18n.t('error.invalidCredentials', 'Invalid email address or password. Please try again.');
  }

  // 4. Server internal errors (500 / 502 / 503 / 504)
  if (
    lower.includes('500') ||
    lower.includes('502') ||
    lower.includes('503') ||
    lower.includes('504') ||
    lower.includes('internal_error')
  ) {
    return i18n.t('error.serverError', 'The server encountered an error. Please try again later.');
  }

  // Return clean readable messages if short and non-technical
  if (rawMessage.length < 100 && !rawMessage.includes('at ') && !rawMessage.includes('HTTP')) {
    return rawMessage;
  }

  return i18n.t(fallbackKey, 'An unexpected error occurred. Please try again.');
}
