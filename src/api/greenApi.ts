import type { TFunction } from '../i18n';
import type { Credentials, ReceiptNotification } from '../types';
import {
  demoCheckAccount,
  demoDeleteNotification,
  demoEnableHttpReceiving,
  demoGetStateInstance,
  demoReceiveNotification,
  demoSendMessage,
  isDemo,
} from './demo';

const API_URL = 'https://api.green-api.com';
const RECEIVE_TIMEOUT_SECONDS = 5;

export class GreenApiError extends Error {
  readonly status?: number;
  /** i18n key — when set, `errorMessage(error, t)` returns it in the active language. */
  readonly code?: string;
  readonly params?: Record<string, string | number>;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      params?: Record<string, string | number>;
    } = {},
  ) {
    super(message);
    this.name = 'GreenApiError';
    this.status = options.status;
    this.code = options.code;
    this.params = options.params;
  }
}

/** Human-readable message; translated when a translator is supplied. */
export function errorMessage(error: unknown, t?: TFunction): string {
  if (error instanceof GreenApiError) {
    if (t && error.code) return t(error.code, error.params);
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return t ? t('err.unexpected') : 'Unexpected error.';
}

function endpoint(credentials: Credentials, method: string): string {
  return `${API_URL}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}`;
}

/** Cleans up the body of a failed response so it can be shown in an error banner. */
function detailFromResponse(raw: string): string {
  let detail = raw.trim();
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    detail = String(parsed.error ?? parsed.message ?? parsed.reason ?? raw).trim();
  } catch {
    /* not a JSON body, keep raw text */
  }

  // Some failures come back as HTML pages — strip tags before showing them.
  detail = detail
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (detail.length > 200) detail = `${detail.slice(0, 200)}…`;
  return detail;
}

function errorFromResponse(status: number, raw: string): GreenApiError {
  if (status === 401 || status === 403) {
    return new GreenApiError('Invalid credentials (idInstance / apiTokenInstance) or access denied.', {
      status,
      code: 'err.invalidCreds',
    });
  }
  if (status === 429) {
    return new GreenApiError('Too many requests, please wait a moment and try again.', {
      status,
      code: 'err.rateLimit',
    });
  }
  const detail = detailFromResponse(raw);
  if (detail && detail !== '[object Object]') {
    // Message straight from the API — shown as-is.
    return new GreenApiError(detail, { status });
  }
  return new GreenApiError(`Request failed (HTTP ${status}).`, {
    status,
    code: 'err.serverRequest',
    params: { status },
  });
}

interface RequestOptions {
  body?: unknown;
  signal?: AbortSignal;
  /**
   * String appended right after the apiTokenInstance URL segment, e.g.
   * "?receiveTimeout=5" or "/1234567" for deleteNotification.
   */
  tail?: string;
}

async function request<T>(
  credentials: Credentials,
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T | null> {
  let response: Response;
  try {
    const url = `${endpoint(credentials, path)}${options.tail ?? ''}`;
    response = await fetch(url, {
      method,
      headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new GreenApiError('Unable to reach the GREEN-API server, check your connection.', {
      code: 'err.network',
    });
  }

  const text = await response.text();
  if (!response.ok) {
    throw errorFromResponse(response.status, text);
  }
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** GET getStateInstance — validates the credentials. */
export async function getStateInstance(credentials: Credentials): Promise<string | null> {
  if (isDemo(credentials)) return demoGetStateInstance();
  const data = await request<{ stateInstance?: string }>(credentials, 'GET', 'getStateInstance');
  return data?.stateInstance ?? null;
}

/** POST setSettings — enables notifications for HTTP API receiving (webhookUrl must stay empty). */
export async function enableHttpReceiving(credentials: Credentials): Promise<void> {
  if (isDemo(credentials)) {
    demoEnableHttpReceiving();
    return;
  }
  await request(credentials, 'POST', 'setSettings', {
    body: {
      webhookUrl: '',
      outgoingWebhook: 'yes',
      stateWebhook: 'yes',
      incomingWebhook: 'yes',
    },
  });
}

/** POST checkAccount — resolves a phone number to a chatId. */
export async function checkAccount(
  credentials: Credentials,
  phoneNumber: string,
): Promise<{ exist: boolean; chatId: string }> {
  if (isDemo(credentials)) return demoCheckAccount(phoneNumber);
  const data = await request<{
    exist?: boolean;
    chatId?: string;
    status?: boolean;
    reason?: string;
  }>(credentials, 'POST', 'checkAccount', { body: { phoneNumber: Number(phoneNumber) } });

  if (!data) throw new GreenApiError('Empty response from the server.', { code: 'err.emptyResponse' });
  if (data.status === false) {
    throw data.reason
      ? new GreenApiError(data.reason)
      : new GreenApiError('Unable to check this phone number.', { code: 'err.checkAccount' });
  }
  return { exist: Boolean(data.exist), chatId: data.chatId ?? '' };
}

/** POST sendMessage — sends a text message (max 4000 characters). */
export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string,
): Promise<string> {
  if (isDemo(credentials)) return demoSendMessage(chatId, message);
  const data = await request<{ idMessage?: string }>(credentials, 'POST', 'sendMessage', {
    body: { chatId, message },
  });
  if (!data?.idMessage) {
    throw new GreenApiError('The message was not accepted for sending.', { code: 'err.notAccepted' });
  }
  return data.idMessage;
}

/**
 * GET receiveNotification — long-polls for the next notification.
 * Resolves with null on timeout (empty body).
 */
export async function receiveNotification(
  credentials: Credentials,
  signal?: AbortSignal,
): Promise<ReceiptNotification | null> {
  if (isDemo(credentials)) return demoReceiveNotification(signal);
  return request<ReceiptNotification>(credentials, 'GET', 'receiveNotification', {
    signal,
    tail: `?receiveTimeout=${RECEIVE_TIMEOUT_SECONDS}`,
  });
}

/**
 * DELETE deleteNotification/{token}/{receiptId} — acknowledges the notification
 * and removes it from the queue (receiptId is a path segment).
 */
export async function deleteNotification(credentials: Credentials, receiptId: number): Promise<void> {
  if (isDemo(credentials)) {
    demoDeleteNotification(receiptId);
    return;
  }
  await request(credentials, 'DELETE', 'deleteNotification', { tail: `/${receiptId}` });
}
