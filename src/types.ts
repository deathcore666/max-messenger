export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
}

export interface Chat {
  /** chatId from GREEN-API, e.g. "10000000" */
  id: string;
  /** display title: formatted phone number or contact name */
  title: string;
  createdAt: number;
}

export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface Message {
  /** idMessage from GREEN-API, or a local temp id while sending */
  id: string;
  chatId: string;
  text: string;
  author: 'me' | 'them';
  /** unix time in milliseconds */
  timestamp: number;
  status?: MessageStatus;
}

export interface ChatSummary extends Chat {
  lastText?: string;
  lastTime?: string;
}

/** Parsed incoming text message, ready for the store. */
export interface IncomingTextMessage {
  idMessage: string;
  chatId: string;
  text: string;
  senderName?: string;
  chatName?: string;
  /** unix time in milliseconds */
  timestamp: number;
}

export interface NotificationPayload {
  typeWebhook: string;
  timestamp?: number;
  idMessage?: string;
  instanceData?: {
    idInstance: number;
    wid: string;
    typeInstance: string;
  };
  senderData?: {
    chatId: string;
    chatName?: string;
    chatType?: string;
    sender?: string;
    senderName?: string;
    senderPhoneNumber?: number;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: {
      textMessage: string;
    };
  };
}

export interface ReceiptNotification {
  receiptId: number;
  body: NotificationPayload;
}
