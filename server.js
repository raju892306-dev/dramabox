require('dotenv').config();

const express = require('express');
const cookieSession = require('cookie-session');
const path = require('path');

const { connectDB } = require('./api/data');
const { createBot } = require('./api/bot');
const { buildAdminRouter } = require('./routes/adminRoutes');
const { buildApiRouter } = require('./routes/apiRoutes');

async function main() {
  await connectDB();

  const app = express();
  app.use(express.json());
  app.use(
    cookieSession({
      name: 'dh_admin_session',
      secret: process.env.SESSION_SECRET,
      maxAge: 12 * 60 * 60 * 1000, // 12 ঘণ্টা
      httpOnly: true,
    })
  );

  const bot = createBot();

  // ==== Static ফাইল ====
  app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
  app.use('/app', express.static(path.join(__dirname, 'public', 'miniapp')));
  app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

  // ==== API ====
  app.use('/api/admin', buildAdminRouter(bot));
  app.use('/api', buildApiRouter(bot));

  // client কে config পাঠানো (mini app এ ব্যবহার হবে)
  app.get('/api/config', (req, res) => {
    res.json({
      adsgramBlockId: process.env.ADSGRAM_BLOCK_ID,
      telegramChannelLink: process.env.TELEGRAM_CHANNEL_LINK,
    });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server চলছে http://localhost:${PORT}`));

  // Bot চালানো — ছোট bot এর জন্য long polling যথেষ্ট
  bot.launch();
  console.log('Telegram bot চালু হয়েছে (polling mode)');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});
