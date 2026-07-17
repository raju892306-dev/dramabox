// api/bot.js
// Vercel serverless function: POST target for the Telegram webhook.
// Set the webhook once (see README) to point here.

const { getDb } = require('../lib/db');
const { sendMessage } = require('../lib/telegram');

const APP_URL = process.env.APP_URL; // e.g. https://your-project.vercel.app
const ADMIN_ID = String(process.env.ADMIN_TELEGRAM_ID || '');

const WELCOME_TEXT =
  '<b>আসসালামুয়ালাইকুম</b> 🥰\n\n' +
  'আমাদের বট ২৪ ঘন্টা সচল। ভিডিও ডাউনলোড করতে নিচের <b>Watch Now</b> বাটনে ক্লিক করুন 🥰';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(200).send('Drama House bot webhook is alive.');
    return;
  }

  try {
    const update = req.body;

    // --- Handle admin uploading a video file directly to the bot ---
    // Admin sends a video message to the bot; we record its file_id so the
    // admin panel can attach a title + thumbnail to it. Only ADMIN_ID may do this.
    if (update.message && update.message.video) {
      const fromId = String(update.message.from.id);
      if (fromId === ADMIN_ID) {
        const db = await getDb();
        const fileId = update.message.video.file_id;
        const draft = await db.collection('pending_uploads').insertOne({
          fileId,
          telegramMessageId: update.message.message_id,
          createdAt: new Date(),
        });
        await sendMessage(
          update.message.chat.id,
          `ভিডিও পাওয়া গেছে ✅\n\nএই ভিডিওটার জন্য টাইটেল ও থাম্বনেইল সেট করতে admin panel এ যান।\n\nUpload ID: <code>${draft.insertedId}</code>`
        );
      }
      res.status(200).send('ok');
      return;
    }

    // --- Handle /start ---
    if (update.message && update.message.text) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id;
      const userId = update.message.from.id;

      if (text.startsWith('/start')) {
        const db = await getDb();
        await db.collection('users').updateOne(
          { telegramId: userId },
          {
            $set: {
              telegramId: userId,
              username: update.message.from.username || null,
              firstName: update.message.from.first_name || null,
              lastSeenAt: new Date(),
            },
            $setOnInsert: { createdAt: new Date() },
          },
          { upsert: true }
        );

        await sendMessage(chatId, WELCOME_TEXT, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎬 Watch Now (Web App)', web_app: { url: APP_URL } }],
            ],
          },
        });
      }

      res.status(200).send('ok');
      return;
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('bot.js error:', err);
    res.status(200).send('ok'); // Always 200 so Telegram doesn't retry-storm us
  }
};
