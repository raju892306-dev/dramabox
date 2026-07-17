// earn.js — Adsgram এর ad সম্পন্ন হওয়ার পর unlock + video ডেলিভারি

const { Video } = require('./data');
const { isCurrentlyLocked, recordUnlock, LOCK_HOURS } = require('./video');

// Mini app থেকে ad সম্পন্ন হওয়ার signal আসলে এটা কল হবে
async function completeUnlock(bot, telegramId, videoId) {
  const video = await Video.findById(videoId).lean();
  if (!video || video.status !== 'ready') {
    throw new Error('ভিডিও পাওয়া যায়নি');
  }

  const stillLocked = await isCurrentlyLocked(telegramId, videoId);
  if (stillLocked) {
    // আগেই unlock করা আছে, আবার video পাঠানোর দরকার নাই কিন্তু ইউজারকে জানাবো
    return { alreadyUnlocked: true };
  }

  await recordUnlock(telegramId, videoId);

  // bot এর মাধ্যমে ইউজারের ইনবক্সে ভিডিও পাঠানো
  await bot.telegram.sendVideo(telegramId, video.videoFileId, {
    caption: `🎬 ${video.title}`,
  });

  return { alreadyUnlocked: false, lockHours: LOCK_HOURS };
}

module.exports = { completeUnlock };
