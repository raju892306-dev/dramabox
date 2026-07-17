// api/unlock.js
// POST /api/unlock  { videoId, initData }
// Called by the frontend ONLY after the ad SDK reports the ad was actually
// watched/completed (see public/watch.html). Verifies the Telegram WebApp
// initData (so we know the real user id, not something the client can fake),
// enforces the 24h re-lock, then sends the video to the user's chat via the
// bot and records the unlock.

const { getDb } = require('../lib/db');
const { sendVideo, verifyInitData } = require('../lib/telegram');
const { ObjectId } = require('mongodb');

const LOCK_HOURS = 24;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { videoId, initData } = req.body || {};

    const user = verifyInitData(initData);
    if (!user) {
      res.status(401).json({ error: 'Could not verify Telegram user' });
      return;
    }
    const userId = user.id;

    if (!videoId || !ObjectId.isValid(videoId)) {
      res.status(400).json({ error: 'Invalid videoId' });
      return;
    }

    const db = await getDb();
    const video = await db.collection('videos').findOne({ _id: new ObjectId(videoId), published: true });
    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Enforce 24h re-lock per user per video.
    const existing = await db.collection('unlocks').findOne({ userId, videoId: videoId });
    if (existing) {
      const unlockedAt = new Date(existing.unlockedAt).getTime();
      const lockedUntil = unlockedAt + LOCK_HOURS * 60 * 60 * 1000;
      if (lockedUntil > Date.now()) {
        res.status(423).json({ error: 'Video is locked', lockedUntil });
        return;
      }
    }

    // Send the video into the user's chat with the bot.
    await sendVideo(userId, video.telegramFileId, `🎬 ${video.title}`);

    await db.collection('unlocks').updateOne(
      { userId, videoId: videoId },
      { $set: { userId, videoId, unlockedAt: new Date() } },
      { upsert: true }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('unlock.js error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
