const TEN_HOURS_MS = 10 * 60 * 60 * 1000;
const START_PLACE = 25;
const VOTES_PER_PLACE = 15;
const STATE = {
  user: { name: localStorage.getItem('guestName') || null },
  votes: JSON.parse(localStorage.getItem('votes') || '{}'), // { [id]: { total, last, history: [] } }
};
const DEFAULT_IMG = 'https://via.placeholder.com/300x300?text=Candidate';

const competitors = [
  {
    id: 'maieson',
    name: 'Maieson Williams',
    gender: 'Male',
    nationality: 'British / American',
    born: 'August 2013',
    age: 12,
    team: '—',
    img: '/Screenshot_20250824_134330_Instagram.png'
  },
  {
    id: 'kyron',
    name: 'Kyron Billyrose',
    gender: 'Male',
    nationality: 'United Kingdom',
    team: 'London Stars BC',
    age: 13,
    img: DEFAULT_IMG
  },
  {
    id: 'ryan',
    name: 'Ryan Udiofa',
    gender: 'Male',
    nationality: 'Texas, USA',
    team: 'Lstars/Texas',
    age: 13,
    img: DEFAULT_IMG
  },
  {
    id: 'kahlil',
    name: 'Kahlil Henry',
    gender: 'Male',
    nationality: 'Dallas, Texas',
    team: '—',
    age: 13,
    img: DEFAULT_IMG
  },
  // Females
  { id: 'brianna', name: 'Brianna Henry', gender: 'Female', age: 12, grade: '7th', img: DEFAULT_IMG },
  { id: 'kianna', name: 'Kianna Brown', gender: 'Female', age: 12, img: DEFAULT_IMG },
  { id: 'britanny', name: 'Britanny Tomlinson', gender: 'Female', age: 12, grade: '7th', img: DEFAULT_IMG },
];

function getVoteData(id) {
  if (!STATE.votes[id]) {
    // seed initial votes
    const seed = id === 'kyron' ? 190 : (id === 'britanny' ? 150 : 0);
    STATE.votes[id] = { total: seed, last: 0, history: [] };
  }
  return STATE.votes[id];
}
function persist() { localStorage.setItem('votes', JSON.stringify(STATE.votes)); }

function computePlace(total) {
  const shift = Math.floor(total / VOTES_PER_PLACE);
  return Math.max(1, START_PLACE - shift);
}

function fmtTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2,'0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2,'0');
  const ss = String(s % 60).padStart(2,'0');
  return `${hh}:${mm}:${ss}`;
}

function renderFeatured() {
  const id = 'maieson';
  const vd = getVoteData(id);
  document.getElementById('votes-maieson').textContent = vd.total;
  document.getElementById('place-maieson').textContent = computePlace(vd.total);
  updateCooldownBadge(id, 'cooldown-maieson');
}

function tileTemplate(c) {
  const vd = getVoteData(c.id);
  return `
    <div class="tile" data-id="${c.id}">
      <img class="thumb" src="${c.img}" alt="${c.name}">
      <div class="tile-body">
        <strong>${c.name}</strong>
        <div class="muted" style="font-size:12px">${c.nationality ? c.nationality + ' • ' : ''}${c.team ? c.team + ' • ' : ''}${c.age? ('Age ' + c.age) : ''} ${c.gender ? '• ' + c.gender : ''}</div>
        <div class="row gap" style="margin:8px 0">
          <button class="btn primary" data-action="vote-1" data-id="${c.id}">Vote</button>
          <button class="btn verify" data-action="vote-9" data-id="${c.id}">×9 Votes</button>
          <a class="btn outline" href="profile.html?id=${c.id}">View Profile</a>
        </div>
        <div class="meta">
          <span>Votes: <strong id="votes-${c.id}">${vd.total}</strong></span>
          <span>Place: <strong id="place-${c.id}">${computePlace(vd.total)}</strong></span>
          <span class="cooldown" id="cooldown-${c.id}"></span>
        </div>
      </div>
    </div>
  `;
}

function renderGrid() {
  const grid = document.getElementById('competitor-grid');
  grid.innerHTML = competitors.map(tileTemplate).join('');
}

function updateCooldownBadge(id, elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  const last = getVoteData(id).last;
  const remain = last ? (TEN_HOURS_MS - (Date.now() - last)) : 0;
  if (remain > 0) {
    el.textContent = `Next vote in ${fmtTime(remain)}`;
  } else {
    el.textContent = '';
  }
}

function tickCooldowns() {
  competitors.forEach(c => {
    updateCooldownBadge(c.id, `cooldown-${c.id}`);
  });
  updateCooldownBadge('maieson', 'cooldown-maieson');
}

function addRecent(v) {
  const key = 'recentVotes';
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.unshift(v);
  localStorage.setItem(key, JSON.stringify(arr.slice(0, 20)));
  renderRecent();
}

