// api/index.js — Vercel এর জন্য একমাত্র entry point।
// vercel.json এ সব route এখানে rewrite করা আছে, তারপর Express app নিজেই ভেতরে route করে।

const { app, bot, webhookPath } = require('../app');

let webhookConfigured = false;

module.exports = async (req, res) => {
  // প্রতিটা নতুন serverless instance (cold start) এ একবার Telegram কে webhook URL জানানো হয়
  if (!webhookConfigured) {
    webhookConfigured = true;
    try {
      await bot.telegram.setWebhook(`${process.env.PUBLIC_URL}${webhookPath}`);
    } catch (err) {
      console.error('setWebhook ব্যর্থ:', err.message);
    }
  }
  return app(req, res);
};
