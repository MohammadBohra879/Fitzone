const state = {
  user: { name: "Guest", email: "", verified: false, role: "guest", points: 300, favs: [], bookings: [] },
  owner: {
    members: [
      { id: 1, name: "Rahul Sharma", gymId: "g1", plan: "Monthly", status: "Active" },
      { id: 2, name: "Priya Verma", gymId: "g2", plan: "Quarterly", status: "Active" },
      { id: 3, name: "Amit Jain", gymId: "g3", plan: "Trial", status: "Expired" }
    ],
    holidays: [
      { id: 1, gymId: "g1", date: "2025-12-25", reason: "Christmas" }
    ]
  },
  gyms: [
    {
      id: 1,
      name: "PowerHouse Gym",
      area: "Freeganj",
      fees: 999,
      lat: 23.1815, lon: 75.7832,
      trainers: ["Rahul", "Sonia"],
      photos: [
        "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      ],
      members: []
    },
    {
      id: 2,
      name: "Urban Fitness Point",
      area: "Nanakheda",
      fees: 399,
      lat: 23.1738, lon: 75.7765,
      trainers: ["Aman"],
      photos: [
        "https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      ],
      members: []
    },
    {
      id: 3,
      name: "Alpha Fitness Studio",
      area: "Dewas Road",
      fees: 699,
      lat: 23.1960, lon: 75.7812,
      trainers: ["Neha"],
      photos: [
        "https://wallpapercave.com/wp/wp12425070.jpg"
      ],
      members: []
    },
    {
      id: 4,
      name: "Iron Paradise",
      area: "Vasant Vihar",
      fees: 499,
      lat: 23.1772, lon: 75.7876,
      trainers: ["Vikram"],
      photos: [
        "https://m.gettywallpapers.com/wp-content/uploads/2022/07/GYM-Wallpaper-4k.jpg"
      ],
      members: []
    },
    {
      id: 5,
      name: "Muscle Factory",
      area: "Freeganj Tower",
      fees: 899,
      lat: 23.1801, lon: 75.7861,
      trainers: ["Simran", "Deep"],
      photos: [
        "https://w0.peakpx.com/wallpaper/499/867/HD-wallpaper-sports-bodybuilding-tattoo-muscle-gym-bodybuilder-man.jpg"
      ],
      members: []
    }
  ],
  rewards: [
    { id: "r1", title: "Free T-Shirt", cost: 500, stock: 10 },
    { id: "r2", title: "Protein Sample", cost: 300, stock: 15 },
    { id: "r3", title: "One Day Pass", cost: 150, stock: 25 }
  ]
};

// ---------- Helpers ----------
const q = id => document.getElementById(id);
function safeAdd(id, ev, fn){ const el = q(id); if(el) el.addEventListener(ev, fn); }
function escapeHtml(s){ if(!s) return ""; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; const toRad = Math.PI/180;
  const dLat = (lat2-lat1)*toRad; const dLon = (lon2-lon1)*toRad;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*toRad)*Math.cos(lat2*toRad)*Math.sin(dLon/2)**2;
  return 2*R*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ---------- Modal ----------
function openModal(html){
  const content = q("modal-content"), bp = q("modal-bp");
  if(!content||!bp) return console.warn("Modal elements missing");
  content.innerHTML = html; bp.style.display = "flex";
}
function closeModal(){ const bp = q("modal-bp"), content = q("modal-content"); if(!bp) return; bp.style.display = "none"; if(content) content.innerHTML = ""; }
function backdropClick(e){ if(e.target && e.target.id === "modal-bp") closeModal(); }

// ---------- Render Gyms ----------
function renderGyms(list){
  const grid = q("gyms-grid"); if(!grid) return;
  grid.innerHTML = "";
  list.forEach(g=>{
    const card = document.createElement("div"); card.className = "card";
    const photo = encodeURI(g.photos && g.photos[0] ? g.photos[0] : `https://via.placeholder.com/800x500?text=${g.name}`);
    const isFav = (state.user.favs||[]).includes(g.id);
    card.innerHTML = `
      <img src="${photo}" alt="${escapeHtml(g.name)}">
      <h3>${escapeHtml(g.name)}</h3>
      <div class="area">${escapeHtml(g.area)}, Ujjain</div>
      <div class="fee">₹${g.fees}/month ${g.dist? " • " + g.dist.toFixed(1) + " km": ""}</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" data-id="${g.id}">Details</button>
        <button class="ghost" data-book="${g.id}">Book</button>
        <button class="ghost" data-fav="${g.id}">${isFav? '★ Favourite':'☆ Add Fav'}</button>
      </div>
    `;
    card.querySelector("button[data-id]")?.addEventListener("click", ()=>openDetail(g.id));
    card.querySelector("button[data-book]")?.addEventListener("click", ()=>openBooking(g.id));
    card.querySelector("button[data-fav]")?.addEventListener("click", (e)=>{
      toggleFav(Number(e.currentTarget.dataset.fav));
      renderGyms(state.gyms);
    });
    grid.appendChild(card);
  });
}

// ---------- Owner/Admin Panel ----------
function renderOwnerPanel(){
  renderOwnerMembers();
  renderOwnerHolidays();
}

// Members table
function renderOwnerMembers(){
  const block = q("owner-members-block");
  if(!block) return;

  const members = state.owner.members;
  if(!members.length){
    block.innerHTML = `<p class="meta">No members yet. Add a member below.</p>`;
    block.insertAdjacentHTML("beforeend", ownerMemberFormHtml());
    attachOwnerMemberFormEvents();
    return;
  }

  const rowsHtml = members.map(m => {
    const gym = state.gyms.find(g => g.id === m.gymId);
    const gymName = gym ? gym.name : "(Unknown gym)";
    return `
      <tr>
        <td>${escapeHtml(m.name)}</td>
        <td>${escapeHtml(gymName)}</td>
        <td>${escapeHtml(m.plan)}</td>
        <td>${escapeHtml(m.status)}</td>
        <td>
          <button class="ghost" data-remove-member="${m.id}">Remove</button>
        </td>
      </tr>
    `;
  }).join("");

  block.innerHTML = `
    <h3>Members</h3>
    <div class="meta" style="margin-bottom:6px;">
      Manage members for all FitZone partner gyms.
    </div>
    <div class="table-wrapper">
      <table class="simple-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Gym</th>
            <th>Plan</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    ${ownerMemberFormHtml()}
  `;

  // Attach events for remove + add form
  block.querySelectorAll("[data-remove-member]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-remove-member"));
      ownerRemoveMember(id);
    });
  });

  attachOwnerMemberFormEvents();
}

