/* Lapisan gerak A-F: kamera, marquee, teks, input, reveal, confetti. */
const KatakitaMotion = (() => {
  let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lite = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4 ||
             (navigator.connection && navigator.connection.saveData);
  let tweens = [], st = [];
  const fine = matchMedia('(pointer: fine)').matches;

  const MARQ_A = 'JELAJAHI ◆ KUMPULKAN KATA ◆ 11 BAHASA DAERAH ◆ ';
  const MARQ_B = 'MANGAN ◆ DAHAR ◆ NGAJENG ◆ MANRE ◆ PAJOH ◆ TURU ◆ SARÉ ◆ ';
  const MARQ_C = 'KATAKITA ◆ PETA KATA NUSANTARA ◆ ';

  function fillMarquee(band, text) {
    if (band.dataset.filled) return; band.dataset.filled = '1';
    const dia = '<i class="dia" aria-hidden="true"></i>';
    const chunk = text.split('◆').filter(s => s.trim()).map(s => `<span style="display:inline-flex;align-items:center;gap:18px">${s.trim()} ${dia}</span>`).join('');
    band.querySelectorAll('.track span').forEach(sp => sp.innerHTML = chunk.repeat(4));
  }

  function marquee() {
    const bands = [...document.querySelectorAll('.marquee')];
    if (reduced || lite) { document.body.classList.add('lite'); return; } // statis
    document.body.classList.remove('lite');
    // animasi jalan di compositor (CSS); JS hanya mengatur skew via --skew
    const proxy = { skew: 0 };
    let queued = false;
    const applySkew = v => bands.forEach(mq => mq.style.setProperty('--skew', v.toFixed(2) + 'deg'));
    const stw = ScrollTrigger.create({
      onUpdate: self => {
        const v = gsap.utils.clamp(-6, 6, self.getVelocity() / -400);
        if (Math.abs(v) < 0.4 || queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          proxy.skew = v; applySkew(v);
          gsap.to(proxy, { skew: 0, duration: 0.7, overwrite: true, onUpdate: () => applySkew(proxy.skew) });
        });
      }
    });
    st.push(stw);
  }

  function splitTitle() {
    const h = document.getElementById('heroTitle');
    if (h.querySelector('.ch')) return; // sudah di-split
    const txt = h.textContent; h.setAttribute('aria-label', txt); h.textContent = '';
    [...txt].forEach(ch => {
      const s = document.createElement('span');
      s.className = 'ch'; s.textContent = ch; s.setAttribute('aria-hidden', 'true');
      h.appendChild(s);
    });
    if (reduced) return;
    const tw = gsap.from(h.querySelectorAll('.ch'), {
      rotationX: -95, y: 60, opacity: 0, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.055, delay: 0.15
    });
    tweens.push(tw);
  }

  function magnetic() {
    if (!fine || reduced || lite) return;
    document.querySelectorAll('.magnetic').forEach(btn => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.3 }), yTo = gsap.quickTo(btn, 'y', { duration: 0.3 });
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width/2) * 0.3); yTo((e.clientY - r.top - r.height/2) * 0.3);
      });
      btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  function cursor() {
    if (!fine || reduced) return;
    const c = document.getElementById('cursor');
    const xTo = gsap.quickTo(c, 'x', { duration: 0.18 }), yTo = gsap.quickTo(c, 'y', { duration: 0.18 });
    addEventListener('mousemove', e => { xTo(e.clientX); yTo(e.clientY); });
    document.addEventListener('mouseover', e => {
      c.classList.toggle('hot', !!e.target.closest('a,button,input,.card,#map'));
    });
  }

  function curtains() {
    if (reduced) return;
    gsap.utils.toArray('main section').forEach(sec => {
      if (sec.id === 'hero') return;
      const tw = gsap.fromTo(sec,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', ease: 'steps(12)', duration: lite ? 0.25 : 0.7,
          scrollTrigger: { trigger: sec, start: 'top 78%' } });
      tweens.push(tw);
    });
  }

  function mapZoom() {
    const wrap = document.getElementById('mapWrap');
    const s = ScrollTrigger.create({
      trigger: '#peta', start: 'top 70%', end: 'bottom 30%', scrub: 1,
      onUpdate: self => KatakitaMap.setScrollZoom(1 + self.progress * 0.9)
    });
    st.push(s);
    ScrollTrigger.create({ trigger: '#peta', start: 'top 70%', onLeaveBack: () => KatakitaMap.setScrollZoom(1) });
  }

  function confettiBurst() {
    if (reduced || lite) return;
    const c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;z-index:160;pointer-events:none';
    document.body.appendChild(c);
    const g = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    const cols = ['#f07f2e', '#2f7f7a', '#e3c184', '#8a5a2b', '#fff3d6'];
    const ps = Array.from({ length: 90 }, () => ({
      x: innerWidth/2 + (Math.random()-0.5)*200, y: innerHeight*0.4,
      vx: (Math.random()-0.5)*14, vy: -Math.random()*12 - 4,
      s: 6 + Math.random()*8, c: cols[Math.random()*cols.length | 0], r: Math.random()*Math.PI
    }));
    let f = 0;
    (function tick() {
      g.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.r += 0.1;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r);
        g.fillStyle = p.c; g.fillRect(-p.s/2, -p.s/2, p.s, p.s); g.restore();
      });
      if (++f < 90) requestAnimationFrame(tick); else c.remove();
    })();
  }

  function fpsWatchdog() {
    if (reduced || lite) return;
    let frames = 0; const t0 = performance.now();
    (function cnt() {
      frames++;
      if (performance.now() - t0 < 2500) requestAnimationFrame(cnt);
      else if (frames / 2.5 < 40) {
        lite = true; KatakitaMap.setLite(true);
        document.body.classList.add('lite');
        tweens.forEach(t => t.kill());
      }
    })();
  }

  function applyToggle() {
    const b = document.getElementById('motionToggle');
    b.setAttribute('aria-pressed', String(!reduced));
    b.textContent = reduced ? 'Gerak: Mati' : 'Gerak: Nyala';
  }

  function init() {
    gsap.registerPlugin(ScrollTrigger);
    fillMarquee(document.querySelector('.band-a'), MARQ_A);
    fillMarquee(document.querySelector('.band-b'), MARQ_B);
    fillMarquee(document.querySelector('.band-c'), MARQ_C);
    splitTitle(); marquee(); magnetic(); cursor(); curtains(); mapZoom(); fpsWatchdog();
    applyToggle();
    document.getElementById('motionToggle').onclick = () => {
      reduced = !reduced;
      KatakitaMap.setReduced(reduced);
      st.forEach(s => s.kill()); tweens.forEach(t => t.kill());
      ScrollTrigger.getAll().forEach(s => s.kill());
      tweens = []; st = [];
      gsap.set('main section', { clearProps: 'clipPath' });
      gsap.set('#heroTitle .ch', { clearProps: 'all' });
      document.querySelectorAll('.marquee').forEach(m => m.style.removeProperty('--skew'));
      document.body.classList.remove('lite');
      init();
    };
  }

  return { init, confettiBurst, get reduced() { return reduced; }, get lite() { return lite; } };
})();
