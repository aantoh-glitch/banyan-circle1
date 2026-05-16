import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(
  'https://wwdnuajhqfajvsexszpy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZG51YWpocWZhanZzZXhzenB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzM3NjgsImV4cCI6MjA5NDUwOTc2OH0.gtPmoxyBgk6feOghdouE4BW1TQwLQjeJ2C0ZXSaZYU4'
);

// ---- AUTH — PIN login uses localStorage ----
const localUser = JSON.parse(localStorage.getItem('bc_user') || 'null');
if (!localUser) {
  window.location.href = '/login.html';
  throw new Error('Not logged in'); // Stop script execution
}

const ini = n => (n || '?').split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
document.getElementById('user-av').textContent = ini(localUser.name);

// ---- DATE ----
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
document.getElementById('hdr-date').textContent = today.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const attDateEl = document.getElementById('att-date');
if (attDateEl) attDateEl.textContent = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
const lfDateEl = document.getElementById('lf-date');
if (lfDateEl) lfDateEl.value = todayStr;

// ---- PWA INSTALL ----
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  document.getElementById('install-banner').classList.add('show');
});
document.getElementById('install-btn')?.addEventListener('click', async () => {
  if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; }
  document.getElementById('install-banner').classList.remove('show');
});

// ---- NOTIFICATIONS ----
const notifs = [];
function addNotif(n) {
  notifs.unshift({ ...n, time: new Date() });
  document.getElementById('notif-dot').classList.add('show');
  renderNotifs();
  showToast(n.title + ': ' + n.body);
}
function renderNotifs() {
  const el = document.getElementById('notif-list');
  el.innerHTML = notifs.length ? notifs.map(n => `
    <div class="notif-item"><div class="notif-title">${n.title}</div>
    <div class="notif-body">${n.body}</div>
    <div class="notif-time">${n.time.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div></div>`).join('')
    : '<div class="notif-empty">No notifications yet</div>';
}
window.toggleNotifPanel = () => {
  const p = document.getElementById('notif-panel');
  p.classList.toggle('open');
  if (p.classList.contains('open')) document.getElementById('notif-dot').classList.remove('show');
};
window.clearNotifs = () => { notifs.length = 0; renderNotifs(); };
document.addEventListener('click', e => { if (!e.target.closest('#notif-panel') && !e.target.closest('#notif-btn')) document.getElementById('notif-panel').classList.remove('open'); });
// push notifications - configure after Supabase auth setup

// ---- CACHE ----
let properties = [], staffList = [], allAssets = [], allCommunity = [], hkFilter = 'post_checkout';

// ---- BOOT ----
async function boot() {
  const [{ data: props }, { data: staff }] = await Promise.all([
    supabase.from('properties').select('*').order('name'),
    supabase.from('staff').select('*').order('name'),
  ]);
  properties = props || [];
  staffList = staff || [];
  populateSelects();
  loadDashboard(); buildCal(); loadBookings();
  loadAttendance(); loadHousekeeping(); loadGuestList();
  loadLaundry(); loadComplaints(); loadAssets(); loadLostFound(); loadCommunity();
}

function populateSelects() {
  const po = properties.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  const so = `<option value="">— None —</option>` + staffList.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  ['att-prop-sel','hk-prop-sel','bk-prop-sel','lm-prop-sel','comp-prop-sel','asset-prop-sel','lf-prop-sel'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = po; });
  ['att-staff-sel','comp-assign-sel','lf-staff-sel'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = so; });
}

// ---- HELPERS ----
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
function sourceBadge(s) {
  const m = { airbnb: 'bdg-br', booking_com: 'bdg-b', manual: 'bdg-muted' };
  const l = { airbnb: 'Airbnb', booking_com: 'Booking.com', manual: 'Phone' };
  return `<span class="bdg ${m[s]||'bdg-muted'}">${l[s]||s}</span>`;
}
function statusBadge(s) {
  const m = { Present:'bdg-g','Half day':'bdg-a',Leave:'bdg-r','Sick leave':'bdg-r',Off:'bdg-muted' };
  return `<span class="bdg ${m[s]||'bdg-muted'}">${s}</span>`;
}
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
window.showToast = showToast;