function ownerMemberFormHtml(){
  const gymOptions = state.gyms.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("");
  return `
    <form id="owner-member-form" style="margin-top:10px;display:grid;gap:8px;">
      <div class="meta">Add new member:</div>
      <input id="owner-member-name" class="input" placeholder="Member name" />
      <select id="owner-member-gym" class="input">
        <option value="">Select gym</option>
        ${gymOptions}
      </select>
      <select id="owner-member-plan" class="input">
        <option value="Monthly">Monthly</option>
        <option value="Quarterly">Quarterly</option>
        <option value="Yearly">Yearly</option>
        <option value="Trial">Trial</option>
      </select>
      <select id="owner-member-status" class="input">
        <option value="Active">Active</option>
        <option value="Expired">Expired</option>
        <option value="Frozen">Frozen</option>
      </select>
      <button type="submit" class="btn">Add Member</button>
    </form>
  `;
}

function attachOwnerMemberFormEvents(){
  const form = document.getElementById("owner-member-form");
  if(!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    const nameEl = q("owner-member-name");
    const gymEl = q("owner-member-gym");
    const planEl = q("owner-member-plan");
    const statusEl = q("owner-member-status");

    const name = nameEl ? nameEl.value.trim() : "";
    const gymId = gymEl ? gymEl.value : "";
    const plan = planEl ? planEl.value : "Monthly";
    const status = statusEl ? statusEl.value : "Active";

    if(!name || !gymId){
      alert("Please enter member name and select a gym.");
      return;
    }

    const newMember = {
      id: Date.now(),
      name,
      gymId,
      plan,
      status
    };

    state.owner.members.push(newMember);
    renderOwnerMembers();
  });
}

function ownerRemoveMember(id){
  state.owner.members = state.owner.members.filter(m => m.id !== id);
  renderOwnerMembers();
}

