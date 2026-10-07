import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  checkAccount,
  enableHttpReceiving,
  errorMessage,
  getStateInstance,
  GreenApiError,
  sendMessage,
} from './api/greenApi';
import { buildDemoData, configureDemo, DEMO_CREDENTIALS, isDemo } from './api/demo';
import ChatHeader from './components/ChatHeader';
import Composer from './components/Composer';
import LoginForm from './components/LoginForm';
import MessageList from './components/MessageList';
import Sidebar from './components/Sidebar';
import { useI18n } from './hooks/useI18n';
import { useMessagePoller } from './hooks/useMessagePoller';
import { usePersistentState } from './hooks/usePersistentState';
import { useTheme } from './hooks/useTheme';
import type { Chat, ChatSummary, Credentials, IncomingTextMessage, Message } from './types';

const CREDENTIALS_KEY = 'max-client.credentials';
const CHATS_KEY = 'max-client.chats';
const MESSAGES_KEY = 'max-client.messages';
const ACTIVE_CHAT_KEY = 'max-client.active-chat';

const MAX_STORED_MESSAGES = 1000;

/** Accepts 7XXXXXXXXXX (RF) and 375XXXXXXXXX (BY), tolerant of separators and a leading 8. */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const normalized = digits.startsWith('8') && digits.length === 11 ? `7${digits.slice(1)}` : digits;
  return /^(7\d{10}|375\d{9})$/.test(normalized) ? normalized : null;
}

function timeLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

type ChatSummaryRow = ChatSummary & { lastTs: number };

/** Setup warnings are stored as i18n keys so they follow the language switch. */
interface SetupWarning {
  code: string;
  params?: Record<string, string | number>;
}

