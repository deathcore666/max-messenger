import { useEffect, useRef, useState } from 'react';
import { deleteNotification, GreenApiError, receiveNotification } from '../api/greenApi';
import type { Credentials, IncomingTextMessage, NotificationPayload } from '../types';

const ERROR_BACKOFF_MS = 2000;

/** Extracts an incoming text message from a notification body, ignoring every other type. */
export function extractTextMessage(body: NotificationPayload): IncomingTextMessage | null {
  if (body.typeWebhook !== 'incomingMessageReceived') return null;
  if (body.messageData?.typeMessage !== 'textMessage') return null;

  const text = body.messageData.textMessageData?.textMessage;
  const chatId = body.senderData?.chatId;
  if (!text || !chatId) return null;

  return {
    idMessage: body.idMessage ?? `${chatId}-${body.timestamp ?? Date.now()}`,
    chatId,
    text,
    senderName: body.senderData?.senderName,
    chatName: body.senderData?.chatName,
    timestamp: (body.timestamp ?? Math.floor(Date.now() / 1000)) * 1000,
  };
}

/**
 * Long-polls ReceiveNotification while credentials are set and feeds parsed
 * incoming text messages to `onMessage`. Every received notification is
 * acknowledged with DeleteNotification so the queue keeps draining.
 *
 * Returns the current connection/polling error (translate it at render time
 * with `errorMessage(err, t)`), or null when healthy.
 */
export function useMessagePoller(
  credentials: Credentials | null,
  onMessage: (message: IncomingTextMessage) => void,
): GreenApiError | null {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const [error, setError] = useState<GreenApiError | null>(null);

  useEffect(() => {
    if (!credentials) {
      setError(null);
      return;
    }

    let stopped = false;
    let wake: (() => void) | null = null;
    const abort = new AbortController();

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = window.setTimeout(() => {
          wake = null;
          resolve();
        }, ms);
        wake = () => {
          window.clearTimeout(timer);
          wake = null;
          resolve();
        };
      });

    const run = async () => {
      while (!stopped) {
        try {
          const receipt = await receiveNotification(credentials, abort.signal);
          if (stopped) break;
          // A successful poll (even an empty one) means the connection recovered.
          setError(null);
          if (!receipt) continue; // 5s timeout with an empty queue — poll again

          const { receiptId, body } = receipt;
          try {
            const message = extractTextMessage(body);
            if (message) onMessageRef.current(message);
          } finally {
            try {
              await deleteNotification(credentials, receiptId);
            } catch {
              /* the notification is acknowledged best-effort */
            }
          }
          setError(null);
        } catch (err) {
          if (stopped) break;
          if (err instanceof DOMException && err.name === 'AbortError') break;
          setError(
            err instanceof GreenApiError && err.code
              ? err
              : new GreenApiError('Connection to GREEN-API lost, retrying…', { code: 'poll.lost' }),
          );
          await wait(ERROR_BACKOFF_MS);
        }
      }
    };

    void run();

    return () => {
      stopped = true;
      abort.abort();
      if (wake) wake();
    };
  }, [credentials]);

  return error;
}
