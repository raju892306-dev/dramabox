// data.js — DB connection + সব schema এখানে

const mongoose = require('mongoose');

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
}

// ==== User Schema ====
// প্রতিটা ইউজার যে বট /start করেছে তার তথ্য
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true, index: true },
  username: String,
  firstName: String,
  joinedAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
});

// ==== Video Schema ====
// admin panel থেকে title + thumbnail দিয়ে বানানো হয়, video file_id পরে
// telegram এ admin পাঠালে বসে (যেহেতু বড় ভিডিও admin panel দিয়ে আপলোড করা হবে না)
const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  thumbnailUrl: { type: String, required: true }, // admin panel এ আপলোড করা thumbnail এর path/url
  pendingCode: { type: String, required: true, unique: true }, // admin কে টেলিগ্রামে caption এ এই কোড পাঠাতে হবে video এর সাথে
  videoFileId: { type: String, default: null }, // admin video পাঠানোর পর bot এখানে file_id বসায়
  status: { type: String, enum: ['pending', 'ready'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

// ==== Unlock Schema ====
// কোন ইউজার কোন video কবে unlock করেছে (24 ঘণ্টার lock ট্র্যাক করতে)
const unlockSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, index: true },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  unlockedAt: { type: Date, default: Date.now },
});
unlockSchema.index({ telegramId: 1, videoId: 1 });

const User = mongoose.model('User', userSchema);
const Video = mongoose.model('Video', videoSchema);
const Unlock = mongoose.model('Unlock', unlockSchema);

module.exports = { connectDB, User, Video, Unlock };
