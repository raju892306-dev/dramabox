const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const telegramId = tg?.initDataUnsafe?.user?.id;

const listEl = document.getElementById('video-list');
const adModal = document.getElementById('ad-modal');
const successModal = document.getElementById('success-modal');
const countdownNum = document.getElementById('countdown-num');
const adStatusText = document.getElementById('ad-status-text');
const telegramBtn = document.getElementById('telegram-btn');
const closeSuccessBtn = document.getElementById('close-success-btn');

let adsgramBlockId = null;
let adController = null;

closeSuccessBtn.addEventListener('click', () => {
  successModal.classList.add('hidden');
  loadVideos(); // list রিফ্রেশ করে lock badge আপডেট দেখানো
});

async function init() {
  if (!telegramId) {
    listEl.innerHTML = '<p class="loading-text">এই অ্যাপটি Telegram এর ভিতর থেকে খুলুন।</p>';
    return;
  }

  const configRes = await fetch('/api/config');
  const config = await configRes.json();
  adsgramBlockId = config.adsgramBlockId;
  telegramBtn.href = config.telegramChannelLink;

  if (window.Adsgram && adsgramBlockId) {
    adController = window.Adsgram.init({ blockId: adsgramBlockId });
  }

  loadVideos();
}

async function loadVideos() {
  const res = await fetch(`/api/videos?telegramId=${telegramId}`);
  const data = await res.json();

  if (!data.videos || data.videos.length === 0) {
    listEl.innerHTML = '<p class="loading-text">এখনো কোনো ভিডিও যোগ করা হয়নি।</p>';
    return;
  }

  listEl.innerHTML = '';
  data.videos.forEach((video) => {
    const card = document.createElement('div');
    card.className = `video-card ${video.locked ? 'locked' : 'unlocked'}`;
    card.innerHTML = `
      <div class="thumb-wrap">
        <img src="${video.thumbnailUrl}" alt="${video.title}" />
        ${video.locked ? `<div class="lock-badge">🔒 24H Locked</div><div class="lock-overlay-icon">🔒</div>` : ''}
      </div>
      <div class="video-meta">
        <div class="badge">DH</div>
        <div class="title">${video.title}</div>
      </div>
    `;
    card.addEventListener('click', () => handleVideoClick(video));
    listEl.appendChild(card);
  });
}

function handleVideoClick(video) {
  if (video.locked) {
    tg?.showAlert('এই ভিডিওটি আগামী ২৪ ঘণ্টার জন্য লক করা আছে। পরে আবার চেষ্টা করুন।');
    return;
  }
  startAdFlow(video);
}

function startAdFlow(video) {
  adModal.classList.remove('hidden');
  adStatusText.textContent = 'বিজ্ঞাপন লোড হচ্ছে...';

  let seconds = 15;
  countdownNum.textContent = seconds;
  const timer = setInterval(() => {
    seconds -= 1;
    countdownNum.textContent = Math.max(seconds, 0);
    if (seconds <= 0) clearInterval(timer);
  }, 1000);

  runAd(video)
    .then(() => completeUnlock(video))
    .catch(() => {
      // ইউজার ad স্কিপ করলে বা ad load ব্যর্থ হলে
      clearInterval(timer);
      adModal.classList.add('hidden');
      tg?.showAlert('বিজ্ঞাপনটি সম্পূর্ণ দেখা হয়নি, তাই ভিডিওটি এখনো আনলক হয়নি। আবার চেষ্টা করুন।');
    })
    .finally(() => clearInterval(timer));
}

function runAd(video) {
  if (adController) {
    adStatusText.textContent = 'বিজ্ঞাপন চলছে...';
    return adController.show();
  }
  // Adsgram ব্লক আইডি সেট না থাকলে (টেস্টিং এর জন্য) শুধু countdown শেষে resolve হবে
  return new Promise((resolve) => setTimeout(resolve, 15000));
}

async function completeUnlock(video) {
  adModal.classList.add('hidden');
  try {
    const res = await fetch('/api/unlock/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId, videoId: video.id }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'unlock ব্যর্থ');
    successModal.classList.remove('hidden');
  } catch (err) {
    tg?.showAlert('একটা সমস্যা হয়েছে, আবার চেষ্টা করুন।');
  }
}

init();
