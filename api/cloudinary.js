// lib/cloudinary.js — thumbnail/broadcast image আপলোড করার জন্য
// Vercel এ ডিস্কে ফাইল সেভ করা যায় না বলে Cloudinary (external image host) ব্যবহার করা হচ্ছে

const cloudinary = require('cloudinary').v2;

// process.env.CLOUDINARY_URL থাকলে এই লাইব্রেরি নিজে থেকেই কনফিগার হয়ে যায়
// (cloudinary://<api_key>:<api_secret>@<cloud_name> ফরম্যাটে)

function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

module.exports = { uploadBuffer };
