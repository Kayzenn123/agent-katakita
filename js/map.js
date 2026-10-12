/* Peta pixel Nusantara: render prosedural + kamera drag/zoom + pin kata. */
const KatakitaMap = (() => {
  const W = 1100, H = 700, CELL = 10;
  // Poligon pulau (koordinat 0..1) — bergaya, bukan akurat
  const circle = (cx, cy, r) => Array.from({length: 8}, (_, i) => {
    const a = i / 8 * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.8];
  });
  const ISLANDS = [
    [[0.06,0.30],[0.12,0.27],[0.19,0.37],[0.25,0.50],[0.245,0.60],[0.19,0.585],[0.11,0.45],[0.055,0.37]], // Sumatra
    [[0.28,0.675],[0.38,0.66],[0.52,0.675],[0.545,0.715],[0.42,0.73],[0.28,0.72]],                       // Jawa
    [[0.38,0.33],[0.48,0.31],[0.565,0.37],[0.555,0.49],[0.47,0.55],[0.385,0.49],[0.36,0.40]],            // Kalimantan
    [[0.60,0.355],[0.665,0.375],[0.645,0.44],[0.685,0.51],[0.655,0.565],[0.605,0.50],[0.585,0.43]],       // Sulawesi
    [[0.775,0.555],[0.90,0.535],[0.985,0.59],[0.965,0.66],[0.85,0.685],[0.775,0.63]],                    // Papua
    [[0.532,0.722],[0.562,0.722],[0.562,0.748],[0.532,0.748]],                                          // Bali
    [[0.468,0.662],[0.508,0.657],[0.514,0.682],[0.474,0.688]],                                          // Madura
    [[0.628,0.748],[0.662,0.748],[0.662,0.766],[0.628,0.766]],                                          // Timor
    circle(0.70,0.50,0.014), circle(0.735,0.55,0.011), circle(0.685,0.585,0.010),                        // Maluku
    circle(0.585,0.745,0.009), circle(0.61,0.748,0.008),                                               // Nusa kecil
  ];
  const inPoly = (x, y, p) => {
    let c = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++)
      if (((p[i][1] > y) !== (p[j][1] > y)) && (x < (p[j][0]-p[i][0])*(y-p[i][1])/(p[j][1]-p[i][1]) + p[i][0])) c = !c;
    return c;
  };
  const isLand = (x, y) => ISLANDS.some(p => inPoly(x, y, p));

  let canvas, ctx, wrap, land, landWave, onPinOpen = () => {}, reduced = false, lite = false;
  const cam = { cx: W/2, cy: H/2, z: 1, uz: 1 }; // uz = zoom user, z total = z*uz via setZoom
  let pins = [], found = new Set(), hoverPin = -1, frame = 0, lastT = 0;
  let dragging = false, moved = 0, lastP = null, pinchD = 0;

  function buildLand() {
    land = document.createElement('canvas'); land.width = W; land.height = H;
    const g = land.getContext('2d');
    // laut
    g.fillStyle = '#7fa8a0'; g.fillRect(0, 0, W, H);
    // variasi laut pixel
    let s = 12345; const rnd = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL);
    const grid = [];
    for (let j = 0; j < rows; j++) { grid[j] = [];
      for (let i = 0; i < cols; i++) {
        grid[j][i] = isLand((i+0.5)/cols, (j+0.5)/rows);
        if (rnd() < 0.10) { g.fillStyle = '#74a098'; g.fillRect(i*CELL, j*CELL, CELL, CELL); }
      }
    }
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        if (!grid[j][i]) continue;
        const edge = !grid[j][i-1] || !grid[j][i+1] || !grid[j-1]?.[i] || !grid[j+1]?.[i];
        const r = rnd();
        g.fillStyle = edge ? '#8a5a2b' : (r < 0.12 ? '#d8b878' : '#e3c184');
        g.fillRect(i*CELL, j*CELL, CELL, CELL);
        if (!edge && r < 0.06) { g.fillStyle = '#6f9a52'; g.fillRect(i*CELL+2, j*CELL+2, CELL-4, CELL-4); } // hutan pixel
      }
    // frame ombak ke-2 (di-bake, bukan digambar per-frame)
    landWave = document.createElement('canvas'); landWave.width = W; landWave.height = H;
    const w2 = landWave.getContext('2d');
    w2.drawImage(land, 0, 0);
    w2.fillStyle = '#8fb8ae';
    for (let y = 14; y < H; y += 56) for (let x = ((y*7)%56); x < W; x += 56) w2.fillRect(x, y, 26, 5);
  }

  function resize() {
    const r = wrap.getBoundingClientRect(), dpr = 1; // pixelated: dpr>1 mubazir
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
  }

  function worldToScreen(wx, wy) {
    const r = canvas.getBoundingClientRect(), z = cam.z * cam.uz;
    return [ (wx - cam.cx) * z + r.width/2, (wy - cam.cy) * z + r.height/2 ];
  }
  function screenToWorld(sx, sy) {
    const r = canvas.getBoundingClientRect(), z = cam.z * cam.uz;
    return [ (sx - r.width/2) / z + cam.cx, (sy - r.height/2) / z + cam.cy ];
  }
  function clampCam() {
    cam.uz = Math.min(4, Math.max(0.7, cam.uz));
    const z = cam.z * cam.uz, r = canvas.getBoundingClientRect();
    cam.cx = Math.min(W - r.width/z/2 + 80, Math.max(r.width/z/2 - 80, cam.cx));
    cam.cy = Math.min(H - r.height/z/2 + 60, Math.max(r.height/z/2 - 60, cam.cy));
  }

  function draw(t) {
    const r = canvas.getBoundingClientRect(), dpr = canvas.width / r.width;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const z = cam.z * cam.uz;
    ctx.fillStyle = '#7fa8a0'; ctx.fillRect(0, 0, r.width, r.height); // laut di luar peta
    ctx.save();
    ctx.translate(r.width/2, r.height/2); ctx.scale(z, z); ctx.translate(-cam.cx, -cam.cy);
    if (land && landWave) {
      const waveFrame = (!reduced && !lite && (frame >> 5) % 2 === 1) ? landWave : land;
      ctx.drawImage(waveFrame, 0, 0);
    }
    // pin
    pins.forEach((p, i) => {
      const pulse = (!reduced && !lite) ? 1 + 0.18 * Math.sin(t/450 + i) : 1;
      const s = 11 * pulse, isF = found.has(p.id);
      ctx.save(); ctx.translate(p.wx, p.wy);
      ctx.fillStyle = '#3a2410';
      ctx.fillRect(-s*0.72, -s*1.5, s*1.44, s*2.4);           // bayangan pixel
      ctx.fillStyle = isF ? '#2f7f7a' : (i === hoverPin ? '#e8641f' : '#f07f2e');
      ctx.beginPath();
      ctx.moveTo(0, -s*1.3); ctx.lineTo(s*0.62, -s*0.35); ctx.lineTo(0, s*0.75); ctx.lineTo(-s*0.62, -s*0.35);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.fillRect(-s*0.16, -s*0.75, s*0.32, s*0.32);          // kilau
      ctx.restore();
    });
    ctx.restore();
    frame++;
  }

  function loop(t) {
    draw(t || 0);
    if (visible) requestAnimationFrame(loop); else rafOn = false;
  }
  let visible = true, rafOn = false;
  function kick() { if (!rafOn) { rafOn = true; requestAnimationFrame(loop); } }

  function pinAt(sx, sy) {
    const [wx, wy] = screenToWorld(sx, sy), z = cam.z * cam.uz;
    let best = -1, bd = 26 / z;
    pins.forEach((p, i) => {
      const d = Math.hypot(p.wx - wx, p.wy - wy);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  function focusPin(i) {
    const p = pins[i]; if (!p) return;
    cam.cx = p.wx; cam.cy = p.wy; cam.uz = Math.max(cam.uz, 1.6); clampCam();
  }

  function bind() {
    const pos = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    canvas.addEventListener('pointerdown', e => {
      canvas.setPointerCapture(e.pointerId);
      dragging = true; moved = 0; lastP = pos(e);
      if (e.isPrimary === false) { pinchD = 0; }
    });
    canvas.addEventListener('pointermove', e => {
      const [x, y] = pos(e);
      if (dragging && lastP) {
        const dx = x - lastP[0], dy = y - lastP[1];
        moved += Math.abs(dx) + Math.abs(dy);
        const z = cam.z * cam.uz;
        cam.cx -= dx / z; cam.cy -= dy / z; clampCam();
        lastP = [x, y];
      } else if (!dragging) {
        const i = pinAt(x, y);
        if (i !== hoverPin) { hoverPin = i; canvas.style.cursor = i >= 0 ? 'pointer' : 'grab'; }
      }
    });
    const up = e => {
      if (dragging && moved < 8) { const [x, y] = pos(e); const i = pinAt(x, y); if (i >= 0) onPinOpen(pins[i].id); }
      dragging = false; lastP = null;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', () => { dragging = false; lastP = null; });
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const [x, y] = pos(e), [wx, wy] = screenToWorld(x, y);
      cam.uz *= e.deltaY < 0 ? 1.12 : 0.89; clampCam();
      const [wx2, wy2] = screenToWorld(x, y);
      cam.cx += wx - wx2; cam.cy += wy - wy2; clampCam();
    }, { passive: false });
    // pinch sederhana
    const touches = new Map();
    canvas.addEventListener('touchstart', e => { for (const t of e.changedTouches) touches.set(t.identifier, [t.clientX, t.clientY]); }, {passive:true});
    canvas.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) touches.set(t.identifier, [t.clientX, t.clientY]);
      if (touches.size === 2) {
        const [a, b] = [...touches.values()];
        const d = Math.hypot(a[0]-b[0], a[1]-b[1]);
        if (pinchD) { cam.uz *= d / pinchD; clampCam(); }
        pinchD = d; e.preventDefault();
      }
    }, { passive: false });
    canvas.addEventListener('touchend', e => { for (const t of e.changedTouches) touches.delete(t.identifier); pinchD = 0; });
    // keyboard
    wrap.addEventListener('keydown', e => {
      const step = 60 / (cam.z * cam.uz);
      if (e.key === 'ArrowLeft') { cam.cx -= step; }
      else if (e.key === 'ArrowRight') { cam.cx += step; }
      else if (e.key === 'ArrowUp') { cam.cy -= step; }
      else if (e.key === 'ArrowDown') { cam.cy += step; }
      else if (e.key === '+' || e.key === '=') { cam.uz *= 1.2; }
      else if (e.key === '-' || e.key === '_') { cam.uz *= 0.83; }
      else if (e.key === '0') { Object.assign(cam, { cx: W/2, cy: H/2, uz: 1 }); }
      else return;
      e.preventDefault(); clampCam();
    });
    document.getElementById('zin').onclick = () => { cam.uz *= 1.25; clampCam(); };
    document.getElementById('zout').onclick = () => { cam.uz *= 0.8; clampCam(); };
    document.getElementById('zreset').onclick = () => { Object.assign(cam, { cx: W/2, cy: H/2, uz: 1 }); clampCam(); };
    let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { resize(); clampCam(); }, 200); });
    document.addEventListener('visibilitychange', () => { /* loop tetap ringan; draw murah */ });
  }

  function init(opts) {
    canvas = document.getElementById('map'); ctx = canvas.getContext('2d');
    wrap = document.getElementById('mapWrap');
    onPinOpen = opts.onPinOpen; reduced = !!opts.reduced; lite = !!opts.lite;
    pins = WORDS.map(w => ({ id: w.id, wx: w.px * W, wy: w.py * H }));
    // tunda kerja berat sampai browser idle agar FCP/TBT tidak kena
    const start = () => { buildLand(); clampCam(); kick(); };
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 });
    else setTimeout(start, 50);
    resize(); clampCam(); bind();
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting && !document.hidden;
      if (visible) kick();
    }).observe(wrap);
    document.addEventListener('visibilitychange', () => {
      visible = !document.hidden && wrap.getBoundingClientRect().bottom > 0;
      if (visible) kick();
    });
  }

  return {
    init,
    setFound(ids) { found = new Set(ids); },
    markFound(id) { found.add(id); },
    focusPin,
    pinIndex(id) { return pins.findIndex(p => p.id === id); },
    pinScreen(i) { const p = pins[i]; return p ? worldToScreen(p.wx, p.wy) : null; },
    pinCount: () => pins.length,
    setScrollZoom(z) { cam.z = z; clampCam(); },
    setReduced(v) { reduced = v; },
    setLite(v) { lite = v; },
  };
})();
