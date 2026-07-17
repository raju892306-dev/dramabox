// server.js — শুধু LOCAL DEVELOPMENT/VPS এর জন্য (polling mode, always-on process)
// Vercel এ ডিপ্লয় করলে এই ফাইলটা ব্যবহার হয় না, তখন api/index.js ব্যবহার হয় (webhook mode)

const { app, bot, isVercel } = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server চলছে http://localhost:${PORT}`));

if (!isVercel) {
  bot.launch();
  console.log('Telegram bot চালু হয়েছে (polling mode)');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