// Holidays list
function renderOwnerHolidays(){
  const block = q("owner-holidays-block");
  if(!block) return;

  const holidays = state.owner.holidays;

  const listHtml = holidays.length ? holidays.map(h => {
    const gym = state.gyms.find(g => g.id === h.gymId);
    const gymName = gym ? gym.name : "(Unknown gym)";
    return `
      <li>
        <strong>${escapeHtml(h.date)}</strong> – ${escapeHtml(gymName)} (${escapeHtml(h.reason)})
      </li>
    `;
  }).join("") : `<li class="meta">No holidays added yet.</li>`;

  const gymOptions = state.gyms.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("");

  block.innerHTML = `
    <h3>Gym Holidays</h3>
    <ul class="meta" style="margin-bottom:8px;">${listHtml}</ul>
    <form id="owner-holiday-form" style="display:grid;gap:8px;">
      <div class="meta">Add holiday:</div>
      <select id="owner-holiday-gym" class="input">
        <option value="">Select gym</option>
        ${gymOptions}
      </select>
      <input id="owner-holiday-date" class="input" type="date" />
      <input id="owner-holiday-reason" class="input" placeholder="Reason (e.g. Maintenance)" />
      <button type="submit" class="btn">Add Holiday</button>
    </form>
  `;

  const form = q("owner-holiday-form");
  if(form){
    form.addEventListener("submit", e => {
      e.preventDefault();
      const gymEl = q("owner-holiday-gym");
      const dateEl = q("owner-holiday-date");
      const reasonEl = q("owner-holiday-reason");

      const gymId = gymEl ? gymEl.value : "";
      const date = dateEl ? dateEl.value : "";
      const reason = reasonEl ? reasonEl.value.trim() : "";

      if(!gymId || !date || !reason){
        alert("Please select a gym, pick a date and enter a reason.");
        return;
      }

      state.owner.holidays.push({
        id: Date.now(),
        gymId,
        date,
        reason
      });

      renderOwnerHolidays();
    });
  }
}
// ---------- Owner Modal open/close ----------
function openOwnerModal(){
  const bp = q("owner-bp");
  if (!bp) return;
  bp.style.display = "flex"; // show overlay
  renderOwnerPanel();        // render members + holidays each time we open
}

function closeOwnerModal(){
  const bp = q("owner-bp");
  if (!bp) return;
  bp.style.display = "none"; // hide overlay
}


// ---------- Search ----------
function doSearch(){
  const qv = q("search") ? q("search").value.trim().toLowerCase() : "";
  const filtered = state.gyms.filter(g=> g.name.toLowerCase().includes(qv) || g.area.toLowerCase().includes(qv));
  renderGyms(filtered);
}

// ---------- GPS Sort ----------
function detectLocation(){
  if(!navigator.geolocation) return alert("Geolocation not supported.");
  openModal(`<div style="padding:12px">Detecting location...<div class="meta">Allow location in browser popup.</div></div>`);
  navigator.geolocation.getCurrentPosition(pos=>{
    closeModal();
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    state.gyms = state.gyms.map(g=> ({...g, dist: haversine(lat,lon,g.lat,g.lon)})).sort((a,b)=>a.dist-b.dist);
    renderGyms(state.gyms);
  }, err=>{
    closeModal();
    alert("Could not get location (permission or error).");
    console.warn(err);
  }, { timeout:10000 });
}

// ---------- Gym Detail ----------
function openDetail(id){
  const g = state.gyms.find(x=>x.id===id); if(!g) return alert("Gym not found");
  const photosHtml = (g.photos||[]).map(p=>`<img src="${escapeHtml(p)}" style="width:100%;border-radius:8px;margin-top:8px">`).join("");
  const trainersHtml = (g.trainers||[]).map(t=>`<div>${escapeHtml(t)}</div>`).join("");
  const favText = (state.user.favs||[]).includes(g.id) ? "Unfavorite" : "Add to favorites";
  openModal(`
    <h2>${escapeHtml(g.name)}</h2>
    ${photosHtml}
    <p><strong>Area:</strong> ${escapeHtml(g.area)}</p>
    <p><strong>Fees:</strong> ₹${g.fees}/month</p>
    <p><strong>Trainers:</strong></p>${trainersHtml}
    <iframe width="100%" height="220" style="border:0;border-radius:8px;margin-top:10px" src="https://maps.google.com/maps?q=${g.lat},${g.lon}&z=15&output=embed"></iframe>
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn" id="detail-book">Book Pass</button>
      <button class="ghost" id="detail-fav">${favText}</button>
      <button class="ghost" onclick="closeModal()">Close</button>
    </div>
  `);
  safeAdd("detail-book","click", ()=>{ closeModal(); openBooking(g.id); });
  safeAdd("detail-fav","click", ()=>{
    toggleFav(g.id); closeModal(); renderGyms(state.gyms);
  });
}