// ---- NAV ----
window.nav = (id, btn) => {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('on'));
  document.getElementById('p-' + id).classList.add('on');
  btn.classList.add('on');
  document.getElementById('notif-panel').classList.remove('open');
  window.scrollTo(0, 0);
};
window.toggleForm = id => { const el = document.getElementById(id); el.style.display = el.style.display === 'none' ? 'block' : 'none'; };
window.chip = (el, gId) => { document.getElementById(gId).querySelectorAll('.chip').forEach(c => c.classList.remove('on')); el.classList.add('on'); };
window.doSignOut = async () => { if (confirm('Sign out?')) { await supabase.auth.signOut(); localStorage.removeItem('bc_user'); window.location.href = '/login.html'; } };

// ---- DASHBOARD ----
async function loadDashboard() {
  const [{ data: att }, { data: bks }, { data: tasks }, { data: comps }, { data: co }] = await Promise.all([
    supabase.from('attendance').select('*').eq('date', todayStr),
    supabase.from('bookings').select('*').lte('check_in', todayStr).gte('check_out', todayStr),
    supabase.from('housekeeping_tasks').select('*').eq('date', todayStr).neq('is_completed', true),
    supabase.from('guest_complaints').select('*, properties(name)').eq('status', 'open'),
    supabase.from('bookings').select('*, properties(name)').eq('check_out', todayStr),
  ]);
  document.getElementById('d-staff').textContent = `${att?.filter(a=>a.status==='Present').length||0}/${staffList.length||3}`;
  document.getElementById('d-staff-h').textContent = att?.some(a=>['Leave','Sick leave'].includes(a.status)) ? 'Someone on leave' : 'All present';
  document.getElementById('d-bk').textContent = bks?.length || 0;
  document.getElementById('d-tasks').textContent = tasks?.length || 0;
  document.getElementById('d-comp').textContent = comps?.length || 0;
  document.getElementById('d-comp-h').textContent = comps?.length ? comps[0].properties?.name : 'All clear';

  const coEl = document.getElementById('d-checkouts');
  coEl.innerHTML = co?.length ? co.map(b => `
    <div class="bk-card">
      <div class="bk-hdr"><div class="bk-g">${b.guest_name}</div>${sourceBadge(b.source)}</div>
      <div class="bk-p"><i class="ti ti-building" style="font-size:11px"></i> ${b.properties?.name}</div>
    </div>`).join('') : '<div class="empty-msg">No checkouts today</div>';

  const myEl = document.getElementById('d-mytasks');
  myEl.innerHTML = tasks?.length ? tasks.slice(0, 4).map(t => `
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
      <div style="flex:1;font-size:13px">${t.task_name}</div>
      <span class="bdg bdg-a">Pending</span>
    </div>`).join('') : '<div class="empty-msg">All tasks done 🎉</div>';
}

// ---- ATTENDANCE ----
async function loadAttendance() {
  const { data } = await supabase.from('attendance').select('*, staff(name,designation), properties(name)').eq('date', todayStr).order('created_at', { ascending: false });
  const el = document.getElementById('att-list');
  el.innerHTML = data?.length ? `<div class="card">${data.map(a => `
    <div class="row">
      <div class="av">${ini(a.staff?.name)}</div>
      <div class="rb"><div class="rn">${a.staff?.name||'—'}</div><div class="rm">${a.staff?.designation||''} · ${a.properties?.name||''}</div>${a.duty_start?`<div class="rm">${a.duty_start}${a.duty_end?' – '+a.duty_end:''}</div>`:''}</div>
      ${statusBadge(a.status)}
    </div>`).join('')}</div>` : '<div class="card"><div class="empty-msg">No attendance logged yet</div></div>';
}

