// public/watch.js
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

// RichAds (richinfo.co) config — pubId/appId set in watch.html's <head>.
// TODO: Once you get the Rewarded Ad zone ID / function from RichAds support,
// paste it into showOneRichAd() below — that's the only place it needs to go.
const BOT_USERNAME = 'Drramabox24bd_bot';
const ADS_REQUIRED = 3;

const params = new URLSearchParams(window.location.search);
const videoId = params.get('id');

const unlockCard = document.getElementById('unlockCard');
const successState = document.getElementById('successState');
const errorState = document.getElementById('errorState');
const errorMsg = document.getElementById('errorMsg');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const unlockBtn = document.getElementById('unlockBtn');

let watchedCount = 0;

function showError(msg) {
  unlockCard.hidden = true;
  successState.hidden = true;
  errorState.hidden = false;
  errorMsg.textContent = msg;
}

function showSuccess() {
  unlockCard.hidden = true;
  errorState.hidden = true;
  successState.hidden = false;
}

function updateProgress() {
  const pct = (watchedCount / ADS_REQUIRED) * 100;
  progressFill.style.width = `${pct}%`;
  progressText.textContent = `Progress: ${watchedCount}/${ADS_REQUIRED}`;
}

async function completeUnlock() {
  unlockBtn.disabled = true;
  unlockBtn.textContent = 'ভিডিও পাঠানো হচ্ছে...';
  try {
    const res = await fetch('/api/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, initData: tg?.initData }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 423) {
        showError('এই ভিডিওটি এখনো লক করা আছে। ২৪ ঘণ্টা পর আবার চেষ্টা করুন।');
      } else {
        showError(data.error || 'সমস্যা হয়েছে, আবার চেষ্টা করুন।');
      }
      return;
    }
    showSuccess();
  } catch (e) {
    showError('নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।');
  }
}

// ---- RichAds rewarded ad call ----
// PLACEHOLDER: RichAds support hasn't given us the specific rewarded-ad
// zone ID / show function yet. Once they do, replace the body of this
// function with their real call (it should return a Promise that resolves
// when the ad was genuinely watched through, and rejects if skipped/failed —
// same pattern Adsgram used).
function showOneRichAd() {
  return new Promise((resolve, reject) => {
    if (!window.TelegramAdsController) {
      reject(new Error('RichAds SDK not loaded yet'));
      return;
    }
    // TODO: replace this with the real RichAds rewarded-ad trigger once provided, e.g.:
    // window.TelegramAdsController.triggerRewarded({ zoneId: 'XXXX' }).then(resolve).catch(reject);
    reject(new Error('RichAds rewarded ad not configured yet — waiting on zone ID from RichAds support.'));
  });
}

function watchOneAd() {
  unlockBtn.disabled = true;
  unlockBtn.textContent = 'অ্যাড লোড হচ্ছে...';

  showOneRichAd()
    .then(() => {
      // This ad was genuinely watched through
      watchedCount += 1;
      updateProgress();

      if (watchedCount >= ADS_REQUIRED) {
        completeUnlock();
      } else {
        unlockBtn.disabled = false;
        unlockBtn.textContent = `🔒 Watch Ad ${watchedCount + 1}/${ADS_REQUIRED}`;
      }
    })
    .catch((err) => {
      console.error('Ad error:', err);
      unlockBtn.disabled = false;
      unlockBtn.textContent = '🔒 Unlock Video';
      tg?.showAlert?.('অ্যাডটি সম্পূর্ণ দেখা হয়নি। আবার চেষ্টা করুন।');
    });
}

if (!videoId) {
  showError('ভিডিও খুঁজে পাওয়া যায়নি।');
} else {
  updateProgress();
  unlockBtn.addEventListener('click', watchOneAd);
}

document.getElementById('checkInboxBtn')?.addEventListener('click', () => {
  if (!BOT_USERNAME.startsWith('REPLACE_') && tg?.openTelegramLink) {
    tg.openTelegramLink(`https://t.me/${BOT_USERNAME}`);
  } else {
    tg?.close?.();
  }
});
