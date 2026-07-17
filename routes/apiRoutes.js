const express = require('express');
const { listVideosForUser } = require('../api/video');
const { completeUnlock } = require('../api/earn');

function buildApiRouter(bot) {
  const router = express.Router();

  // Mini app খোলার সাথে সাথে video list + lock status আনতে
  router.get('/videos', async (req, res) => {
    const telegramId = req.query.telegramId;
    if (!telegramId) return res.status(400).json({ error: 'telegramId দরকার' });

    const videos = await listVideosForUser(String(telegramId));
    res.json({ videos });
  });

  // Adsgram এর ad পুরোপুরি দেখা শেষ হলে mini app এইখানে কল করবে।
  // এখানেই unlock রেকর্ড হয় এবং bot দিয়ে video ইউজারের ইনবক্সে পাঠানো হয়।
  router.post('/unlock/complete', async (req, res) => {
    try {
      const { telegramId, videoId } = req.body;
      if (!telegramId || !videoId) {
        return res.status(400).json({ error: 'telegramId এবং videoId দরকার' });
      }
      const result = await completeUnlock(bot, String(telegramId), videoId);
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { buildApiRouter };
