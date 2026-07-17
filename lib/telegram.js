// lib/telegram.js
// Thin wrapper around the Telegram Bot API. Uses global fetch (available on
// Vercel Node 18+ runtime).

const crypto = require('crypto');

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tg(method, payload) {
  const res = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) {
    console.error(`Telegram API error on ${method}:`, data);
  }
  return data;
}

const sendMessage = (chatId, text, extra = {}) =>
  tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra });

const sendPhoto = (chatId, photo, caption, extra = {}) =>
  tg('sendPhoto', { chat_id: chatId, photo, caption, parse_mode: 'HTML', ...extra });

// Sends a video the admin previously uploaded to the bot, by its Telegram
// file_id. This means we never have to host video files ourselves — Telegram
// stores and serves them, which is what keeps this workable on Vercel's free
// plan (no big blob storage needed).
const sendVideo = (chatId, fileId, caption, extra = {}) =>
  tg('sendVideo', { chat_id: chatId, video: fileId, caption, parse_mode: 'HTML', ...extra });

const answerCallbackQuery = (callbackQueryId, text) =>
  tg('answerCallbackQuery', { callback_query_id: callbackQueryId, text });

const setWebhook = (url) => tg('setWebhook', { url });

/**
 * Validates Telegram WebApp initData so we can trust the user id it claims.
 * This is what protects the admin panel: only requests whose initData both
 * (a) passes this HMAC check and (b) has the admin's user id are allowed to
 * upload content or broadcast messages.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function verifyInitData(initData) {
  if (!initData || !BOT_TOKEN) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckArr = [];
  for (const [key, value] of [...params.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    dataCheckArr.push(`${key}=${value}`);
  }
  const dataCheckString = dataCheckArr.join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) return null;

  const userJson = params.get('user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson); // { id, first_name, username, ... }
  } catch {
    return null;
  }
}

module.exports = {
  sendMessage,
  sendPhoto,
  sendVideo,
  answerCallbackQuery,
  setWebhook,
  verifyInitData,
};