window.submitAtt = async () => {
  const status = document.querySelector('#att-chips .chip.on')?.textContent;
  if (!status) { showToast('Select a status'); return; }
  const { error } = await supabase.from('attendance').insert({
    staff_id: document.getElementById('att-staff-sel').value || null,
    property_id: document.getElementById('att-prop-sel').value,
    date: todayStr, status,
    duty_start: document.getElementById('att-start').value || null,
    duty_end: document.getElementById('att-end').value || null,
    remarks: document.getElementById('att-remarks').value || null,
  });
  if (error) { showToast('Error: ' + error.message); return; }
  showToast('Attendance logged ✓'); toggleForm('att-form');
  loadAttendance(); loadDashboard();
};

// ---- TASKS with status buttons + photo ----
async function loadHousekeeping() {
  const { data } = await supabase.from('housekeeping_tasks').select('*, properties(name)').eq('task_type', hkFilter).eq('date', todayStr).order('created_at');
  const el = document.getElementById('hk-list');
  if (!data?.length) { el.innerHTML = '<div class="empty-msg" style="padding:30px;text-align:center">No tasks. Add one above.</div>'; return; }
  const byProp = {};
  data.forEach(t => { const p = t.properties?.name || 'Unknown'; if (!byProp[p]) byProp[p] = []; byProp[p].push(t); });
  el.innerHTML = Object.entries(byProp).map(([prop, tasks]) => {
    const done = tasks.filter(t => t.is_completed).length;
    return `<div style="margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div style="font-size:14px;font-weight:500">${prop}</div>
        <span class="bdg ${done===tasks.length?'bdg-g':'bdg-a'}">${done}/${tasks.length}</span>
      </div>
      <div class="pbar"><div class="pfill" style="width:${Math.round(done/tasks.length*100)}%"></div></div>
      ${tasks.map(t => renderTaskCard(t)).join('')}
    </div>`;
  }).join('');

  // Event delegation for task buttons
  el.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = btn.dataset.action;
      const taskId = btn.dataset.task;
      if (action === 'photo') { uploadPhoto(taskId, btn); }
      else { setStatus(taskId, action, btn); }
    });
  });
}

function renderTaskCard(t) {
  const done = t.is_completed;
  return `<div class="task-card" id="tc-${t.id}">
    <div class="task-card-hdr">
      <div class="task-chk ${done?'chk-done':''}">
        <i class="ti ti-check"></i>
      </div>
      <div class="task-body">
        <div class="task-name" style="${done?'text-decoration:line-through;color:var(--muted)':''}">${t.task_name}</div>
        ${t.notes ? `<div class="task-meta">${t.notes}</div>` : ''}
      </div>
    </div>
    <div class="task-actions">
      <button class="status-btn ${!done?'s-ns':''}" data-action="pending" data-task="${t.id}">
        Pending
      </button>
      <button class="status-btn ${done?'s-dn':''}" data-action="done" data-task="${t.id}">
        Completed
      </button>
      <button class="photo-btn ${t.photo_url?'photo-uploaded':''}" data-action="photo" data-task="${t.id}" style="margin-left:auto">
        <i class="ti ti-${t.photo_url?'photo':'camera'}"></i>
      </button>
    </div>
    ${t.photo_url ? `<img class="task-photo-preview" src="${t.photo_url}" alt="Task photo"/>` : ''}
  </div>`;
}

window.setStatus = async (id, status, clickedBtn) => {
  const done = status === 'done';
  const { error } = await supabase.from('housekeeping_tasks').update({
    status, is_completed: done, completed_at: done ? new Date().toISOString() : null
  }).eq('id', id);
  if (error) { showToast('Update failed'); return; }
  const card = document.getElementById('tc-' + id);
  card.querySelectorAll('.status-btn').forEach(b => b.classList.remove('s-ns', 's-ip', 's-dn'));
  clickedBtn.classList.add(status==='not_started'?'s-ns':status==='in_progress'?'s-ip':'s-dn');
  const chk = card.querySelector('.task-chk');
  chk.className = 'task-chk' + (done?' chk-done':status==='in_progress'?' chk-prog':'');
  const name = card.querySelector('.task-name');
  name.style.textDecoration = done ? 'line-through' : '';
  name.style.color = done ? 'var(--muted)' : '';
  showToast(done ? 'Task done ✓' : 'Status updated');
  loadDashboard();
};

