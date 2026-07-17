// broadcast.js — admin panel থেকে সব ইউজারকে মেসেজ পাঠানো (ছবি সহ/ছাড়া)

const { getAllUserIds } = require('./user');

// Telegram rate limit এড়াতে ছোট delay দিয়ে batch এ পাঠানো
async function broadcastMessage(bot, { text, imageUrl }) {
  const userIds = await getAllUserIds();
  let sent = 0;
  let failed = 0;

  for (const telegramId of userIds) {
    try {
      if (imageUrl) {
        await bot.telegram.sendPhoto(telegramId, imageUrl, { caption: text || '' });
      } else {
        await bot.telegram.sendMessage(telegramId, text);
      }
      sent++;
    } catch (err) {
      failed++; // ইউজার bot block করলে এখানে ধরা পড়বে, স্কিপ করে পরেরটায় যাবে
    }
    await new Promise((r) => setTimeout(r, 40)); // ~25 msg/sec এর নিচে রাখা
  }

  return { total: userIds.length, sent, failed };
}

module.exports = { broadcastMessage };
