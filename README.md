# MAX Chat — GREEN-API client

A minimal web chat for the [MAX messenger](https://green-api.com/max), built with **React + TypeScript (Vite)**.
Text messages only: send and receive.

No backend is required — the browser talks directly to `https://api.green-api.com`
(the API sends `Access-Control-Allow-Origin: *`).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check (strict tsc) + production bundle in dist/
```

## Usage

0. **No credentials?** Press **“Try the demo (no credentials needed)”** — see *Demo mode* below.
1. Open the site and enter your instance credentials (`idInstance`, `apiTokenInstance`)
   from the [GREEN-API console](https://console.green-api.com). The app validates them with
   `getStateInstance` and enables HTTP-API notifications via `setSettings`.
2. In the left sidebar enter the recipient's phone number (`7XXXXXXXXXX` or `375XXXXXXXXX`)
   and press **Create** — the number is resolved to a `chatId` with `checkAccount`.
3. Type a message and press **Enter** (or **Send**). It is delivered through `sendMessage`.
4. The recipient replies in MAX; the reply appears in the chat window (see *How receiving works*).

Use the 🌙 / ☀️ button (sidebar header, or top-right of the login card) to switch between
light and dark mode. The choice is stored in `localStorage` and applied before first paint.

The **EN | RU** switch next to it changes the interface language on every screen (login
card and chat screen). All UI strings — headings, placeholders, buttons, empty states,
validation and API error messages, banner warnings — come from a small dictionary in
`src/i18n.ts`; messages from the GREEN-API server itself are shown as-is. The choice is
stored in `localStorage` (`max-client.lang`) and keeps `<html lang>` in sync.

## Demo mode

Press **“Try the demo (no credentials needed)”** on the login card (test credentials are
`demo` / `demo` — you can also type them in manually). The demo:

- runs entirely in the browser — **zero requests** to `api.green-api.com`, nothing is sent anywhere;
- seeds **3 chats with message history** (`src/api/demo.ts → buildDemoData`), auto-opens the first one;
- simulates the full pipeline: sending resolves locally, and every message gets a
  simulated reply delivered through the *same* long-polling loop as real messages
  (`receiveNotification` → `deleteNotification`), so receiving/acking/deduping are exercised;
- accepts new chats by phone number (any number resolves);
- is marked with a **DEMO** chip in the chat header and a dismissible notice banner;
- persists across reloads like normal state, and reseeds after a disconnect.

While in demo, no `idInstance`/`apiTokenInstance` are needed and no GREEN-API quota is used.

## Responsiveness

| Width | Layout |
| --- | --- |
| ≥ 821px | sidebar 320px + chat pane |
| 761–820px | sidebar 250px (Disconnect collapses to an icon) + chat pane |
| ≤ 760px | one pane at a time: full-width chat list → full-width chat with a **‹** back button; language/theme switches move into the chat header |

The login card reserves the tallest EN/RU line counts at narrow widths (see the
“login layout stability” rules in `src/styles.css`), so switching languages never shifts
the form. Verified by an automated audit at 320/375/414/768/1024/1280 × EN/RU in both
light and dark mode: no horizontal overflow, no element spilling its container, zero
Δposition on language switch.

## API methods used

| Purpose | Method |
| --- | --- |
| Validate credentials | `GET /waInstance{id}/getStateInstance/{token}` |
| Enable notifications | `POST /waInstance{id}/setSettings/{token}` (`webhookUrl: ""`) |
| Create a chat from a phone number | `POST /waInstance{id}/checkAccount/{token}` |
| Send text | `POST /waInstance{id}/sendMessage/{token}` |
| Receive notifications (HTTP API) | `GET /waInstance{id}/receiveNotification/{token}?receiveTimeout=5` |
| Acknowledge a notification | `DELETE /waInstance{id}/deleteNotification/{token}` |

### How receiving works

A single background loop long-polls `receiveNotification` (5-second timeout). When a
notification arrives it is parsed, and then always acknowledged with `deleteNotification`
so the FIFO queue keeps draining. Only `incomingMessageReceived` notifications with
`typeMessage: "textMessage"` are rendered; every other notification type is acknowledged
and ignored. Messages are deduplicated by `idMessage`. On network errors or HTTP 429 the
loop backs off for 2 seconds and retries; the connection state is shown as a banner.

Replies are routed by `senderData.chatId`, and a chat that is not yet in the sidebar is
created automatically — this is why a new chat starts from `checkAccount` rather than
sending to `phone@c.us` (the docs warn that replies to phone-number sends arrive under a
server-assigned `chatId`).

## State

Credentials, chat list and the last 1000 messages are stored in `localStorage`
(`max-client.*` keys). **Disconnect** clears them.

## Notes

- Demo mode (`demo` / `demo`) answers every API call locally — the API methods in the
  table above are only used with real credentials.
- Message text is limited to 4000 characters (GREEN-API limit); a counter appears near the limit.
- The GREEN-API **Developer** tariff allows 3 chats and 100 `checkAccount` calls per month.
- Your instance must be **authorized** and must have **no custom webhook URL** set,
  otherwise receiving fails (the app surfaces this as a banner).
- `apiTokenInstance` is kept in `localStorage` in plain text — fine for a local demo,
  do not deploy this to a public host as-is.

## Layout

Based on the standard MAX web layout (prototype: https://web.max.ru/, which requires a MAX
account to view): chat-list sidebar with the *new chat* form on the left, message thread
with a header and composer on the right. Accent color `#0066cc` from MAX's own theme manifest.
