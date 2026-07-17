// video.js — ভিডিও তৈরি, admin এর পাঠানো ফাইল লিংক করা, unlock status বের করা

const { Video, Unlock } = require('./data');
const { nanoid } = require('nanoid');

const LOCK_HOURS = 24;

// Admin panel থেকে নতুন video entry বানানো (এখনো actual video file নেই)
async function createPendingVideo({ title, thumbnailUrl }) {
  const pendingCode = nanoid(8);
  const video = await Video.create({ title, thumbnailUrl, pendingCode });
  return video;
}

// Admin টেলিগ্রামে ভিডিও পাঠালে caption এ pendingCode থাকবে, সেটা মিলিয়ে file_id বসানো
async function attachVideoFile(pendingCode, fileId) {
  const video = await Video.findOneAndUpdate(
    { pendingCode: pendingCode.trim(), status: 'pending' },
    { videoFileId: fileId, status: 'ready' },
    { new: true }
  );
  return video;
}

// সব "ready" video লিস্ট, প্রতিটার জন্য এই ইউজারের lock স্ট্যাটাস সহ
async function listVideosForUser(telegramId) {
  const videos = await Video.find({ status: 'ready' }).sort({ createdAt: -1 }).lean();
  const cutoff = new Date(Date.now() - LOCK_HOURS * 60 * 60 * 1000);

  const results = [];
  for (const v of videos) {
    const recentUnlock = await Unlock.findOne({
      telegramId,
      videoId: v._id,
      unlockedAt: { $gt: cutoff },
    }).lean();

    results.push({
      id: v._id,
      title: v.title,
      thumbnailUrl: v.thumbnailUrl,
      locked: !!recentUnlock,
      unlockedAt: recentUnlock ? recentUnlock.unlockedAt : null,
    });
  }
  return results;
}

async function isCurrentlyLocked(telegramId, videoId) {
  const cutoff = new Date(Date.now() - LOCK_HOURS * 60 * 60 * 1000);
  const recentUnlock = await Unlock.findOne({
    telegramId,
    videoId,
    unlockedAt: { $gt: cutoff },
  }).lean();
  return !!recentUnlock;
}

async function recordUnlock(telegramId, videoId) {
  await Unlock.create({ telegramId, videoId, unlockedAt: new Date() });
}

module.exports = {
  createPendingVideo,
  attachVideoFile,
  listVideosForUser,
  isCurrentlyLocked,
  recordUnlock,
  LOCK_HOURS,
};