window.uploadPhoto = taskId => {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async () => {
    const file = input.files[0]; if (!file) return;
    showToast('Uploading…');
    const path = `housekeeping/${taskId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('housekeeping-photos').upload(path, file, { upsert: true });
    if (error) { showToast('Upload failed: ' + error.message); return; }
    const { data: { publicUrl } } = supabase.storage.from('housekeeping-photos').getPublicUrl(path);
    await supabase.from('housekeeping_tasks').update({ photo_url: publicUrl }).eq('id', taskId);
    const card = document.getElementById('tc-' + taskId);
    const btn = card.querySelector('.photo-btn');
    btn.classList.add('photo-uploaded');
    btn.innerHTML = '<i class="ti ti-photo"></i>';
    let img = card.querySelector('.task-photo-preview');
    if (!img) { img = document.createElement('img'); img.className = 'task-photo-preview'; card.appendChild(img); }
    img.src = publicUrl;
    showToast('Photo uploaded ✓');
  };
  input.click();
};

window.filterHK = (el, type) => {
  hkFilter = type;
  document.querySelectorAll('.tt').forEach(t => t.classList.remove('on'));
  el.classList.add('on');
  loadHousekeeping();
};

window.submitTask = async () => {
  const typeRaw = document.querySelector('#hk-type-chips .chip.on')?.textContent;
  if (!typeRaw) { showToast('Select a task type'); return; }
  const typeMap = { 'Post-checkout':'post_checkout', 'Regular':'regular', 'Pre-checkin':'pre_checkin' };
  const { error } = await supabase.from('housekeeping_tasks').insert({
    property_id: document.getElementById('hk-prop-sel').value,
    task_type: typeMap[typeRaw] || 'regular',
    task_name: document.getElementById('hk-name').value,
    notes: document.getElementById('hk-notes').value || null,
    date: todayStr, status: 'not_started', is_completed: false,
  });
  if (error) { showToast('Error: ' + error.message); return; }
  showToast('Task added ✓'); toggleForm('hk-form');
  document.getElementById('hk-name').value = '';
  document.getElementById('hk-notes').value = '';
  loadHousekeeping();
};

// ---- GUEST LIST ----
async function loadGuestList() {
  const { data } = await supabase.from('bookings').select('*, properties(name)').lte('check_in', todayStr).gte('check_out', todayStr).order('check_in');
  const el = document.getElementById('guest-list-el');
  el.innerHTML = data?.length ? data.map(b => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">
      <div class="av">${ini(b.guest_name)}</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:500">${b.guest_name}</div>
        <div style="font-size:12px;color:var(--muted)"><i class="ti ti-building" style="font-size:11px"></i> ${b.properties?.name} · ${b.num_guests} guests</div>
        <div style="font-size:11px;color:var(--muted)">In: ${fmtDate(b.check_in)} · Out: ${fmtDate(b.check_out)}</div>
      </div>
      ${sourceBadge(b.source)}
    </div>`).join('') : '<div class="empty-msg">No guests currently checked in</div>';
}

// ---- BOOKINGS ----
function buildCal() {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = '';
  for (let i = -3; i <= 10; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    html += `<div class="cd ${i===0?'td':''}"><div class="cw">${days[d.getDay()]}</div><div class="cn">${d.getDate()}</div></div>`;
  }
  document.getElementById('bk-cal').innerHTML = html;
}

async function loadBookings() {
  const { data } = await supabase.from('bookings').select('*, properties(name)').gte('check_out', todayStr).order('check_in');
  const el = document.getElementById('bk-list');
  el.innerHTML = data?.length ? `<div class="card"><div class="card-ttl">Active & upcoming</div>${data.map(b=>`
    <div class="bk-card">
      <div class="bk-hdr"><div class="bk-g">${b.guest_name}</div>${sourceBadge(b.source)}</div>
      <div style="display:flex;gap:12px;font-size:12px;color:var(--muted);margin-bottom:5px"><span>In: ${fmtDate(b.check_in)}</span><span>Out: ${fmtDate(b.check_out)}</span><span>${b.num_guests} guests</span></div>
      <div style="font-size:11px;color:var(--muted)"><i class="ti ti-building" style="font-size:11px"></i> ${b.properties?.name}</div>
    </div>`).join('')}</div>` : '<div class="card"><div class="empty-msg">No upcoming bookings</div></div>';
}

