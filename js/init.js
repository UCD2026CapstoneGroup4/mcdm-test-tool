// init.js
// App startup and global event listeners
// This runs after all other scripts load (see index.html script order)

/* ── Boot ── */
// Called when the user clicks "Start Analysis" on the landing page
function startApp() {
  document.getElementById('landingPage').style.display='none';
  document.getElementById('appShell').style.display='block';
  document.getElementById('btnSave').style.display='inline-flex';
  document.getElementById('btnLoad').style.display='inline-flex';
  window.scrollTo({top:0,behavior:'auto'});
}

// Home button takes user back to the landing page
document.getElementById('btnHome').addEventListener('click',()=>{
  document.getElementById('landingPage').style.display='';
  document.getElementById('appShell').style.display='none';
  document.getElementById('btnSave').style.display='none';
  document.getElementById('btnLoad').style.display='none';
  window.scrollTo({top:0,behavior:'smooth'});
});

// Toggle the floating How To Use window
document.getElementById('btnGuide').addEventListener('click', () => {
  const m = document.getElementById('guideModal');
  if (m.style.display === 'flex') {
    m.style.display = 'none';
    return;
  }
  m.style.left    = Math.max(0, window.innerWidth - 504) + 'px';
  m.style.top     = '72px';
  m.style.display = 'flex';
});

// Keyboard shortcuts: Escape closes modal, Ctrl+S saves
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){const m=document.getElementById('saveModal');if(m&&m.classList.contains('open'))UI.closeSaveModal();}
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();UI.openSaveModal();}
});

document.querySelectorAll('.sb-step').forEach(el=>{
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});
});

/* ── Global fixed-position tooltip (escapes all overflow clipping) ── */
(function(){
  const box = document.getElementById('tip-box');
  if (!box) return;
  const PAD = 12; // px gap from cursor
  let _hide;

  function show(e) {
    const el = e.target.closest('[data-tip]');
    if (!el) return;
    const tip = el.getAttribute('data-tip');
    if (!tip) return;
    clearTimeout(_hide);
    box.textContent = tip;
    box.style.display = 'block';
    position(e);
  }

  function move(e) {
    if (box.style.display === 'none') return;
    position(e);
  }

  function position(e) {
    const bw = box.offsetWidth, bh = box.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    let x = e.clientX + PAD;
    let y = e.clientY - bh - PAD;
    // Flip right → left if clipping right edge
    if (x + bw > vw - 8) x = e.clientX - bw - PAD;
    // Flip above → below if clipping top edge
    if (y < 8) y = e.clientY + PAD;
    // Keep within bottom
    if (y + bh > vh - 8) y = vh - bh - 8;
    box.style.left = x + 'px';
    box.style.top  = y + 'px';
  }

  function hide() {
    _hide = setTimeout(() => { box.style.display = 'none'; }, 80);
  }

  document.addEventListener('mouseover',  show);
  document.addEventListener('mousemove',  move);
  document.addEventListener('mouseout', e => {
    // Only hide when cursor leaves the data-tip element entirely (not just moving to a child)
    const el = e.target.closest('[data-tip]');
    if (!el) return;
    if (el.contains(e.relatedTarget)) return; // still inside the element
    hide();
  });
  document.addEventListener('click', hide);
})();

// Boot sequence - initialise state, load any saved history, go to step 1
State.ensure();
// Load any auto-saved checkpoints from localStorage
Session.initHistory();
// Start on the setup page
UI.goStep(1);
