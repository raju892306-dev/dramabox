require('dotenv').config();

const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');

const { connectDB } = require('./lib/data');
const { createBot } = require('./lib/bot');
const { buildAdminRouter } = require('./routes/adminRoutes');
const { buildApiRouter } = require('./routes/apiRoutes');

const isVercel = !!process.env.VERCEL;
const bot = createBot();

// Secret token bot টোকেন দিয়ে বানানো, যাতে অন্য কেউ webhook path আন্দাজ করে fake update পাঠাতে না পারে
const webhookPath = `/webhook/${process.env.BOT_TOKEN}`;

const app = express();
app.use(express.json());
app.use(
  cookieSession({
    name: 'dh_admin_session',
    secret: process.env.SESSION_SECRET,
    maxAge: 12 * 60 * 60 * 1000,
    httpOnly: true,
  })
);

// DB connection cold start এ শুরু হয়, প্রতি request এ অপেক্ষা করে নেওয়া হয়
// (serverless function বারবার নতুন করে চালু হতে পারে বলে এভাবে সেফ রাখা)
let dbReady = null;
app.use((req, res, next) => {
  if (!dbReady) dbReady = connectDB().catch((err) => console.error('DB connect error:', err));
  dbReady.then(() => next()).catch(() => res.status(500).json({ error: 'Database connect ব্যর্থ' }));
});

// ==== Static ফাইল (এগুলো repo এর সাথেই ডিপ্লয় হয়, তাই Vercel এ পড়তে কোনো সমস্যা নেই) ====
app.use('/app', express.static(path.join(__dirname, 'public', 'miniapp')));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// ==== API ====
app.use('/api/admin', buildAdminRouter(bot));
app.use('/api', buildApiRouter(bot));

app.get('/api/config', (req, res) => {
  res.json({
    adsgramBlockId: process.env.ADSGRAM_BLOCK_ID,
    telegramChannelLink: process.env.TELEGRAM_CHANNEL_LINK,
  });
});

// ==== Telegram Webhook (Vercel/production এ ব্যবহার হবে) ====
app.use(bot.webhookCallback(webhookPath));

module.exports = { app, bot, isVercel, webhookPath };
