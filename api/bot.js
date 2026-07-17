// bot.js — Telegraf বট সেটআপ: welcome message, mini app button,
// admin video capture, admin broadcast command

const { Telegraf, Markup } = require('telegraf');
const { upsertUser } = require('./user');
const { attachVideoFile } = require('./video');

function createBot() {
  const bot = new Telegraf(process.env.BOT_TOKEN);
  const ADMIN_ID = String(process.env.ADMIN_TELEGRAM_ID);
  const miniAppUrl = `${process.env.PUBLIC_URL}/app`;

  // ==== /start — ওয়েলকাম মেসেজ ====
  bot.start(async (ctx) => {
    await upsertUser(ctx);

    const welcomeText =
      `আসসালামুয়ালাইকুম 🥰\n\n` +
      `আমাদের বট ২৪ ঘণ্টা সচল। ভিডিও দেখতে নিচের Watch Now বাটনে ক্লিক করুন 🥰`;

    await ctx.reply(
      welcomeText,
      Markup.inlineKeyboard([
        [Markup.button.webApp('🎬 Watch Now (Web App)', miniAppUrl)],
      ])
    );
  });

  // ==== Admin: ভিডিও ফাইল ক্যাপচার ====
  // Admin panel এ title+thumbnail দিয়ে entry বানানোর পর একটা pendingCode পাওয়া যাবে।
  // Admin সেই code caption এ লিখে bot চ্যাটে ভিডিও পাঠালে, bot সেটা video record এর
  // সাথে লিংক করে দেবে। শুধু ADMIN_ID থেকে আসা ভিডিওই গ্রহণ করা হয়।
  bot.on('video', async (ctx) => {
    const fromId = String(ctx.from.id);
    if (fromId !== ADMIN_ID) return; // admin ছাড়া কেউ ভিডিও পাঠালে ইগনোর

    const caption = (ctx.message.caption || '').trim();
    if (!caption) {
      return ctx.reply(
        '⚠️ ভিডিওর caption এ pendingCode বসাও নাই। Admin panel থেকে video entry বানানোর সময় যে code পেয়েছো, সেটা caption এ লিখে আবার পাঠাও।'
      );
    }

    const fileId = ctx.message.video.file_id;
    const video = await attachVideoFile(caption, fileId);

    if (!video) {
      return ctx.reply(
        `❌ কোড "${caption}" এর সাথে মিলে এমন কোনো pending video entry পাওয়া যায়নি। Admin panel থেকে code চেক করো।`
      );
    }

    await ctx.reply(`✅ "${video.title}" এর সাথে ভিডিও লিংক হয়ে গেছে। এখন এটা bot এ live.`);
  });

  return bot;
}

module.exports = { createBot };
