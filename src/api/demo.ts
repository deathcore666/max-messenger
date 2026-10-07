import type { Lang } from '../i18n';
import type { Chat, Credentials, Message, ReceiptNotification } from '../types';

/**
 * Test credentials that put the client into the built-in demo mode.
 * Every API call is answered locally — no network traffic, no real messages.
 */
export const DEMO_CREDENTIALS: Credentials = { idInstance: 'demo', apiTokenInstance: 'demo' };

export function isDemo(credentials: Credentials | null | undefined): boolean {
  return (
    credentials?.idInstance === DEMO_CREDENTIALS.idInstance &&
    credentials?.apiTokenInstance === DEMO_CREDENTIALS.apiTokenInstance
  );
}

// --- simulator state ---------------------------------------------------------

let lang: Lang = 'ru';
let receiptSeq = 7000;
let messageSeq = 0;
let replyIndex = 0;

/** Notifications waiting to be delivered by demoReceiveNotification. */
let queue: ReceiptNotification[] = [];

export function configureDemo(nextLang: Lang): void {
  lang = nextLang;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function enqueueIncoming(chatId: string, text: string): void {
  messageSeq += 1;
  queue.push({
    receiptId: (receiptSeq += 1),
    body: {
      typeWebhook: 'incomingMessageReceived',
      timestamp: Math.floor(Date.now() / 1000),
      idMessage: `demo-in-${messageSeq}`,
      senderData: {
        chatId,
        chatName: chatId,
        chatType: 'user',
        sender: chatId,
        senderName: chatId,
      },
      messageData: {
        typeMessage: 'textMessage',
        textMessageData: { textMessage: text },
      },
    },
  });
}

// --- canned bot replies ------------------------------------------------------

const REPLIES: Record<Lang, string[]> = {
  ru: [
    'Принято, спасибо!',
    'Это автоответ демо-режима — сообщения никуда не отправляются 🙂',
    'Хорошо, договорились.',
    'Давай обсудим это завтра?',
    'Понял 👍',
  ],
  en: [
    'Got it, thanks!',
    'This is an automatic demo reply — nothing is sent anywhere 🙂',
    'Sounds good.',
    "Let's discuss it tomorrow?",
    'Understood 👍',
  ],
};

// --- API surface used by greenApi.ts ----------------------------------------

export function demoGetStateInstance(): string {
  return 'authorized';
}

export function demoEnableHttpReceiving(): void {
  /* notifications are simulated locally */
}

export function demoCheckAccount(phoneNumber: string): { exist: boolean; chatId: string } {
  return { exist: true, chatId: phoneNumber };
}

export function demoSendMessage(chatId: string, _message: string): string {
  messageSeq += 1;
  const idMessage = `demo-out-${messageSeq}`;
  const replies = REPLIES[lang];
  const reply = replies[(replyIndex += 1) % replies.length];
  window.setTimeout(() => enqueueIncoming(chatId, reply), 1400);
  return idMessage;
}

/** Long-polls the local queue, mirroring the 5s ReceiveNotification timeout. */
export async function demoReceiveNotification(
  signal?: AbortSignal,
): Promise<ReceiptNotification | null> {
  const deadline = Date.now() + 4600;
  while (Date.now() < deadline) {
    if (queue.length > 0) {
      await sleep(120, signal); // simulate delivery latency
      return queue[0] ?? null;
    }
    await sleep(100, signal);
  }
  return null;
}

export function demoDeleteNotification(receiptId: number): void {
  queue = queue.filter((item) => item.receiptId !== receiptId);
}

// --- seeded data -------------------------------------------------------------

export interface DemoData {
  chats: Chat[];
  messages: Message[];
}

const SEED_TITLES: Record<Lang, [string, string, string]> = {
  ru: ['Анна Петрова', 'Дизайн-команда', 'Поддержка MAX'],
  en: ['Anna Petrova', 'Design team', 'MAX support'],
};

const SEED_SCRIPT: Record<Lang, Array<Array<{ me?: boolean; text: string; ago: number }>>> = {
  ru: [
    [
      { text: 'Привет! Как дела с макетом главной страницы?', ago: 190 },
      { me: true, text: 'Почти готово, покажу варианты через час', ago: 185 },
      { text: 'Отлично, жду 👍', ago: 183 },
    ],
    [
      { text: 'Напоминаю: ретро в 16:00', ago: 42 },
      { text: 'Ссылка на доску — в закрепе канала', ago: 41 },
    ],
    [
      { text: 'Здравствуйте! Ваш тикет №4821 закрыт.', ago: 1500 },
      { me: true, text: 'Спасибо большое!', ago: 1440 },
    ],
  ],
  en: [
    [
      { text: 'Hi! How is the homepage mockup going?', ago: 190 },
      { me: true, text: 'Almost done, I will show the options in an hour', ago: 185 },
      { text: 'Great, waiting 👍', ago: 183 },
    ],
    [
      { text: 'Reminder: retro at 16:00', ago: 42 },
      { text: 'Board link is pinned in the channel', ago: 41 },
    ],
    [
      { text: 'Hello! Your ticket #4821 has been closed.', ago: 1500 },
      { me: true, text: 'Thank you very much!', ago: 1440 },
    ],
  ],
};

const MINUTE = 60_000;

/** Pre-seeded chats and messages shown right after entering the demo. */
export function buildDemoData(nextLang: Lang): DemoData {
  const now = Date.now();
  const titles = SEED_TITLES[nextLang];
  const script = SEED_SCRIPT[nextLang];
  const chats: Chat[] = [];
  const messages: Message[] = [];

  script.forEach((thread, index) => {
    const chatId = `1000002${index + 1}`;
    const createdAt = now - (thread[0]?.ago ?? 0) * MINUTE;
    chats.push({ id: chatId, title: titles[index], createdAt });
    thread.forEach((entry) => {
      messageSeq += 1;
      messages.push({
        id: `demo-seed-${messageSeq}`,
        chatId,
        text: entry.text,
        author: entry.me ? 'me' : 'them',
        timestamp: now - entry.ago * MINUTE,
        status: entry.me ? 'sent' : undefined,
      });
    });
  });

  return { chats, messages };
}
