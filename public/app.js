// public/app.js
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const TELEGRAM_CHANNEL_URL = 'https://t.me/+nQBEmrjwdKQ1YTA9';

document.getElementById('telegramBtn').href = TELEGRAM_CHANNEL_URL;


const user = tg?.initDataUnsafe?.user;
if (user) {
  document.getElementById('userName').textContent = user.first_name || user.username || 'User';
  document.getElementById('avatar').textContent = (user.first_name || '?')[0].toUpperCase();
}

const grid = document.getElementById('grid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');

let allVideos = [];

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
        <div class="badge-18">18+</div>
        ${locked ? `
          <div class="lock-overlay">
            <div class="lock-icon">🔒</div>
            <div class="lock-label">24H Locked</div>
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
        tg?.showAlert?.('এই ভিডিওটি আগামী ২৪ ঘণ্টার জন্য লক করা আছে।');
        return;
      }
      window.location.href = `watch.html?id=${v.id}`;
    });
    grid.appendChild(card);
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
