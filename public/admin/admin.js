const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

async function checkSession() {
  const res = await fetch('/api/admin/me');
  const data = await res.json();
  if (data.isAdmin) showDashboard();
}

loginBtn.addEventListener('click', async () => {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: passwordInput.value }),
  });
  const data = await res.json();
  if (data.ok) {
    showDashboard();
  } else {
    loginError.textContent = data.error || 'লগইন ব্যর্থ';
    loginError.classList.remove('hidden');
  }
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  location.reload();
});

function showDashboard() {
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  loadStats();
  loadVideos();
}

async function loadStats() {
  const res = await fetch('/api/admin/stats');
  const data = await res.json();
  document.getElementById('stat-users').textContent = data.userCount;
  document.getElementById('stat-videos').textContent = data.videoCount;
}

async function loadVideos() {
  const res = await fetch('/api/admin/videos');
  const data = await res.json();
  const tbody = document.getElementById('video-table-body');
  tbody.innerHTML = data.videos
    .map(
      (v) => `<tr>
        <td>${v.title}</td>
        <td>${v.status === 'ready' ? '✅ Live' : '⏳ ভিডিও ফাইলের অপেক্ষায়'}</td>
        <td>${v.status === 'ready' ? '—' : v.pendingCode}</td>
      </tr>`
    )
    .join('');
}

document.getElementById('video-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('video-title').value;
  const thumbFile = document.getElementById('video-thumbnail').files[0];

  const formData = new FormData();
  formData.append('title', title);
  formData.append('thumbnail', thumbFile);

  const res = await fetch('/api/admin/videos', { method: 'POST', body: formData });
  const data = await res.json();

  const box = document.getElementById('video-instruction');
  box.classList.remove('hidden');
  if (data.ok) {
    box.textContent = data.instruction;
    document.getElementById('video-form').reset();
    loadVideos();
    loadStats();
  } else {
    box.textContent = 'ভুল হয়েছে: ' + data.error;
  }
});

document.getElementById('broadcast-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = document.getElementById('broadcast-text').value;
  const imageFile = document.getElementById('broadcast-image').files[0];

  const formData = new FormData();
  formData.append('text', text);
  if (imageFile) formData.append('image', imageFile);

  const box = document.getElementById('broadcast-result');
  box.classList.remove('hidden');
  box.textContent = 'পাঠানো হচ্ছে...';

  const res = await fetch('/api/admin/broadcast', { method: 'POST', body: formData });
  const data = await res.json();

  if (data.ok) {
    box.textContent = `পাঠানো হয়েছে ${data.result.sent} জনকে (মোট ${data.result.total} জনের মধ্যে, ব্যর্থ ${data.result.failed})।`;
    document.getElementById('broadcast-form').reset();
  } else {
    box.textContent = 'ভুল হয়েছে: ' + data.error;
  }
});

checkSession();
