
const btn = document.getElementById('install');
const progress = document.getElementById('progress');
const statusEl = document.getElementById('status');
const overlay = document.getElementById('gameOverlay');
const frame = document.getElementById('gameFrame');
const back = document.getElementById('back');

function simulateInstall(ms=8000){
  progress.classList.remove('hidden');
  let p = 0;
  const start = performance.now();
  function tick(now){
    const t = now - start;
    p = Math.min(100, Math.floor((t / ms) * 100));
    progress.querySelector('.bar').style.width = p + '%';
    if(p < 10) statusEl.textContent = 'Preparing files…';
    else if(p < 30) statusEl.textContent = 'Copying core assets…';
    else if(p < 60) statusEl.textContent = 'Setting up renderer and audio…';
    else if(p < 90) statusEl.textContent = 'Finalizing install…';
    else statusEl.textContent = 'Done.';
    if(p < 100) requestAnimationFrame(tick); else setTimeout(()=>{
      overlay.classList.remove('hidden');
      frame.src = 'game/index.html';
    }, 250);
  }
  requestAnimationFrame(tick);
}

btn.addEventListener('click', ()=>{
  btn.disabled = true;
  btn.textContent = 'Installing…';
  simulateInstall(7000);
});

back.addEventListener('click', () => {
  frame.src = 'about:blank';
  overlay.classList.add('hidden');
  btn.disabled = false;
  btn.textContent = 'Install & Play';
  progress.classList.add('hidden');
  progress.querySelector('.bar').style.width = '0%';
  statusEl.textContent = 'Preparing…';
});
