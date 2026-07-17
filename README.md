# Drama House — Telegram Bot

## ০. সবার আগে (একবারই করতে হবে)

1. BotFather এ গিয়ে `/mybots` → তোমার বট → API Token → **Revoke current token**, নতুন টোকেন কপি করো।
2. MongoDB Atlas → Database Access → তোমার ডাটাবেজ ইউজার → Edit → পাসওয়ার্ড রিসেট করো।
3. এই দুইটা কারো কাছে (কোনো চ্যাটে, কোনো পাবলিক জায়গায়) আর শেয়ার করবে না — শুধু `.env` ফাইলে বসাবে, যেটা `.gitignore` এ আছে বলে GitHub এ যাবে না।

## ১. Install

```bash
cd drama-house-bot
npm install
cp .env.example .env
```

এবার `.env` ফাইল খুলে সব মান বসাও (নতুন bot token, নতুন DB password, admin panel password, ইত্যাদি)।

## ২. Adsgram সেটআপ

1. https://adsgram.ai তে গিয়ে পাবলিশার অ্যাকাউন্ট বানাও
2. তোমার bot/mini app যোগ করে একটা **Block ID** নাও
3. সেটা `.env` এর `ADSGRAM_BLOCK_ID` তে বসাও

## ৩. রান করা

```bash
npm start
```

এতে একসাথে:
- Express server চালু হবে (mini app + admin panel সার্ভ করবে)
- Telegram bot polling মোডে চালু হবে

Production এ চালাতে চাইলে PM2 বা কোনো VPS/Render/Railway তে deploy করবে যাতে 24/7 চলে।

## ৪. Admin panel ব্যবহার

`https://yourdomain.com/admin` এ গিয়ে `ADMIN_PANEL_PASSWORD` দিয়ে লগইন করো।

**নতুন ভিডিও যোগ করার ধাপ:**
1. Admin panel এ Title + Thumbnail দিয়ে "এন্ট্রি তৈরি করুন" ক্লিক করো
2. একটা ৮-ডিজিটের কোড পাবে (যেমন `a1b2c3d4`)
3. তোমার Telegram bot চ্যাটে (তুমি নিজে, ADMIN_TELEGRAM_ID থেকে) গিয়ে **আসল ভিডিও ফাইলটা পাঠাও, caption এ ঠিক ওই কোডটা লিখে**
4. বট নিজে থেকে ভিডিওটা লিংক করে দেবে, "✅ লিংক হয়ে গেছে" রিপ্লাই দেবে
5. এখন ভিডিওটা mini app এ live হয়ে যাবে

এভাবে বড় ভিডিও ফাইল Admin panel দিয়ে আপলোড করতে হয় না (browser এ বড় ফাইল আপলোড করা ধীর/অনির্ভরযোগ্য) — Telegram এর নিজের ফাইল সার্ভার ব্যবহার হচ্ছে, যেটা অনেক দ্রুত ও নির্ভরযোগ্য।

**Broadcast:** Admin panel এর নিচে "সব ইউজারকে মেসেজ পাঠান" ফর্ম দিয়ে টেক্সট (ছবি সহ বা ছাড়া) সব ইউজারকে পাঠাতে পারবে।

## যা যা ইচ্ছাকৃতভাবে অন্যরকম রাখা হয়েছে

- **"সার্ভারের সাথে কানেক্ট হচ্ছে..."** এর বদলে **"বিজ্ঞাপন চলছে..."** লেখা হয়েছে — কারণ আসলে ওই সময় বিজ্ঞাপনই চলে, সার্ভার কানেকশনের কোনো বিষয় নেই। ইউজার এক্সপেরিয়েন্স (countdown circle, ১৫ সেকেন্ড, tick mark) হুবহু একই রাখা হয়েছে।
- **"Drama Box" নাম/লোগোর বদলে "Drama House" / "DH"** — যেহেতু "Drama Box" অন্য একটা এক্সিস্টিং (পাইরেসি) অপারেশনের ব্র্যান্ড, সেটা কপি করা impersonation হয়ে যেত।
- **18+ বাটন বাদ দেওয়া হয়েছে** (তোমার শেষ নির্দেশ অনুযায়ী)।

## ফাইল স্ট্রাকচার

```
drama-house-bot/
├── api/
│   ├── data.js       — DB connection + schemas
│   ├── user.js       — ইউজার ট্র্যাকিং
│   ├── video.js       — ভিডিও তৈরি/লিস্ট/লক-স্ট্যাটাস
│   ├── bot.js          — Telegraf বট (welcome, admin video capture)
│   ├── earn.js         — ad সম্পন্ন হওয়ার পর unlock + video ডেলিভারি
│   └── broadcast.js    — সব ইউজারকে মেসেজ পাঠানো
├── routes/
│   ├── adminRoutes.js  — admin panel এর API
│   └── apiRoutes.js    — mini app এর API
├── middleware/
│   └── adminAuth.js
├── public/
│   ├── miniapp/         — ইউজার-facing web app
│   ├── admin/           — admin panel UI
│   └── uploads/         — thumbnail ছবি রাখা হয়
├── server.js            — মূল entry point
└── .env.example
```