window.submitBooking = async () => {
  const ci = document.getElementById('bk-ci').value, co = document.getElementById('bk-co').value;
  const rate = parseFloat(document.getElementById('bk-rate').value) || null;
  const nights = rate && ci && co ? Math.round((new Date(co)-new Date(ci))/864e5) : null;
  const { error } = await supabase.from('bookings').insert({
    property_id: document.getElementById('bk-prop-sel').value,
    guest_name: document.getElementById('bk-guest').value,
    guest_phone: document.getElementById('bk-phone').value || null,
    check_in: ci, check_out: co,
    num_guests: parseInt(document.getElementById('bk-num').value)||1,
    source: 'manual', nightly_rate: rate,
    total_amount: rate&&nights ? rate*nights : null,
  });
  if (error) { showToast('Error: '+error.message); return; }
  showToast('Booking saved ✓'); toggleForm('bk-form');
  loadBookings(); loadDashboard(); loadGuestList();
};

// ---- LAUNDRY ----
async function loadLaundry() {
  const { data } = await supabase.from('laundry_movement').select('*, properties(name)').order('created_at',{ascending:false}).limit(10);
  const el = document.getElementById('laundry-list');
  el.innerHTML = data?.length ? data.map(l=>`
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:14px;font-weight:500">${l.properties?.name} — ${l.vendor_name}</div>
        <span class="bdg ${l.status==='sent'?'bdg-a':'bdg-g'}">${l.status==='sent'?'Out':'Returned'}</span>
      </div>
      <div style="font-size:13px;color:var(--muted)">${fmtDate(l.sent_date)} · ${l.total_items||0} items</div>
      ${l.status==='sent'?`<button class="btn-s" style="margin-top:10px" onclick="logReturn('${l.id}')"><i class="ti ti-arrow-back"></i> Log return</button>`:''}
    </div>`).join('') : '<div class="card"><div class="empty-msg">No laundry records yet</div></div>';
}
window.logReturn = async id => {
  const inv = prompt('Invoice amount (₹)?');
  const paid = confirm('Mark as paid?');
  await supabase.from('laundry_return').insert({movement_id:id,property_id:null,vendor_name:'—',return_date:todayStr,invoice_amount:inv?parseFloat(inv):null,payment_status:paid?'paid':'unpaid'});
  await supabase.from('laundry_movement').update({status:'returned'}).eq('id',id);
  showToast('Return logged ✓'); loadLaundry();
};
window.submitLaundry = async () => {
  const { error } = await supabase.from('laundry_movement').insert({
    property_id:document.getElementById('lm-prop-sel').value,
    vendor_name:document.getElementById('lm-vendor').value,
    sent_date:todayStr,
    bedsheets:+document.getElementById('lm-bs').value,
    pillow_covers:+document.getElementById('lm-pc').value,
    bath_towels:+document.getElementById('lm-bt').value,
    hand_towels:+document.getElementById('lm-ht').value,
    duvet_covers:+document.getElementById('lm-dc').value,
    kitchen_linen:+document.getElementById('lm-kl').value,
  });
  if (error) { showToast('Error: '+error.message); return; }
  showToast('Laundry logged ✓'); toggleForm('lm-form'); loadLaundry();
};