function renderRecent() {
  const ul = document.getElementById('recent-votes');
  const arr = JSON.parse(localStorage.getItem('recentVotes') || '[]');
  ul.innerHTML = arr.map(it => `<li class="muted">${new Date(it.time).toLocaleString()} — Voted ${it.amount} for <strong>${it.name}</strong></li>`).join('') || '<li class="muted">No votes yet.</li>';
}

function requireCooldown(id) {
  const last = getVoteData(id).last;
  return last && (Date.now() - last) < TEN_HOURS_MS;
}

function openModal(id) { document.getElementById(id).hidden = false; }
function closeModal(id) { document.getElementById(id).hidden = true; }

function showVoteModal(msg) {
  const body = document.getElementById('vote-modal-body');
  body.innerHTML = `<h3>${msg.title}</h3><p>${msg.text}</p><div class="row" style="justify-content:flex-end"><button class="btn primary" id="vote-ok">OK</button></div>`;
  openModal('vote-modal');
  document.getElementById('vote-ok').onclick = () => closeModal('vote-modal');
}

function confirmScreen({ comp, amount, reason }) {
  const card = document.getElementById('confirm-card');
  const body = document.getElementById('confirm-body');
  const ts = new Date();
  body.innerHTML = `
    <div class="confirm-snapshot" id="confirm-snapshot">
      <img src="${comp.img}" alt="${comp.name}"/>
      <div>
        <h3>Vote Confirmed</h3>
        <p>You voted for <strong>${comp.name}</strong></p>
        <p class="muted">Amount: ${amount} • ${ts.toLocaleString()}</p>
        <p>Reason: ${reason ? reason : '—'}</p>
      </div>
    </div>
  `;
  openModal('confirm-modal');

  // Share handlers
  document.getElementById('share-native').onclick = async () => {
    const text = `I voted for ${comp.name} on International Ball. Amount: ${amount} • ${ts.toLocaleString()}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Vote Confirmed', text }); } catch {}
    } else {
      navigator.clipboard.writeText(text);
      showVoteModal({ title: 'Copied', text: 'Vote details copied to clipboard.' });
    }
  };
  document.getElementById('download-pdf').onclick = async () => {
    const { jsPDF } = window.jspdf;
    const tsText = ts.toLocaleString();
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(18); pdf.text('International Ball — Vote Confirmation', pageW/2, 60, { align:'center' });
    pdf.setFontSize(12);
    pdf.text(`Player: ${comp.name}`, 60, 100);
    pdf.text(`Amount: ${amount}`, 60, 120);
    pdf.text(`Time: ${tsText}`, 60, 140);
    pdf.text(`Reason: ${reason || '—'}`, 60, 160, { maxWidth: pageW - 120 });
    // QR code
    const qr = new QRious({ value: `https://example.com/vote?player=${encodeURIComponent(comp.name)}&t=${ts.getTime()}`, size: 140 });
    pdf.addImage(qr.toDataURL('image/png'), 'PNG', pageW - 200, 100, 140, 140);
    // Donate button placeholder
    pdf.setDrawColor(0); pdf.setLineWidth(2);
    const btnY = pageH - 100; pdf.roundedRect(60, btnY, pageW - 120, 40, 8, 8);
    pdf.setFontSize(14); pdf.text('DONATE — Not available as yet', pageW/2, btnY + 26, { align:'center' });
    pdf.save(`vote_${comp.id}_${Date.now()}.pdf`);
  };
}

function doVote({ id, amount, requireReason=false }) {
  const comp = competitors.find(c => c.id === id);
  if (!comp) return;

  const proceed = (reasonText) => {
    const vd = getVoteData(id);
    vd.total += amount;
    vd.last = Date.now();
    vd.history.unshift({ time: vd.last, amount, reason: reasonText || '', user: STATE.user.name || 'Guest' });
    persist();

    // Update UI counts
    document.getElementById(`votes-${id}`).textContent = vd.total;
    document.getElementById(`place-${id}`).textContent = computePlace(vd.total);
    if (id === 'maieson') {
      document.getElementById('votes-maieson').textContent = vd.total;
      document.getElementById('place-maieson').textContent = computePlace(vd.total);
    }

    addRecent({ time: vd.last, amount, name: comp.name });

    // Envelope dropping into a box progress simulacrum (progress bar)
    showVoteModal({ title: 'Submitting Vote', text: 'Envelope dropping into the box...' });
    let p = 0;
    const barHolder = document.createElement('div');
    barHolder.className = 'progress';
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.width = '0%';
    barHolder.appendChild(bar);
    document.getElementById('vote-modal-body').appendChild(barHolder);
    const int = setInterval(() => {
      p += 10;
      bar.style.width = `${Math.min(100, p)}%`;
      if (p >= 100) {
        clearInterval(int);
        closeModal('vote-modal');
        confirmScreen({ comp, amount, reason: reasonText });
      }
    }, 120);
  };

  if (requireCooldown(id)) {
    showVoteModal({ title: 'Cooldown Active', text: 'You have already voted for this competitor in the last 10 hours.' });
    return;
  }

  if (requireReason) {
    // Ask reason then proceed
    const body = document.getElementById('vote-modal-body');
    body.innerHTML = `
      <h3>Reason for Voting</h3>
      <p class="muted">Tell us why you're voting for ${comp.name}.</p>
      <form id="reason-form" class="stack sm">
        <textarea id="vote-reason" rows="3" placeholder="Write your reason..." required></textarea>
        <div class="row" style="justify-content:flex-end; gap:8px">
          <button type="button" class="btn ghost" id="reason-cancel">Cancel</button>
          <button type="submit" class="btn primary">Submit</button>
        </div>
      </form>
    `;
    openModal('vote-modal');
    document.getElementById('reason-cancel').onclick = () => closeModal('vote-modal');
    document.getElementById('reason-form').onsubmit = (e) => {
      e.preventDefault();
      const reasonText = document.getElementById('vote-reason').value.trim();
      closeModal('vote-modal');
      proceed(reasonText);
    };
  } else {
    proceed('');
  }
}

