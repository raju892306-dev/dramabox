// api/videos.js
// GET /api/videos -> list of published videos (title + thumbnail only;
// never exposes the Telegram file_id to the frontend).
// GET /api/videos?userId=123 -> also includes each video's lock status for that user.

const { getDb } = require('../lib/db');

const LOCK_HOURS = 24;

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const db = await getDb();
    const videos = await db
      .collection('videos')
      .find({ published: true })
      .sort({ createdAt: -1 })
      .project({ title: 1, thumbnailUrl: 1, createdAt: 1 })
      .toArray();

    const userId = req.query.userId ? Number(req.query.userId) : null;
    let unlockMap = {};
    if (userId) {
      const unlocks = await db
        .collection('unlocks')
        .find({ userId })
        .toArray();
      const now = Date.now();
      for (const u of unlocks) {
        const unlockedAt = new Date(u.unlockedAt).getTime();
        const lockedUntil = unlockedAt + LOCK_HOURS * 60 * 60 * 1000;
        unlockMap[u.videoId] = lockedUntil > now ? lockedUntil : null;
      }
    }

    const result = videos.map((v) => ({
      id: v._id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      lockedUntil: unlockMap[v._id.toString()] || null,
    }));

    res.status(200).json({ videos: result });
  } catch (err) {
    console.error('videos.js error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