// ---------- Login (demo OTP) ----------
let tempCode = null;
function openLogin(){
  openModal(`
    <h2>Sign In / Register</h2>
    <label>Name</label><input id="login-name" class="input" placeholder="Your name">
    <label>Email</label><input id="login-email" class="input" type="email" placeholder="you@example.com">
    <div style="margin-top:10px;display:flex;gap:8px">
      <button class="btn" id="login-send">Send Code</button>
      <button class="ghost" onclick="closeModal()">Cancel</button>
    </div>
    <div id="login-msg" class="meta"></div>
  `);
  safeAdd("login-send","click", sendVerificationCode);
}
function sendVerificationCode(){
  const name = q("login-name") ? q("login-name").value.trim() : "";
  const email = q("login-email") ? q("login-email").value.trim() : "";
  if(!email || !/^\S+@\S+\.\S+$/.test(email)) return alert("Valid email required");
  const code = String(Math.floor(100000 + Math.random()*900000));
  tempCode = { name, email, code, ts: Date.now() };
  // Demo: show code in modal. Production: send via email backend.
  openModal(`
    <h2>Verification</h2>
    <div class="meta">(Demo) Use this code: <strong>${code}</strong></div>
    <label>Enter code</label><input id="verify-code" class="input" placeholder="6-digit code">
    <div style="margin-top:10px;display:flex;gap:8px"><button class="btn" id="verify-go">Verify</button><button class="ghost" onclick="closeModal()">Cancel</button></div>
  `);
  safeAdd("verify-go","click", verifyCodeHandler);
}
function verifyCodeHandler(){
  const val = q("verify-code") ? q("verify-code").value.trim() : "";
  if(!tempCode) return alert("No code sent");
  if(val === tempCode.code){
    state.user.name = tempCode.name || "User";
    state.user.email = tempCode.email;
    state.user.role = "member";
    state.user.verified = true;
    tempCode = null;
    closeModal();
    alert(`Logged in as ${state.user.name} (${state.user.email})`);
    renderGyms(state.gyms);
  } else alert("Invalid code");
}

// ---------- Favourites ----------
function toggleFav(gymId){
  state.user.favs = state.user.favs||[];
  const idx = state.user.favs.indexOf(gymId);
  if(idx === -1){ state.user.favs.push(gymId); alert("Added to favourites"); }
  else{ state.user.favs.splice(idx,1); alert("Removed from favourites"); }
}

// ---------- Booking ----------
function openBooking(gymId){
  const g = state.gyms.find(x=>x.id===gymId); if(!g) return;
  openModal(`
    <h3>Book One-day Pass — ${escapeHtml(g.name)}</h3>
    <label>Your name</label><input id="bk-name" class="input" value="${escapeHtml(state.user.name)}">
    <label>Phone</label><input id="bk-phone" class="input" placeholder="Phone">
    <label>Date</label><input id="bk-date" type="date" class="input">
    <div style="margin-top:10px;display:flex;gap:8px">
      <button class="btn" id="bk-go">Book</button>
      <button class="ghost" onclick="closeModal()">Cancel</button>
    </div>
  `);
  safeAdd("bk-go","click", ()=>confirmBooking(gymId));
}
function confirmBooking(gymId){
  const name = q("bk-name")?q("bk-name").value.trim():""; const phone = q("bk-phone")?q("bk-phone").value.trim():""; const date = q("bk-date")?q("bk-date").value:"";
  if(!name || !phone || !date) return alert("Please fill all fields");
  const booking = {  gym: state.gyms.find(x=>x.id===gymId).name, name, phone, date };
  state.user.bookings = state.user.bookings||[]; state.user.bookings.push(booking);
  alert("Booking confirmed.");
  console.log("Booking:", booking);
  closeModal();
}


