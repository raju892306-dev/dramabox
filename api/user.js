// user.js — ইউজার ট্র্যাকিং

const { User } = require('./data');

// নতুন ইউজার হলে সেভ করবে, পুরনো হলে lastActive আপডেট করবে
async function upsertUser(ctx) {
  const telegramId = String(ctx.from.id);
  await User.findOneAndUpdate(
    { telegramId },
    {
      telegramId,
      username: ctx.from.username || '',
      firstName: ctx.from.first_name || '',
      lastActiveAt: new Date(),
      $setOnInsert: { joinedAt: new Date() },
    },
    { upsert: true, new: true }
  );
}

async function getAllUserIds() {
  const users = await User.find({}, 'telegramId').lean();
  return users.map((u) => u.telegramId);
}

async function getUserCount() {
  return User.countDocuments();
}

module.exports = { upsertUser, getAllUserIds, getUserCount };