// ---- COMPLAINTS ----
async function loadComplaints() {
  const { data } = await sb.from('guest_complaints')
    .select('*, properties(name), staff(name)')
    .order('created_at', { ascending: false });
  const el = document.getElementById('complaints-list');
  if (!data?.length) {
    el.innerHTML = '<div class="card"><div class="empty-msg">No complaints yet</div></div>';
    return;
  }
  const open = data.filter(c => c.status === 'open');
  const inprog = data.filter(c => c.status === 'in_progress');
  const done = data.filter(c => c.status === 'resolved');

  const renderCard = c => `
    <div data-complaint-id="${c.id}" style="padding:13px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s" onmouseenter="this.style.background='#F9F8F6'" onmouseleave="this.style.background=''">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
        <div style="font-size:14px;font-weight:500">${c.guest_name || 'Guest'}</div>
        <span class="bdg ${c.status==='open'?'bdg-r':c.status==='in_progress'?'bdg-a':'bdg-g'}">${c.status.replace('_',' ')}</span>
      </div>
      <div style="font-size:13px;color:var(--text);line-height:1.5">${c.complaint}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:5px;display:flex;gap:10px">
        <span>${c.properties?.name || ''}</span>
        <span>${fmtDate(c.created_at?.split('T')[0])}</span>
        ${c.staff ? '<span>→ ' + c.staff.name + '</span>' : ''}
      </div>
    </div>`;

  el.innerHTML = `
    ${open.length ? `<div class="card"><div class="card-ttl">Open (${open.length})</div>${open.map(renderCard).join('')}</div>` : ''}
    ${inprog.length ? `<div class="card"><div class="card-ttl">In progress (${inprog.length})</div>${inprog.map(renderCard).join('')}</div>` : ''}
    ${done.length ? `<div class="card"><div class="card-ttl">Resolved</div>${done.map(renderCard).join('')}</div>` : ''}`;

  // Event delegation — works with module scope
  el.querySelectorAll('[data-complaint-id]').forEach(row => {
    row.addEventListener('click', () => openComplaint(row.dataset.complaintId));
  });
}

// Open complaint detail + assign sheet
window.openComplaint = async (id) => {
  const { data: c } = await sb.from('guest_complaints')
    .select('*, properties(name), staff(name)')
    .eq('id', id).single();
  if (!c) return;

  // Build modal
  let modal = document.getElementById('comp-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'comp-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:500;display:flex;align-items:flex-end;justify-content:center';
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
  }

  const staffOpts = staffList.map(s => `<option value="${s.id}" ${c.assigned_to===s.id?'selected':''}>${s.name}</option>`).join('');

  modal.innerHTML = `
    <div style="background:#fff;border-radius:20px 20px 0 0;padding:24px 20px 40px;width:100%;max-width:480px;max-height:85vh;overflow-y:auto">
      <div style="width:36px;height:4px;border-radius:2px;background:rgba(0,0,0,0.1);margin:0 auto 20px"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div style="font-family:'Playfair Display',serif;font-size:18px">Complaint</div>
        <button id="btn-close-modal" style="background:none;border:none;font-size:24px;cursor:pointer;color:#5F5E5A;line-height:1">×</button>
      </div>
      <div style="font-size:13px;color:#5F5E5A;margin-bottom:6px">${c.guest_name || 'Guest'} · ${c.properties?.name || ''} · ${fmtDate(c.created_at?.split('T')[0])}</div>
      <div style="font-size:15px;line-height:1.6;color:#2C2C2A;background:#F9F8F6;border-radius:10px;padding:14px;margin-bottom:20px">${c.complaint}</div>

      <div style="margin-bottom:14px">
        <label style="display:block;font-size:12px;color:#5F5E5A;margin-bottom:6px">Assign to</label>
        <select id="modal-assign" style="width:100%;padding:11px 13px;border:1px solid rgba(0,0,0,0.12);border-radius:9px;font-size:14px;font-family:inherit;background:#fff;color:#2C2C2A;appearance:none">
          <option value="">— Unassigned —</option>
          ${staffOpts}
        </select>
      </div>

      <div style="display:flex;gap:10px">
        <button id="btn-assign-modal"
          style="flex:1;padding:13px;background:#993C1D;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit">
          Assign → Send to tasks
        </button>
        <button id="btn-resolve-modal"
          style="flex:1;padding:13px;background:#EAF3DE;color:#3B6D11;border:none;border-radius:10px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit">
          Mark resolved
        </button>
      </div>
    </div>`;

  const cId = c.id;
  document.getElementById('btn-close-modal').onclick = () => modal.remove();
  document.getElementById('btn-assign-modal').onclick = () => assignComplaint(cId);
  document.getElementById('btn-resolve-modal').onclick = () => resolveComplaint(cId);
};

