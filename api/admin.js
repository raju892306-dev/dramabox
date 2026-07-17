// api/admin.js
// All actions require initData that (a) passes Telegram's HMAC check and
// (b) belongs to ADMIN_TELEGRAM_ID. Nobody else can call this successfully.
//
// POST /api/admin  { action: 'pendingUploads', initData }
// POST /api/admin  { action: 'publishVideo', initData, pendingUploadId, title, thumbnailUrl }
// POST /api/admin  { action: 'broadcast', initData, text, imageUrl? }

const { getDb } = require('../lib/db');
const { verifyInitData, sendMessage, sendPhoto } = require('../lib/telegram');
const { ObjectId } = require('mongodb');

const ADMIN_ID = Number(process.env.ADMIN_TELEGRAM_ID || 0);

function requireAdmin(initData) {
  const user = verifyInitData(initData);
  if (!user || user.id !== ADMIN_ID) return null;
  return user;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { action, initData } = req.body || {};
    const admin = requireAdmin(initData);
    if (!admin) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const db = await getDb();

    if (action === 'pendingUploads') {
      // Videos the admin has sent to the bot but not yet published with a title/thumbnail.
      const pending = await db
        .collection('pending_uploads')
        .find({ published: { $ne: true } })
        .sort({ createdAt: -1 })
        .toArray();
      res.status(200).json({ pending });
      return;
    }

    if (action === 'publishVideo') {
      const { pendingUploadId, title, thumbnailUrl } = req.body;
      if (!pendingUploadId || !ObjectId.isValid(pendingUploadId) || !title || !thumbnailUrl) {
        res.status(400).json({ error: 'Missing fields' });
        return;
      }
      const pending = await db
        .collection('pending_uploads')
        .findOne({ _id: new ObjectId(pendingUploadId) });
      if (!pending) {
        res.status(404).json({ error: 'Pending upload not found' });
        return;
      }

      await db.collection('videos').insertOne({
        title,
        thumbnailUrl,
        telegramFileId: pending.fileId,
        published: true,
        createdAt: new Date(),
      });

      await db
        .collection('pending_uploads')
        .updateOne({ _id: pending._id }, { $set: { published: true } });

      res.status(200).json({ success: true });
      return;
    }

    if (action === 'listVideos') {
      const videos = await db.collection('videos').find({}).sort({ createdAt: -1 }).toArray();
      res.status(200).json({ videos });
      return;
    }

    if (action === 'broadcast') {
      const { text, imageUrl } = req.body;
      if (!text) {
        res.status(400).json({ error: 'text is required' });
        return;
      }
      const users = await db.collection('users').find({}).project({ telegramId: 1 }).toArray();

      let sent = 0;
      let failed = 0;
      // Sequential sends to stay well within Telegram's rate limits
      // (~30 msgs/sec). Fine for the audience sizes a free-tier deploy handles.
      for (const u of users) {
        try {
          if (imageUrl) {
            await sendPhoto(u.telegramId, imageUrl, text);
          } else {
            await sendMessage(u.telegramId, text);
          }
          sent++;
        } catch {
          failed++;
        }
      }

      res.status(200).json({ success: true, sent, failed, total: users.length });
      return;
    }

    res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('admin.js error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
