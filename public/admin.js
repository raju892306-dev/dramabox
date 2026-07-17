// public/admin.js
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const initData = tg?.initData;

async function callAdmin(action, extra = {}) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, initData, ...extra }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function init() {
  if (!initData) {
    document.getElementById('deniedState').hidden = false;
    return;
  }
  try {
    const { pending } = await callAdmin('pendingUploads');
    document.getElementById('adminApp').hidden = false;

    const select = document.getElementById('pendingSelect');
    select.innerHTML = pending.length
      ? pending.map((p) => `<option value="${p._id}">Upload ${p._id} — ${new Date(p.createdAt).toLocaleString('bn-BD')}</option>`).join('')
      : '<option value="">কোনো নতুন ভিডিও নেই — বটে ভিডিও পাঠান আগে</option>';

    await loadVideos();
  } catch (e) {
    document.getElementById('deniedState').hidden = false;
    document.getElementById('deniedState').textContent = 'অ্যাক্সেস নেই: ' + e.message;
  }
}

async function loadVideos() {
  const { videos } = await callAdmin('listVideos');
  const list = document.getElementById('videoList');
  list.innerHTML = videos.length
    ? videos.map((v) => `<div class="pending-item"><span>${escapeHtml(v.title)}</span><span>${new Date(v.createdAt).toLocaleDateString('bn-BD')}</span></div>`).join('')
    : '<div class="pending-item">এখনো কিছু পাবলিশ করা হয়নি।</div>';
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

document.getElementById('publishBtn').addEventListener('click', async () => {
  const pendingUploadId = document.getElementById('pendingSelect').value;
  const title = document.getElementById('titleInput').value.trim();
  const thumbnailUrl = document.getElementById('thumbInput').value.trim();
  const statusEl = document.getElementById('publishStatus');

  if (!pendingUploadId || !title || !thumbnailUrl) {
    statusEl.textContent = 'সব ফিল্ড পূরণ করুন।';
    statusEl.className = 'status-msg err';
    return;
  }

  try {
    await callAdmin('publishVideo', { pendingUploadId, title, thumbnailUrl });
    statusEl.textContent = 'পাবলিশ হয়েছে ✅';
    statusEl.className = 'status-msg ok';
    document.getElementById('titleInput').value = '';
    document.getElementById('thumbInput').value = '';
    await init();
  } catch (e) {
    statusEl.textContent = 'সমস্যা হয়েছে: ' + e.message;
    statusEl.className = 'status-msg err';
  }
});

document.getElementById('broadcastBtn').addEventListener('click', async () => {
  const text = document.getElementById('broadcastText').value.trim();
  const imageUrl = document.getElementById('broadcastImage').value.trim();
  const statusEl = document.getElementById('broadcastStatus');

  if (!text) {
    statusEl.textContent = 'মেসেজ লিখুন।';
    statusEl.className = 'status-msg err';
    return;
  }

  statusEl.textContent = 'পাঠানো হচ্ছে...';
  statusEl.className = 'status-msg';
  try {
    const result = await callAdmin('broadcast', { text, imageUrl: imageUrl || undefined });
    statusEl.textContent = `পাঠানো হয়েছে ✅ (${result.sent}/${result.total})`;
    statusEl.className = 'status-msg ok';
    document.getElementById('broadcastText').value = '';
    document.getElementById('broadcastImage').value = '';
  } catch (e) {
    statusEl.textContent = 'সমস্যা হয়েছে: ' + e.message;
    statusEl.className = 'status-msg err';
  }
});

init();