window.assignComplaint = async (compId) => {
  const assignedTo = document.getElementById('modal-assign').value || null;

  // Get complaint details
  const { data: c } = await sb.from('guest_complaints')
    .select('*, properties(name)').eq('id', compId).single();

  // Update complaint status
  await sb.from('guest_complaints').update({
    status: 'in_progress',
    assigned_to: assignedTo || null,
  }).eq('id', compId);

  // Create a task from this complaint
  await sb.from('housekeeping_tasks').insert({
    property_id: c.property_id,
    task_type: 'regular',
    task_name: 'Guest complaint: ' + c.complaint.slice(0, 80),
    notes: 'From guest: ' + (c.guest_name || 'Guest'),
    date: new Date().toISOString().split('T')[0],
    status: 'not_started',
    is_completed: false,
  });

  document.getElementById('comp-modal')?.remove();
  showToast('Assigned & added to tasks ✓');
  loadComplaints(); loadDashboard(); loadHousekeeping();
};

window.resolveComplaint = async (id) => {
  await sb.from('guest_complaints').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id);
  document.getElementById('comp-modal')?.remove();
  showToast('Marked resolved ✓');
  loadComplaints(); loadDashboard();
};

window.submitComplaint = async () => {
  const text = document.getElementById('comp-text').value.trim();
  if (!text) { showToast('Enter a complaint'); return; }
  const { error } = await sb.from('guest_complaints').insert({
    property_id: document.getElementById('comp-prop-sel').value,
    guest_name: document.getElementById('comp-guest').value || null,
    complaint: text,
    assigned_to: document.getElementById('comp-assign-sel').value || null,
    status: 'open',
  });
  if (error) { showToast('Error: ' + error.message); return; }
  showToast('Complaint logged ✓');
  toggleForm('comp-form');
  document.getElementById('comp-text').value = '';
  loadComplaints(); loadDashboard();
};

// ---- ASSETS ----
async function loadAssets() {
  const { data } = await supabase.from('assets').select('*, properties(name)').order('name');
  allAssets = data||[];
  const el = document.getElementById('assets-list');
  if (!allAssets.length) { el.innerHTML='<div class="card"><div class="empty-msg">No assets registered yet</div></div>'; return; }
  const byP = {};
  allAssets.forEach(a=>{const p=a.properties?.name||'Unknown';if(!byP[p])byP[p]=[];byP[p].push(a);});
  el.innerHTML = Object.entries(byP).map(([prop,items])=>`
    <div class="card"><div class="card-ttl">${prop}</div>
    ${items.map(a=>`
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:40px;height:40px;border-radius:9px;background:var(--surface);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-package" style="font-size:19px;color:var(--muted)"></i></div>
        <div style="flex:1"><div style="font-size:14px;font-weight:500">${a.name}</div><div style="font-size:12px;color:var(--muted)">${a.category||''} · ${fmtDate(a.added_date)}</div></div>
        <span class="bdg bdg-g">Here</span>
      </div>`).join('')}
    </div>`).join('');
}
window.submitAsset = async () => {
  let photoUrl=null;
  const file=document.getElementById('asset-photo-in').files[0];
  if(file){
    const path=`assets/${Date.now()}_${file.name}`;
    const {error:upErr}=await supabase.storage.from('asset-photos').upload(path,file);
    if(!upErr){const {data:{publicUrl}}=supabase.storage.from('asset-photos').getPublicUrl(path);photoUrl=publicUrl;}
  }
  const {error}=await supabase.from('assets').insert({
    name:document.getElementById('asset-name').value,
    category:document.getElementById('asset-cat').value,
    current_property_id:document.getElementById('asset-prop-sel').value,
    description:document.getElementById('asset-desc').value||null,
    photo_url:photoUrl,
  });
  if(error){showToast('Error: '+error.message);return;}
  showToast('Asset saved ✓'); toggleForm('asset-form'); loadAssets();
};