export default function App() {
  const [credentials, setCredentials] = usePersistentState<Credentials | null>(
    CREDENTIALS_KEY,
    null,
  );
  const [chats, setChats] = usePersistentState<Chat[]>(CHATS_KEY, []);
  const [messages, setMessages] = usePersistentState<Message[]>(MESSAGES_KEY, []);
  const [activeChatId, setActiveChatId] = usePersistentState<string | null>(ACTIVE_CHAT_KEY, null);
  const [theme, toggleTheme] = useTheme();
  const { lang, setLang, t } = useI18n();

  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<Error | null>(null);
  const [setupWarning, setSetupWarning] = useState<SetupWarning | null>(null);
  const [sendError, setSendError] = useState<Error | null>(null);
  const [demoNoticeDismissed, setDemoNoticeDismissed] = useState(false);

  const demoMode = isDemo(credentials);

  // Demo bot replies follow the selected language.
  useEffect(() => {
    configureDemo(lang);
  }, [lang]);

  // --- credentials -------------------------------------------------------------

  const handleConnect = async (next: Credentials) => {
    setLoginBusy(true);
    setLoginError(null);
    setSetupWarning(null);
    try {
      const state = await getStateInstance(next);
      if (state === 'invalidToken') {
        throw new GreenApiError('Invalid idInstance or apiTokenInstance.', {
          code: 'err.invalidToken',
        });
      }
      setCredentials(next);
      setDemoNoticeDismissed(false);
      if (state && state !== 'authorized') {
        setSetupWarning({ code: 'setup.notAuthorized', params: { state } });
      }
      try {
        await enableHttpReceiving(next);
      } catch {
        setSetupWarning({ code: 'setup.setSettings' });
      }

      // First entry into the demo: seed chats and message history.
      if (isDemo(next) && chats.length === 0) {
        const seeded = buildDemoData(lang);
        setChats(seeded.chats);
        setMessages(seeded.messages);
        setActiveChatId(seeded.chats[0]?.id ?? null);
      }
    } catch (error) {
      setLoginError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoginBusy(false);
    }
  };

  const handleDemo = () => {
    void handleConnect(DEMO_CREDENTIALS);
  };

  const handleDisconnect = () => {
    setCredentials(null);
    setChats([]);
    setMessages([]);
    setActiveChatId(null);
    setSetupWarning(null);
    setSendError(null);
  };

  // --- incoming messages -------------------------------------------------------

  const handleIncoming = useCallback((incoming: IncomingTextMessage) => {
    setMessages((prev) => {
      const duplicate = prev.some(
        (message) => message.id === incoming.idMessage && message.chatId === incoming.chatId,
      );
      if (duplicate) return prev;
      return [
        ...prev,
        {
          id: incoming.idMessage,
          chatId: incoming.chatId,
          text: incoming.text,
          author: 'them',
          timestamp: incoming.timestamp,
        },
      ];
    });

    setChats((prev) => {
      if (prev.some((chat) => chat.id === incoming.chatId)) return prev;
      return [
        ...prev,
        {
          id: incoming.chatId,
          title: incoming.senderName || incoming.chatName || incoming.chatId,
          createdAt: incoming.timestamp,
        },
      ];
    });

    // Never leave the user on an empty screen when the first reply arrives.
    setActiveChatId((current) => current ?? incoming.chatId);
  }, [setChats, setActiveChatId, setMessages]);

  const pollError = useMessagePoller(credentials, handleIncoming);

  // --- creating a chat ---------------------------------------------------------

  const handleCreateChat = useCallback(
    async (rawPhone: string): Promise<Error | null> => {
      if (!credentials) {
        return new GreenApiError('Not connected to GREEN-API.', { code: 'err.notConnected' });
      }
      const phone = normalizePhone(rawPhone);
      if (!phone) {
        return new GreenApiError('Enter a valid phone number: 7XXXXXXXXXX or 375XXXXXXXXX.', {
          code: 'err.badPhone',
        });
      }
      try {
        const { exist, chatId } = await checkAccount(credentials, phone);
        if (!exist || !chatId) {
          return new GreenApiError('No MAX account found for this number.', {
            code: 'err.noAccount',
          });
        }
        setChats((prev) =>
          prev.some((chat) => chat.id === chatId)
            ? prev
            : [...prev, { id: chatId, title: `+${phone}`, createdAt: Date.now() }],
        );
        setActiveChatId(chatId);
        return null;
      } catch (error) {
        return error instanceof Error ? error : new Error(String(error));
      }
    },
    [credentials, setActiveChatId, setChats],
  );

  // --- sending -----------------------------------------------------------------

  const handleSend = useCallback(
    async (text: string) => {
      if (!credentials || !activeChatId) return;
      setSendError(null);
      const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const outgoing: Message = {
        id: tempId,
        chatId: activeChatId,
        text,
        author: 'me',
        timestamp: Date.now(),
        status: 'sending',
      };
      setMessages((prev) => [...prev, outgoing]);
      try {
        const idMessage = await sendMessage(credentials, activeChatId, text);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === tempId ? { ...message, id: idMessage, status: 'sent' } : message,
          ),
        );
      } catch (error) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === tempId ? { ...message, status: 'failed' } : message,
          ),
        );
        setSendError(error instanceof Error ? error : new Error(String(error)));
      }
    },
    [activeChatId, credentials, setMessages],
  );

  // --- housekeeping -------------------------------------------------------------

  useEffect(() => {
    if (messages.length > MAX_STORED_MESSAGES) {
      setMessages((prev) => prev.slice(-MAX_STORED_MESSAGES));
    }
  }, [messages, setMessages]);

  const chatRows = useMemo<ChatSummaryRow[]>(() => {
    const lastByChat = new Map<string, Message>();
    for (const message of messages) {
      const current = lastByChat.get(message.chatId);
      if (!current || message.timestamp >= current.timestamp) {
        lastByChat.set(message.chatId, message);
      }
    }
    return chats
      .map((chat) => {
        const last = lastByChat.get(chat.id);
        return {
          ...chat,
          lastText: last?.text,
          lastTime: last ? timeLabel(last.timestamp) : undefined,
          lastTs: last?.timestamp ?? chat.createdAt,
        };
      })
      .sort((a, b) => b.lastTs - a.lastTs);
  }, [chats, messages]);

  const activeChat = activeChatId ? (chats.find((chat) => chat.id === activeChatId) ?? null) : null;
  const errorBanner = sendError
    ? errorMessage(sendError, t)
    : pollError
      ? errorMessage(pollError, t)
      : setupWarning
        ? t(setupWarning.code, setupWarning.params)
        : null;
  const demoBanner = demoMode && !demoNoticeDismissed ? t('demo.banner') : null;
  const bannerText = errorBanner ?? demoBanner;

  if (!credentials) {
    return (
      <LoginForm
        onConnect={handleConnect}
        onDemo={handleDemo}
        busy={loginBusy}
        error={loginError ? errorMessage(loginError, t) : null}
        theme={theme}
        onToggleTheme={toggleTheme}
        lang={lang}
        onSetLang={setLang}
        t={t}
      />
    );
  }

  return (
    <div className={`app${activeChat ? ' has-chat' : ''}`}>
      <Sidebar
        chats={chatRows}
        activeChatId={activeChat?.id ?? null}
        onSelect={setActiveChatId}
        onNewChat={handleCreateChat}
        onLogout={handleDisconnect}
        theme={theme}
        onToggleTheme={toggleTheme}
        lang={lang}
        onSetLang={setLang}
        t={t}
      />

      <main className="chat">
        {activeChat ? (
          <>
            <ChatHeader
              chat={activeChat}
              onBack={() => setActiveChatId(null)}
              demo={demoMode}
              lang={lang}
              onSetLang={setLang}
              theme={theme}
              onToggleTheme={toggleTheme}
              t={t}
            />
            {bannerText && (
              <div className="banner" role="status">
                <span>{bannerText}</span>
                <button
                  type="button"
                  className="banner-close"
                  onClick={() => {
                    setSendError(null);
                    setSetupWarning(null);
                    if (!errorBanner) setDemoNoticeDismissed(true);
                  }}
                  aria-label={t('action.dismiss')}
                >
                  ×
                </button>
              </div>
            )}
            <MessageList chatId={activeChat.id} messages={messages} t={t} />
            <Composer onSend={handleSend} t={t} />
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-logo">MAX</div>
            <p>{t('chat.empty')}</p>
          </div>
        )}
      </main>
    </div>
  );
}
