export type Lang = 'en' | 'ru';

export const LANGS: ReadonlyArray<{ code: Lang; label: string }> = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
];

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

const en: Record<string, string> = {
  // theme
  'theme.label': 'Dark mode',
  'theme.toLight': 'Switch to light mode',
  'theme.toDark': 'Switch to dark mode',

  // language
  'lang.label': 'Language',

  // login
  'login.title': 'Connect to GREEN-API',
  'login.hint': 'Enter the idInstance and apiTokenInstance of your MAX instance from the',
  'login.console': 'GREEN-API console',
  'login.connect': 'Connect',
  'login.connecting': 'Connecting…',
  'login.demo': 'Try the demo (no credentials needed)',
  'login.demoShort': 'Demo mode',

  // common actions
  'action.disconnect': 'Disconnect',
  'action.dismiss': 'Dismiss',
  'action.back': 'Back',

  // demo mode
  'demo.banner': 'Demo mode: chats are pre-seeded and replies are simulated locally.',
  'demo.badge': 'DEMO',
  'demo.hint': 'Demo mode — no real messages are sent',

  // sidebar / chats
  'chat.newPlaceholder': 'New chat: +7 999 123-45-67',
  'chat.create': 'Create',
  'chat.emptyList': 'No chats yet. Create one by phone number.',
  'chat.subtitle': 'MAX · chatId {id}',
  'chat.empty': 'Select a chat or create a new one by phone number.',

  // messages
  'msg.empty': 'No messages yet. Say hello 👋',
  'msg.failed': 'failed',

  // composer
  'composer.placeholder': 'Type a message',
  'composer.send': 'Send',
  'composer.sendTitle': 'Send (Enter)',

  // errors
  'err.invalidCreds': 'Invalid credentials (idInstance / apiTokenInstance) or access denied.',
  'err.rateLimit': 'Too many requests, please wait a moment and try again.',
  'err.network': 'Unable to reach the GREEN-API server, check your connection.',
  'err.unexpected': 'Unexpected error.',
  'err.invalidToken': 'Invalid idInstance or apiTokenInstance.',
  'err.notConnected': 'Not connected to GREEN-API.',
  'err.badPhone': 'Enter a valid phone number: 7XXXXXXXXXX or 375XXXXXXXXX.',
  'err.noAccount': 'No MAX account found for this number.',
  'err.checkAccount': 'Unable to check this phone number.',
  'err.emptyResponse': 'Empty response from the server.',
  'err.notAccepted': 'The message was not accepted for sending.',
  'err.serverRequest': 'Request failed (HTTP {status}).',

  // polling
  'poll.lost': 'Connection to GREEN-API lost, retrying…',

  // setup warnings
  'setup.notAuthorized':
    'Instance state is "{state}". Authorize it in the GREEN-API console to send and receive messages.',
  'setup.setSettings':
    'Could not enable incoming notifications (SetSettings failed). Make sure no custom webhook URL is set for this instance.',
};

const ru: Record<string, string> = {
  // theme
  'theme.label': 'Тёмная тема',
  'theme.toLight': 'Включить светлую тему',
  'theme.toDark': 'Включить тёмную тему',

  // language
  'lang.label': 'Язык',

  // login
  'login.title': 'Подключение к GREEN-API',
  'login.hint': 'Введите idInstance и apiTokenInstance вашего инстанса MAX из',
  'login.console': 'личного кабинета GREEN-API',
  'login.connect': 'Подключиться',
  'login.connecting': 'Подключение…',
  'login.demo': 'Демо-режим (без учётных данных)',
  'login.demoShort': 'Демо-режим',

  // common actions
  'action.disconnect': 'Выйти',
  'action.dismiss': 'Скрыть',
  'action.back': 'Назад',

  // demo mode
  'demo.banner': 'Демо-режим: чаты предзаполнены, ответы имитируются локально.',
  'demo.badge': 'DEMO',
  'demo.hint': 'Демо-режим — реальные сообщения не отправляются',

  // sidebar / chats
  'chat.newPlaceholder': 'Новый чат: +7 999 123-45-67',
  'chat.create': 'Создать',
  'chat.emptyList': 'Чатов пока нет. Создайте чат по номеру телефона.',
  'chat.subtitle': 'MAX · ID чата {id}',
  'chat.empty': 'Выберите чат или создайте новый по номеру телефона.',

  // messages
  'msg.empty': 'Сообщений пока нет. Напишите привет 👋',
  'msg.failed': 'ошибка',

  // composer
  'composer.placeholder': 'Введите сообщение',
  'composer.send': 'Отправить',
  'composer.sendTitle': 'Отправить (Enter)',

  // errors
  'err.invalidCreds': 'Неверные учётные данные (idInstance / apiTokenInstance) или доступ запрещён.',
  'err.rateLimit': 'Слишком много запросов. Подождите немного и повторите попытку.',
  'err.network': 'Не удалось связаться с сервером GREEN-API, проверьте подключение к интернету.',
  'err.unexpected': 'Непредвиденная ошибка.',
  'err.invalidToken': 'Неверный idInstance или apiTokenInstance.',
  'err.notConnected': 'Нет подключения к GREEN-API.',
  'err.badPhone': 'Введите корректный номер телефона: 7XXXXXXXXXX или 375XXXXXXXXX.',
  'err.noAccount': 'Для этого номера не найден аккаунт MAX.',
  'err.checkAccount': 'Не удалось проверить этот номер телефона.',
  'err.emptyResponse': 'Пустой ответ сервера.',
  'err.notAccepted': 'Сообщение не принято к отправке.',
  'err.serverRequest': 'Запрос не выполнен (HTTP {status}).',

  // polling
  'poll.lost': 'Связь с GREEN-API потеряна, повторное подключение…',

  // setup warnings
  'setup.notAuthorized':
    'Инстанс в состоянии «{state}». Авторизуйте его в личном кабинете GREEN-API, чтобы отправлять и получать сообщения.',
  'setup.setSettings':
    'Не удалось включить входящие уведомления (SetSettings). Убедитесь, что для инстанса не задан собственный webhook URL.',
};

const DICT: Record<Lang, Record<string, string>> = { en, ru };

export function translate(
  lang: Lang,
  key: string,
  params?: Record<string, string | number>,
): string {
  let text = DICT[lang][key] ?? DICT.en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}
