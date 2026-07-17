# Drama House — Telegram Mini App

আপনার নিজের কনটেন্টের জন্য Telegram bot + mini app + admin panel। Vercel free plan এ deploy করার মতো করে বানানো — ভিডিও ফাইল নিজে হোস্ট করে না, Telegram এর নিজস্ব ফাইল স্টোরেজ (file_id) ব্যবহার করে।

## যা এখানে **নেই** (ইচ্ছাকৃতভাবে)
- Earn / points / referral / withdraw / gift সিস্টেম — এগুলো এই প্রজেক্টের অংশ না।
- ভুয়া "সার্ভারের সাথে কানেক্ট হচ্ছে" টেক্সট — ব্যবহারকারীকে সবসময় সত্যি বলা হয় যে সে একটা অ্যাড দেখছে।

## ধাপ ১ — ক্রেডেনশিয়াল রোটেট করুন
আগের চ্যাটে আপনি যে বট টোকেন আর MongoDB পাসওয়ার্ড পেস্ট করেছিলেন সেগুলো এখন যে কেউ দেখতে পারে এমন জায়গায় আছে। শুরু করার আগে:
1. **BotFather** → `/mybots` → আপনার বট → **API Token** → **Revoke current token** → নতুন টোকেন নিন।
2. **MongoDB Atlas** → Database Access → আপনার ইউজার → **Edit** → নতুন পাসওয়ার্ড সেট করুন।

## ধাপ ২ — GitHub এ রিপো বানান
এই পুরো ফোল্ডারটা একটা নতুন GitHub রিপোতে পুশ করুন।

## ধাপ ৩ — Vercel এ Deploy করুন
1. Vercel → New Project → এই GitHub রিপো import করুন।
2. Project → Settings → Environment Variables এ `.env.example` এর প্রতিটা ভ্যারিয়েবল যোগ করুন (নতুন টোকেন/পাসওয়ার্ড দিয়ে)।
3. Deploy করুন। আপনার URL হবে যেমন `https://drama-house.vercel.app`।
4. `APP_URL` env variable এ ঠিক এই URL টা বসান এবং redeploy করুন।

## ধাপ ৪ — Telegram Webhook সেট করুন
ব্রাউজারে (একবারই লাগবে) ভিজিট করুন:
```
https://api.telegram.org/bot<আপনার_নতুন_টোকেন>/setWebhook?url=https://drama-house.vercel.app/api/bot
```

## ধাপ ৫ — BotFather এ Mini App বাটন সেট করুন
`/mybots` → আপনার বট → **Bot Settings** → **Menu Button** → আপনার `APP_URL` সেট করুন। (কোড থেকেই `/start` এ Watch Now বাটন পাঠানো হয়, এটা optional extra।)

## ধাপ ৬ — Adsgram কনফিগার করুন
1. Adsgram এ আপনার বট/অ্যাপ যোগ করে একটা **Block ID** নিন।
2. `public/watch.js` ফাইলে `ADSGRAM_BLOCK_ID` এর জায়গায় সেটা বসান।
3. `public/watch.js` তে `BOT_USERNAME` এর জায়গায় আপনার বটের `@username` বসান (ইনবক্স বাটনের জন্য)।

## ধাপ ৭ — কনটেন্ট আপলোড করুন (নিজের অ্যাডমিন আইডি দিয়ে)
1. আপনার বট চ্যাটে সরাসরি একটা ভিডিও পাঠান (আপনার Telegram numeric id `ADMIN_TELEGRAM_ID` এর সাথে মিলতে হবে)। বট রিপ্লাই দিবে "ভিডিও পাওয়া গেছে ✅"।
2. `APP_URL/admin.html` এ যান (এটাও একটা Telegram mini app হিসেবে খুলতে হবে যাতে আপনার আইডি ভেরিফাই হয় — বটে একটা `/admin` কমান্ড বা মেনু বাটন দিয়ে এই লিংক খুলুন)।
3. Dropdown থেকে সেই আপলোড বেছে নিন, টাইটেল দিন, থাম্বনেইলের একটা ইমেজ URL দিন (imgbb.com বা telegra.ph এ ছবি আপলোড করে লিংক নিতে পারেন), **পাবলিশ করুন**।
4. ভিডিওটা সাথে সাথে মিনি অ্যাপের গ্রিডে দেখাবে।

## কীভাবে কাজ করে (unlock flow)
1. ইউজার থাম্বনেইলে ক্লিক করে → `watch.html` খোলে।
2. পেজ লেখে "অ্যাড লোড হচ্ছে..." এবং Adsgram SDK কে কল করে — এই সময়টায় সত্যিই অ্যাড লোড/প্লে হচ্ছে, কোনো ভুয়া টেক্সট না।
3. অ্যাড সম্পূর্ণ দেখা শেষ হলেই (স্কিপ করলে না) `/api/unlock` কল হয়।
4. সার্ভার Telegram এর `initData` যাচাই করে (তাই কেউ ভুয়া রিকোয়েস্ট পাঠাতে পারবে না), ২৪ ঘণ্টার লক চেক করে, তারপর বট দিয়ে ভিডিও সরাসরি ইউজারের ইনবক্সে পাঠায়।
5. "সফলভাবে সম্পন্ন হয়েছে" দেখানো হয় এবং সেই ভিডিও পরবর্তী ২৪ ঘণ্টার জন্য লক হয়ে যায়।

## ফাইল স্ট্রাকচার
```
/api
  bot.js       -> Telegram webhook (/start, admin video uploads)
  videos.js    -> GET published video list
  unlock.js    -> POST ad-completed -> sends video, applies 24h lock
  admin.js     -> admin-only actions (protected by initData + ADMIN_TELEGRAM_ID)
/public
  index.html / style.css / app.js   -> main mini app grid
  watch.html / watch.js             -> ad-gate + unlock flow
  admin.html / admin.js             -> admin panel
/lib
  db.js         -> MongoDB connection
  telegram.js   -> Telegram API helpers + initData verification
```