// ---- LOST & FOUND ----
async function loadLostFound() {
  const {data}=await supabase.from('lost_and_found').select('*, properties(name)').order('created_at',{ascending:false});
  const el=document.getElementById('lf-list');
  if(!data?.length){el.innerHTML='<div class="card"><div class="empty-msg">No items logged yet</div></div>';return;}
  const pending=data.filter(i=>!['returned','disposed'].includes(i.status));
  const resolved=data.filter(i=>['returned','disposed'].includes(i.status));
  const render=items=>items.map(i=>`
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:40px;height:40px;border-radius:9px;background:var(--br-l);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="ti ti-search" style="font-size:18px;color:var(--br-d)"></i></div>
      <div style="flex:1"><div style="font-size:14px;font-weight:500">${i.item_description}</div><div style="font-size:12px;color:var(--muted)">${i.properties?.name||''}${i.location_found?' · '+i.location_found:''} · ${fmtDate(i.found_date)}</div></div>
      <span class="bdg ${i.status==='returned'?'bdg-g':'bdg-a'}">${(i.status||'pending').replace('_',' ')}</span>
    </div>`).join('');
  el.innerHTML=`
    ${pending.length?`<div class="card"><div class="card-ttl">Pending (${pending.length})</div>${render(pending)}</div>`:''}
    ${resolved.length?`<div class="card"><div class="card-ttl">Resolved</div>${render(resolved)}</div>`:''}`;
}
window.submitLF=async()=>{
  let photoUrl=null;
  const file=document.getElementById('lf-photo-in').files[0];
  if(file){
    const path=`lf/${Date.now()}_${file.name}`;
    const {error:upErr}=await supabase.storage.from('lost-and-found-photos').upload(path,file);
    if(!upErr){const {data:{publicUrl}}=supabase.storage.from('lost-and-found-photos').getPublicUrl(path);photoUrl=publicUrl;}
  }
  const {error}=await supabase.from('lost_and_found').insert({
    property_id:document.getElementById('lf-prop-sel').value,
    found_date:document.getElementById('lf-date').value,
    found_time:document.getElementById('lf-time').value||null,
    location_found:document.getElementById('lf-loc').value||null,
    item_description:document.getElementById('lf-item').value,
    guest_name:document.getElementById('lf-guest').value||null,
    found_by:document.getElementById('lf-staff-sel').value||null,
    photo_url:photoUrl,
    remarks:document.getElementById('lf-remarks').value||null,
  });
  if(error){showToast('Error: '+error.message);return;}
  showToast('Item logged ✓'); toggleForm('lf-form'); loadLostFound();
};

// ---- COMMUNITY ----
async function loadCommunity() {
  const {data}=await supabase.from('community_members').select('*').order('name');
  allCommunity=data||[];
  renderCommunity(allCommunity);
}
function renderCommunity(members) {
  const el=document.getElementById('community-list');
  el.innerHTML=members.length?`<div class="card">${members.map(m=>`
    <div style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--border)">
      <div class="av" style="width:46px;height:46px;font-size:14px">${ini(m.name)}</div>
      <div style="flex:1"><div style="font-size:14px;font-weight:500">${m.name}</div><div style="font-size:12px;color:var(--muted)">${m.talent_name||''}</div>
      <span style="display:inline-block;font-size:11px;padding:2px 8px;background:var(--br-l);color:var(--br-d);border-radius:999px;margin-top:4px">${m.category||'Talent'}</span></div>
    </div>`).join('')}</div>` : '<div class="card"><div class="empty-msg">No community members yet</div></div>';
}
window.filterCat=(el,cat)=>{
  document.querySelectorAll('#cat-filter .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  renderCommunity(cat?allCommunity.filter(m=>m.category===cat):allCommunity);
};
window.submitCommunity=async()=>{
  const cat=document.querySelector('#cm-chips .chip.on')?.textContent;
  const {error}=await supabase.from('community_members').insert({
    name:document.getElementById('cm-name').value,
    talent_name:document.getElementById('cm-talent').value,
    category:cat||null,
  });
  if(error){showToast('Error: '+error.message);return;}
  showToast('Added to circle ✓'); toggleForm('cm-form'); loadCommunity();
};

boot();
