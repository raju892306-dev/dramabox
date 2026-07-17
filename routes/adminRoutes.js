const express = require('express');
const multer = require('multer');
const { createPendingVideo } = require('../lib/video');
const { Video } = require('../lib/data');
const { broadcastMessage } = require('../lib/broadcast');
const { getUserCount } = require('../lib/user');
const { requireAdmin } = require('../middleware/adminAuth');
const { uploadBuffer } = require('../lib/cloudinary');

// মেমোরিতে রাখা হয় (Vercel এ ডিস্কে সেভ করা যায় না), তারপর Cloudinary তে আপলোড করা হয়
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // Vercel এর request body সীমা ~4.5MB, তাই safe রাখা
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

  router.use(requireAdmin);

  // ==== নতুন video entry বানানো (title + thumbnail) ====
  router.post('/videos', upload.single('thumbnail'), async (req, res) => {
    try {
      const { title } = req.body;
      if (!title || !req.file) {
        return res.status(400).json({ error: 'title এবং thumbnail দুটোই দরকার' });
      }

      const result = await uploadBuffer(req.file.buffer, 'drama-house/thumbnails');
      const video = await createPendingVideo({ title, thumbnailUrl: result.secure_url });

      res.json({
        ok: true,
        video: { id: video._id, title: video.title, pendingCode: video.pendingCode },
        instruction: `এখন এই ভিডিওটা টেলিগ্রামে বট চ্যাটে পাঠাও, caption এ ঠিক এই কোডটা লিখে: ${video.pendingCode}`,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/videos', async (req, res) => {
    const videos = await Video.find().sort({ createdAt: -1 }).lean();
    res.json({ videos });
  });

  // ==== Broadcast ====
  router.post('/broadcast', upload.single('image'), async (req, res) => {
    try {
      const { text } = req.body;
      if (!text && !req.file) {
        return res.status(400).json({ error: 'অন্তত টেক্সট অথবা ছবি দিতে হবে' });
      }

      let imageUrl = null;
      if (req.file) {
        const result = await uploadBuffer(req.file.buffer, 'drama-house/broadcast');
        imageUrl = result.secure_url;
      }

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