function setupEvents() {
  // Login widgets
  const stateEl = document.getElementById('login-state');
  const nameInput = document.getElementById('guest-name');
  if (STATE.user.name) stateEl.textContent = `Logged in as ${STATE.user.name}`;
  document.getElementById('guest-login-form').onsubmit = (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    STATE.user.name = name;
    localStorage.setItem('guestName', name);
    stateEl.textContent = `Logged in as ${name}`;
    nameInput.value = '';
  };
  document.getElementById('home-login-btn').onclick = () => {
    document.querySelector('#guest-name').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear local vote history
  document.getElementById('clear-votes').onclick = () => {
    localStorage.removeItem('recentVotes');
    renderRecent();
  };

  // Grid click delegation
  document.getElementById('competitor-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === 'vote-1') doVote({ id, amount: 1, requireReason: true });
    if (action === 'vote-9') {
      // open verify modal; on success cast 9 with reason prompt
      openModal('verify-modal');
      const form = document.getElementById('verify-form');
      const prog = document.getElementById('verify-progress');
      const bar = prog.querySelector('.bar');
      const status = document.getElementById('verify-status');
      form.onsubmit = (ev) => {
        ev.preventDefault();
        const user = document.getElementById('ig-username').value.trim();
        if (!user) return;
        form.hidden = true; prog.hidden = false; status.textContent = 'Verifying...';
        let w = 0;
        const iv = setInterval(() => {
          w += 14;
          bar.style.width = `${Math.min(100,w)}%`;
          if (w >= 100) {
            clearInterval(iv);
            status.textContent = 'Your identity is verified.';
            setTimeout(() => {
              closeModal('verify-modal');
              // proceed with vote 9 (reason required)
              doVote({ id, amount: 9, requireReason: true });
              // reset modal for next time
              form.reset(); form.hidden = false; prog.hidden = true; bar.style.width = '0%'; status.textContent = '';
            }, 500);
          }
        }, 120);
      };
      document.getElementById('verify-close').onclick = () => { closeModal('verify-modal'); };
    }
  });

  // Featured buttons
  document.querySelectorAll('button[data-id="maieson"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      if (action === 'vote-1') doVote({ id:'maieson', amount:1, requireReason:true });
      if (action === 'vote-9') {
        // mimic the same path as grid (open verify)
        document.querySelector('#competitor-grid [data-id="maieson"][data-action="vote-9"]')?.click();
      }
    });
  });

  // Rules modal
  document.getElementById('view-rules').onclick = (e) => { e.preventDefault(); openModal('rules-modal'); };
  document.getElementById('close-rules').onclick = () => closeModal('rules-modal');

  // Other modal close buttons
  document.getElementById('vote-close').onclick = () => closeModal('vote-modal');
  document.getElementById('confirm-close').onclick = () => closeModal('confirm-modal');
}

function renderPeaceCountdown() {
  // August 30, 2025 09:00 EST => convert to local
  const target = new Date('2025-08-30T13:00:00Z').getTime(); // 9:00 EST = 13:00 UTC (EDT)
  const el = document.getElementById('peace-countdown');
  const update = () => {
    const now = Date.now();
    const ms = Math.max(0, target - now);
    const d = Math.floor(ms / (24*3600e3));
    const h = Math.floor((ms % (24*3600e3)) / 3600e3);
    const m = Math.floor((ms % 3600e3) / 60e3);
    const s = Math.floor((ms % 60e3) / 1000);
    el.textContent = `${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };
  update();
  setInterval(update, 1000);
}

function init() {
  renderGrid();
  renderFeatured();
  renderRecent();
  setupEvents();
  renderPeaceCountdown();
  setInterval(tickCooldowns, 1000);
}
document.addEventListener('DOMContentLoaded', init);