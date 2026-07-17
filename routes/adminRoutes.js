const express = require('express');
const multer = require('multer');
const path = require('path');
const { createPendingVideo } = require('../api/video');
const { Video } = require('../api/data');
const { broadcastMessage } = require('../api/broadcast');
const { getUserCount } = require('../api/user');
const { requireAdmin } = require('../middleware/adminAuth');

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'public', 'uploads'),
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — শুধু thumbnail image, video না
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('শুধু ছবি আপলোড করা যাবে'));
    cb(null, true);
  },
});

function buildAdminRouter(bot) {
  const router = express.Router();

  // ==== Login ====
  router.post('/login', (req, res) => {
    const { password } = req.body;
    if (password && password === process.env.ADMIN_PANEL_PASSWORD) {
      req.session.isAdmin = true;
      return res.json({ ok: true });
    }
    res.status(401).json({ error: 'ভুল পাসওয়ার্ড' });
  });

  router.post('/logout', (req, res) => {
    req.session = null;
    res.json({ ok: true });
  });

  router.get('/me', (req, res) => {
    res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
  });

  // সবকিছুর নিচে requireAdmin — উপরের login/logout/me বাদে
  router.use(requireAdmin);

  // ==== নতুন video entry বানানো (title + thumbnail) ====
  // video file আলাদাভাবে টেলিগ্রামে admin কে পাঠাতে হবে (bot.js দেখো)
  router.post('/videos', upload.single('thumbnail'), async (req, res) => {
    try {
      const { title } = req.body;
      if (!title || !req.file) {
        return res.status(400).json({ error: 'title এবং thumbnail দুটোই দরকার' });
      }
      const thumbnailUrl = `/uploads/${req.file.filename}`;
      const video = await createPendingVideo({ title, thumbnailUrl });

      res.json({
        ok: true,
        video: {
          id: video._id,
          title: video.title,
          pendingCode: video.pendingCode,
        },
        instruction: `এখন এই ভিডিওটা টেলিগ্রামে বট চ্যাটে পাঠাও, caption এ ঠিক এই কোডটা লিখে: ${video.pendingCode}`,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==== সব video এর লিস্ট (status সহ) ====
  router.get('/videos', async (req, res) => {
    const videos = await Video.find().sort({ createdAt: -1 }).lean();
    res.json({ videos });
  });

  // ==== Broadcast — সব ইউজারকে মেসেজ পাঠানো ====
  router.post('/broadcast', upload.single('image'), async (req, res) => {
    try {
      const { text } = req.body;
      if (!text && !req.file) {
        return res.status(400).json({ error: 'অন্তত টেক্সট অথবা ছবি দিতে হবে' });
      }
      const imageUrl = req.file
        ? `${process.env.PUBLIC_URL}/uploads/${req.file.filename}`
        : null;

      const result = await broadcastMessage(bot, { text, imageUrl });
      res.json({ ok: true, result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/stats', async (req, res) => {
    const userCount = await getUserCount();
    const videoCount = await Video.countDocuments({ status: 'ready' });
    res.json({ userCount, videoCount });
  });

  return router;
}

module.exports = { buildAdminRouter };
