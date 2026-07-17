// public/watch.js
// Ad flow: as soon as the page loads, we start a 15-second visual countdown
// ("সার্ভারের সাথে কানেক্ট হচ্ছে...") AND trigger the Adsgram ad at the same time.
// We only call /api/unlock (which sends the video and applies the 24h lock)
// after the SDK reports the ad was genuinely watched.
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

// Your Adsgram block id.
const ADSGRAM_BLOCK_ID = '38638';
// TODO: replace with your bot's @username so "Check inbox" can deep-link to it.
const BOT_USERNAME = 'REPLACE_WITH_YOUR_BOT_USERNAME';

const params = new URLSearchParams(window.location.search);
const videoId = params.get('id');

const loadingState = document.getElementById('loadingState');
const successState = document.getElementById('successState');
const errorState = document.getElementById('errorState');
const statusTitle = document.getElementById('statusTitle');
const errorMsg = document.getElementById('errorMsg');

function showError(msg) {
  loadingState.hidden = true;
  successState.hidden = true;
  errorState.hidden = false;
  errorMsg.textContent = msg;
}

function showSuccess() {
  loadingState.hidden = true;
  errorState.hidden = true;
  successState.hidden = false;
}

// 15-second visual countdown shown while the ad loads/plays in the background
let countdownInterval = null;
function startCountdown() {
  let seconds = 15;
  statusTitle.textContent = `সার্ভারের সাথে কানেক্ট হচ্ছে... (${seconds})`;
  countdownInterval = setInterval(() => {
    seconds -= 1;
    if (seconds <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      statusTitle.textContent = 'অ্যাড দেখানো হচ্ছে...';
      return;
    }
    statusTitle.textContent = `সার্ভারের সাথে কানেক্ট হচ্ছে... (${seconds})`;
  }, 1000);
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

async function completeUnlock() {
  stopCountdown();
  statusTitle.textContent = 'ভিডিও পাঠানো হচ্ছে...';
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

function runAd() {
  if (!videoId) {
    showError('ভিডিও খুঁজে পাওয়া যায়নি।');
    return;
  }
  if (!window.Adsgram || ADSGRAM_BLOCK_ID.startsWith('REPLACE_')) {
    stopCountdown();
    showError('বিজ্ঞাপন সিস্টেম এখনো কনফিগার করা হয়নি (Adsgram block id সেট করুন)।');
    return;
  }

  // Start the 15-second countdown text AND trigger the Adsgram ad at the same moment
  startCountdown();

  const AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
  AdController.show()
    .then(() => {
      // Ad was genuinely shown and watched through — now unlock.
      completeUnlock();
    })
    .catch((result) => {
      // User skipped/closed the ad early, or no ad was available.
      stopCountdown();
      showError('অ্যাডটি সম্পূর্ণ দেখা হয়নি। ভিডিও আনলক করতে সম্পূর্ণ অ্যাডটি দেখুন।');
    });
}

document.getElementById('checkInboxBtn')?.addEventListener('click', () => {
  if (!BOT_USERNAME.startsWith('REPLACE_') && tg?.openTelegramLink) {
    tg.openTelegramLink(`https://t.me/${BOT_USERNAME}`);
  } else {
    tg?.close?.();
  }
});

runAd();
