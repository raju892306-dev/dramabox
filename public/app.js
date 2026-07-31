// public/app.js
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const TELEGRAM_CHANNEL_URL = 'https://t.me/+nQBEmrjwdKQ1YTA9';
document.getElementById('telegramBtn').href = TELEGRAM_CHANNEL_URL;

const user = tg?.initDataUnsafe?.user;
if (user) {
  document.getElementById('userName').textContent = user.first_name || user.username || 'User';
  const avatarEl = document.getElementById('avatar');
  if (user.photo_url) {
    avatarEl.innerHTML = `<img src="${user.photo_url}" alt="" />`;
  } else {
    avatarEl.textContent = (user.first_name || '?')[0].toUpperCase();
  }
}

const grid = document.getElementById('grid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
let allVideos = [];

const REQUIRED_ADS = 5;

// ---------- Ads Unlock Modal (self-contained styles, injected once) ----------
(function injectAdsModalStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .ads-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .ads-modal-overlay[hidden] { display: none; }
    .ads-modal-box {
      background: #10141c;
      border: 1px solid #2a3040;
      border-radius: 16px;
      padding: 20px;
      width: 85%;
      max-width: 340px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    .ads-modal-title {
      color: #f5c542;
      font-weight: 700;
      font-size: 15px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ads-modal-progress-track {
      background: #1e2430;
      border-radius: 8px;
      height: 8px;
      width: 100%;
      overflow: hidden;
      margin: 10px 0 6px;
    }
    .ads-modal-progress-fill {
      background: linear-gradient(90deg, #2fa9ff, #1e7fe0);
      height: 100%;
      width: 0%;
      transition: width 0.3s ease;
    }
    .ads-modal-progress-label {
      color: #aab2c0;
      font-size: 13px;
      margin-bottom: 16px;
    }
    .ads-modal-btn {
      width: 100%;
      border: none;
      border-radius: 12px;
      padding: 14px;
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(90deg, #2fa9ff, #1e5fd0);
      cursor: pointer;
    }
    .ads-modal-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .ads-modal-close {
      position: absolute;
      top: 10px;
      right: 14px;
      color: #8a92a3;
      font-size: 20px;
      cursor: pointer;
      background: none;
      border: none;
    }
  `;
  document.head.appendChild(style);
})();

const adsModalOverlay = document.createElement('div');
adsModalOverlay.className = 'ads-modal-overlay';
adsModalOverlay.hidden = true;
adsModalOverlay.style.position = 'fixed';
adsModalOverlay.innerHTML = `
  <div class="ads-modal-box" style="position:relative;">
    <button class="ads-modal-close" id="adsModalClose">×</button>
    <div class="ads-modal-title">▶ Watch ${REQUIRED_ADS} ads to unlock</div>
    <div class="ads-modal-progress-track">
      <div class="ads-modal-progress-fill" id="adsProgressFill"></div>
    </div>
    <div class="ads-modal-progress-label">Progress: <span id="adsProgressText">0/${REQUIRED_ADS}</span></div>
    <button class="ads-modal-btn" id="adsWatchBtn">🔓 Watch Ad</button>
  </div>
`;
document.body.appendChild(adsModalOverlay);

const adsProgressFill = document.getElementById('adsProgressFill');
const adsProgressText = document.getElementById('adsProgressText');
const adsWatchBtn = document.getElementById('adsWatchBtn');
const adsModalClose = document.getElementById('adsModalClose');

let adsWatchedCount = 0;
let activeVideoId = null;
let activeThumbWrap = null;

function openAdsModal(videoId, thumbWrap) {
  activeVideoId = videoId;
  activeThumbWrap = thumbWrap;
  adsWatchedCount = 0;
  updateAdsProgressUI();
  adsModalOverlay.hidden = false;
}

function closeAdsModal() {
  adsModalOverlay.hidden = true;
  activeVideoId = null;
  activeThumbWrap = null;
}

function updateAdsProgressUI() {
  const pct = Math.min(100, (adsWatchedCount / REQUIRED_ADS) * 100);
  adsProgressFill.style.width = pct + '%';
  adsProgressText.textContent = `${adsWatchedCount}/${REQUIRED_ADS}`;
  if (adsWatchedCount >= REQUIRED_ADS) {
    adsWatchBtn.textContent = '✅ Unlock Video';
  } else {
    adsWatchBtn.textContent = '🔓 Watch Ad';
  }
}

adsModalClose.addEventListener('click', closeAdsModal);

adsWatchBtn.addEventListener('click', () => {
  if (adsWatchedCount >= REQUIRED_ADS) {
    // সব ad দেখা শেষ -> ভিডিও পাঠাও এবং modal বন্ধ করো
    const videoId = activeVideoId;
    const thumbWrap = activeThumbWrap;
    closeAdsModal();
    sendVideoDirectly(videoId, thumbWrap);
    return;
  }

  // AdsGalaxy ad কল করো (Promise-based, কোনো parameter ছাড়া)
  if (typeof window.showAdsGalaxy !== 'function') {
    tg?.showAlert?.('বিজ্ঞাপন লোড হয়নি, একটু পর আবার চেষ্টা করুন।');
    return;
  }

  adsWatchBtn.disabled = true;
  window.showAdsGalaxy()
    .then(() => {
      adsWatchedCount++;
      updateAdsProgressUI();
      adsWatchBtn.disabled = false;
    })
    .catch((error) => {
      console.error('Ad error:', error?.code, error?.message);
      adsWatchBtn.disabled = false;
      if (error?.code === 'NO_FILL') {
        tg?.showAlert?.('এই মুহূর্তে বিজ্ঞাপন পাওয়া যায়নি। একটু পর চেষ্টা করুন।');
      } else if (error?.code === 'INVALID_INIT_DATA') {
        tg?.showAlert?.('অ্যাপটি Telegram-এর ভেতর থেকে খুলুন।');
      } else if (error?.code === 'APP_NOT_READY') {
        tg?.showAlert?.('অ্যাপ এখনো প্রস্তুত না, একটু পর চেষ্টা করুন।');
      } else {
        tg?.showAlert?.('বিজ্ঞাপন দেখাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    });
});

// ---------- Video grid ----------
async function loadVideos() {
  try {
    const userId = user?.id || '';
    const res = await fetch(`/api/videos?userId=${userId}`);
    const data = await res.json();
    allVideos = data.videos || [];
    render(allVideos);
  } catch (e) {
    grid.innerHTML = '<div class="empty-state">লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।</div>';
  }
}

function render(videos) {
  grid.innerHTML = '';
  emptyState.hidden = videos.length !== 0;
  for (const v of videos) {
    const locked = v.lockedUntil && v.lockedUntil > Date.now();
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="thumb-wrap" data-id="${v.id}">
        <img src="${v.thumbnailUrl}" alt="${escapeHtml(v.title)}" loading="lazy" />
        
        ${locked ? `
          <div class="lock-overlay">
            <div class="lock-icon">🔒</div>
            <div class="lock-label">10 Min Locked</div>
          </div>` : ''}
      </div>
      <div class="card-footer">
        <div class="db-logo">DH</div>
        <div class="card-title">${escapeHtml(v.title)}</div>
      </div>
    `;
    const thumbWrap = card.querySelector('.thumb-wrap');
    thumbWrap.addEventListener('click', () => {
      if (locked) {
        tg?.showAlert?.('এই ভিডিওটি ১০ মিনিটের জন্য লক করা আছে।');
        return;
      }
      openAdsModal(v.id, thumbWrap);
    });
    grid.appendChild(card);
  }
}

async function sendVideoDirectly(videoId, thumbWrap) {
  thumbWrap.style.opacity = '0.6';
  thumbWrap.style.pointerEvents = 'none';
  try {
    const res = await fetch('/api/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, initData: tg?.initData }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 423) {
        tg?.showAlert?.('এই ভিডিওটি ১০ মিনিটের জন্য লক করা আছে।');
      } else {
        tg?.showAlert?.(data.error || 'সমস্যা হয়েছে, আবার চেষ্টা করুন।');
      }
      thumbWrap.style.opacity = '1';
      thumbWrap.style.pointerEvents = 'auto';
      return;
    }
    tg?.showAlert?.('ভিডিওটি আপনার ইনবক্সে পাঠানো হয়েছে ✅');
    await loadVideos();
  } catch (e) {
    tg?.showAlert?.('নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    thumbWrap.style.opacity = '1';
    thumbWrap.style.pointerEvents = 'auto';
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = allVideos.filter((v) => v.title.toLowerCase().includes(q));
  render(filtered);
});

loadVideos();