// ---------- Rewards ----------
function openRewards(){
  const html = `<h2>Rewards</h2><div>${state.rewards.map(r=>`<div class="reward-item" style="padding:8px;border-radius:8px;background:rgba(0,0,0,0.03);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(r.title)}</strong><div class="meta">Cost: ${r.cost} pts • Stock: ${r.stock}</div></div><div><button class="btn" data-red="${r.id}">Redeem</button></div></div>`).join("")}</div><div style="margin-top:12px"><button class="ghost" onclick="closeModal()">Close</button></div>`;
  openModal(html);
  const mc = q("modal-content");
  mc && mc.querySelectorAll('button[data-red]').forEach(btn=>btn.addEventListener("click", ()=>redeem(btn.dataset.red)));
}
function redeem(id){
  const r = state.rewards.find(x=>x.id===id); if(!r) return alert("Invalid reward");
  if((state.user.points||0) < r.cost) return alert("Not enough points");
  if(r.stock <= 0) return alert("Out of stock");
  r.stock--; state.user.points = (state.user.points||0) - r.cost;
  alert(`Redeemed: ${r.title}`);
  openRewards();
}

// ---------- Contact Page ----------
function openContact(){ q("contact-page").classList.add("show"); }
function closeContact(){ q("contact-page").classList.remove("show"); }
function initContact(){
  safeAdd("btn-contact","click", openContact);
  safeAdd("contact-close","click", closeContact);
  safeAdd("contact-cancel","click", closeContact);
  safeAdd("contact-send","click", ()=>{
    const name = q("contact-name").value.trim();
    const email = q("contact-email").value.trim();
    if(!email || !/^\S+@\S+\.\S+$/.test(email)) return alert("Valid email required");
    const msg = q("contact-message").value.trim();
    if(!name||!email||!msg) return alert("Fill all fields");
    // demo store in localStorage
    const contacts = JSON.parse(localStorage.getItem("fitzone_contacts_v1")||"[]");
    contacts.push({ id: Date.now(), name, email, msg, ts: new Date().toISOString() });
    localStorage.setItem("fitzone_contacts_v1", JSON.stringify(contacts));
    q("contact-status").textContent = "Message saved (demo). We'll reply in 24h.";
    q("contact-name").value=""; q("contact-email").value=""; q("contact-message").value="";
    setTimeout(()=>{ q("contact-status").textContent=""; closeContact(); }, 1400);
  });
}

// ---------- Public API Demo ----------
async function fetchFitnessTip(){
  const box = q("api-box");
  if (box) {
    box.textContent = "Loading tip...";
  }

  try {
    const res = await fetch("https://dummyjson.com/quotes/random");
    if (!res.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await res.json();
    const post = Array.isArray(data) ? data[0] : data;

    if (box) {
      box.innerHTML = `<strong>Motivation:</strong> ${escapeHtml(post.quote)}`;
    }
  } catch (err) {
    console.error("Error fetching fitness tip:", err);
    if (box) {
      box.textContent = "Could not load tip. Please try again.";
    }
    alert("Sorry, something went wrong while fetching the tip.");
  }
}


// ---------- Dark Mode ----------
function toggleDarkMode(){
  const body = q("body");
  body.classList.toggle("dark");
  q("modeToggle").textContent = body.classList.contains("dark") ? "🌙" : "🌞";
}

// ---------- Boot ----------
function boot(){
  safeAdd("btn-search","click", doSearch);
  safeAdd("btn-location","click", detectLocation);
  safeAdd("btn-login","click", openLogin);
  safeAdd("btn-tip","click", fetchFitnessTip);
  safeAdd("modeToggle","click", toggleDarkMode);
  safeAdd("btn-rewards","click", openRewards);
  safeAdd("btn-clear","click", ()=>{ if(q("search")) q("search").value=""; renderGyms(state.gyms); });

  safeAdd("btn-owner","click", openOwnerModal);
  safeAdd("owner-modal-close","click", closeOwnerModal);

  const ownerBp = q("owner-bp");
  if (ownerBp) {
    ownerBp.addEventListener("click", e => {
      if (e.target.id === "owner-bp") closeOwnerModal();
    });
  }

  const searchEl = q("search");
  if(searchEl) searchEl.addEventListener("keypress", e => { if(e.key==="Enter") doSearch(); });

  const bp = q("modal-bp");
  if(bp) bp.addEventListener("click", backdropClick);

  initContact();
  renderGyms(state.gyms);
}

if(document.readyState==="loading"){ document.addEventListener("DOMContentLoaded", boot); } else { boot(); }

// Expose simple helpers for console
window.renderGyms = renderGyms; window.doSearch = doSearch; window.detectLocation = detectLocation;
window.openBooking = openBooking; window.openLogin = openLogin; window.openRewards = openRewards;
