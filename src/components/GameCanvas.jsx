import { useEffect, useRef } from 'react';

export default function GameCanvas({ status, onStart, onScore, onGameOver, startKey, restartKey }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const gameRef = useRef({ initialized: false });
  const sizeRef = useRef({ w: 0, h: 0 });
  const inputRef = useRef({ left: false, right: false, touchDir: 0 });

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const ro = new ResizeObserver(() => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { w: Math.floor(rect.width), h: Math.floor(rect.width * 0.56 + 240) };
      canvas.style.width = sizeRef.current.w + 'px';
      const targetH = Math.max(480, sizeRef.current.h);
      canvas.style.height = targetH + 'px';
      canvas.width = Math.floor(sizeRef.current.w * dpr);
      canvas.height = Math.floor(targetH * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawIdle(ctx); // draw something responsive
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  // Input handlers
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') inputRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') inputRef.current.right = true;
      if ((e.key === 'Enter' || e.key === ' ') && status !== 'running') onStart?.();
    };
    const onKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') inputRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') inputRef.current.right = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [status, onStart]);

  // Touch controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleTouchStart = (e) => {
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = t.clientX - rect.left;
      inputRef.current.touchDir = x < rect.width / 2 ? -1 : 1;
      if (status !== 'running') onStart?.();
    };
    const handleTouchMove = (e) => {
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = t.clientX - rect.left;
      inputRef.current.touchDir = x < rect.width / 2 ? -1 : 1;
    };
    const handleTouchEnd = () => {
      inputRef.current.touchDir = 0;
    };
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [status, onStart]);

  // Start or restart signals
  useEffect(() => {
    if (status === 'running') {
      initGame();
      startLoop();
    } else {
      stopLoop();
      if (status === 'idle') {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) drawIdle(ctx);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, startKey, restartKey]);

  function initGame() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width: cw, height: ch } = canvas.getBoundingClientRect();
    const roadW = Math.max(280, Math.min(560, cw * 0.7));
    const laneCount = 3;

    gameRef.current = {
      time: 0,
      score: 0,
      speed: 6, // base downward world speed
      speedMax: 18,
      road: { x: (cw - roadW) / 2, y: 0, w: roadW, h: ch, lanes: laneCount },
      player: {
        w: Math.max(42, roadW * 0.08),
        h: Math.max(70, roadW * 0.14),
        x: cw / 2,
        y: ch - Math.max(70, roadW * 0.14) - 40,
        vx: 0,
        accel: 1.2,
        maxVx: 11,
        color: '#34d399',
        trail: [],
      },
      obstacles: [],
      spawnCooldown: 0,
      bgOffset: 0,
      laneMarkerOffset: 0,
      rngSeed: Math.floor(Math.random() * 1e9),
      gameOver: false,
    };
  }

  function stopLoop() {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  }

  function startLoop() {
    stopLoop();
    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      update();
      render(ctx);
      if (!gameRef.current.gameOver) {
        animRef.current = requestAnimationFrame(loop);
      }
    };
    animRef.current = requestAnimationFrame(loop);
  }

  function rand(seed) {
    // xorshift32
    let x = seed ^ (seed << 13);
    x ^= x >>> 17;
    x ^= x << 5;
    return Math.abs(x);
  }

  function rng() {
    const s = rand(gameRef.current.rngSeed);
    gameRef.current.rngSeed = s;
    return (s % 10000) / 10000;
  }

  function update() {
    const g = gameRef.current;
    const canvas = canvasRef.current;
    if (!g || !canvas) return;
    const { width: cw, height: ch } = canvas.getBoundingClientRect();

    // Increase difficulty
    g.time += 1;
    g.speed = Math.min(g.speedMax, 6 + g.time * 0.003);
    g.score += g.speed * 0.5;
    onScore?.(g.score);

    // Player control
    const dir = (inputRef.current.left ? -1 : 0) + (inputRef.current.right ? 1 : 0) + (inputRef.current.touchDir || 0);
    const p = g.player;
    const road = g.road;

    // update player velocity and position
    p.vx += dir * p.accel;
    p.vx *= 0.9; // friction
    p.vx = Math.max(-p.maxVx, Math.min(p.maxVx, p.vx));
    p.x += p.vx;

    // clamp inside road
    const minX = road.x + 16;
    const maxX = road.x + road.w - 16 - p.w;
    if (p.x < minX) { p.x = minX; p.vx = 0; }
    if (p.x > maxX) { p.x = maxX; p.vx = 0; }

    // update trails
    p.trail.unshift({ x: p.x + p.w / 2, y: p.y + p.h });
    if (p.trail.length > 12) p.trail.pop();

    // Spawn obstacles: same size as player (small variance), different color
    g.spawnCooldown -= 1;
    if (g.spawnCooldown <= 0) {
      const laneW = road.w / road.lanes;
      const laneIndex = Math.floor(rng() * road.lanes);
      const sizeVarW = 0.95 + rng() * 0.1;
      const sizeVarH = 0.95 + rng() * 0.1;
      const carW = p.w * sizeVarW;
      const carH = p.h * sizeVarH;
      const ox = road.x + laneW * laneIndex + (laneW - carW) / 2;
      const speed = g.speed * (1.1 + rng() * 0.8);
      const colorPool = ['#22d3ee', '#a78bfa', '#f472b6', '#f59e0b', '#10b981'];
      const color = colorPool[Math.floor(rng() * colorPool.length)];
      g.obstacles.push({ x: ox, y: -carH - 20, w: carW, h: carH, vy: speed, color, trail: [] });
      g.spawnCooldown = Math.max(15, 60 - Math.floor(g.time * 0.02));
    }

    // Move obstacles
    for (let i = g.obstacles.length - 1; i >= 0; i--) {
      const o = g.obstacles[i];
      o.y += o.vy;
      o.trail.unshift({ x: o.x + o.w / 2, y: o.y + o.h });
      if (o.trail.length > 8) o.trail.pop();
      if (o.y > ch + 100) g.obstacles.splice(i, 1);
    }

    // Collision detection
    for (let i = 0; i < g.obstacles.length; i++) {
      const o = g.obstacles[i];
      if (rectsOverlap(p.x, p.y, p.w, p.h, o.x, o.y, o.w, o.h)) {
        g.gameOver = true;
        stopLoop();
        onGameOver?.(g.score);
        return;
      }
    }

    // background scrolls
    g.bgOffset += g.speed * 0.2;
    g.laneMarkerOffset += g.speed * 1.5;
  }

  function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  function render(ctx) {
    const g = gameRef.current;
    const canvas = canvasRef.current;
    const { width: cw, height: ch } = canvas.getBoundingClientRect();

    // Clear
    ctx.clearRect(0, 0, cw, ch);

    // Night sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, ch);
    sky.addColorStop(0, '#020617');
    sky.addColorStop(0.5, '#0b1020');
    sky.addColorStop(1, '#000');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, ch);

    // City skyline with holographic billboards
    drawCity(ctx, g.bgOffset, cw, ch);

    // Road
    drawRoad(ctx, g.road, g.laneMarkerOffset, cw, ch);

    // Obstacles trails and cars
    for (const o of g.obstacles) {
      drawTrail(ctx, o.trail, o.color, 10, 0.18);
    }
    for (const o of g.obstacles) {
      drawCar(ctx, o.x, o.y, o.w, o.h, o.color);
    }

    // Player trail and car
    drawTrail(ctx, g.player.trail, g.player.color, 14, 0.22);
    drawCar(ctx, g.player.x, g.player.y, g.player.w, g.player.h, g.player.color, true);

    // Start overlay button if idle
    if (status !== 'running') {
      drawStartOverlay(ctx, cw, ch);
    }
  }

  function drawIdle(ctx) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width: cw, height: ch } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, cw, ch);

    const grad = ctx.createLinearGradient(0, 0, 0, ch);
    grad.addColorStop(0, '#030712');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    const roadW = Math.max(280, Math.min(560, cw * 0.7));
    drawRoad(ctx, { x: (cw - roadW) / 2, w: roadW, h: ch, y: 0, lanes: 3 }, 0, cw, ch);

    drawStartOverlay(ctx, cw, ch);
  }

  function drawStartOverlay(ctx, cw, ch) {
    // vignette
    const vg = ctx.createRadialGradient(cw / 2, ch * 0.6, ch * 0.1, cw / 2, ch * 0.6, ch * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, cw, ch);

    // button
    const btnW = 220, btnH = 56;
    const bx = cw / 2 - btnW / 2;
    const by = ch * 0.62 - btnH / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(34,211,238,0.6)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#06b6d4';
    roundRect(ctx, bx, by, btnW, btnH, 14, true, false);
    ctx.restore();

    ctx.font = '600 20px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Start Game', cw / 2, by + btnH / 2 + 7);
  }

  function drawCity(ctx, offset, cw, ch) {
    ctx.save();
    const baseY = ch * 0.42 + (offset % 200) * 0.02;
    // layers
    for (let layer = 0; layer < 3; layer++) {
      const y = baseY + layer * 30;
      const color = ['#0b1224', '#0a0f1f', '#090d19'][layer];
      ctx.fillStyle = color;
      const count = 16 + layer * 8;
      const rngLocal = (i) => Math.sin(i * 1337.7 + offset * 0.001 + layer) * 0.5 + 0.5;
      for (let i = 0; i < count; i++) {
        const w = cw / count * (0.8 + rngLocal(i) * 0.6);
        const x = (i / count) * cw + rngLocal(i + 1) * 6;
        const h = (0.15 + rngLocal(i + 2) * (0.2 + 0.1 * layer)) * ch;
        ctx.fillRect(x, y - h, w, h);
        // windows
        if (layer === 0) {
          for (let r = 0; r < 5; r++) {
            if (rngLocal(i + r * 2) > 0.75) {
              const wx = x + 6 + rngLocal(i + r) * (w - 24);
              const wy = y - h + 10 + r * (h / 6);
              ctx.save();
              ctx.shadowColor = 'rgba(0,255,255,0.35)';
              ctx.shadowBlur = 8;
              ctx.fillStyle = 'rgba(34,211,238,0.8)';
              ctx.fillRect(wx, wy, 12, 6);
              ctx.restore();
            }
          }
        }
      }
    }
    // holographic billboards
    for (let i = 0; i < 4; i++) {
      const x = (i + 1) * (cw / 5) + Math.sin((offset * 0.01 + i) * 0.7) * 20;
      const y = ch * 0.28 + Math.cos((offset * 0.008 + i) * 0.9) * 12;
      ctx.save();
      ctx.shadowColor = 'rgba(168,85,247,0.8)';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = 'rgba(168,85,247,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 40, y - 16, 80, 32);
      ctx.fillStyle = 'rgba(168,85,247,0.14)';
      ctx.fillRect(x - 40, y - 16, 80, 32);
      ctx.restore();
    }

    // reflections on wet road
    const grd = ctx.createLinearGradient(0, ch * 0.45, 0, ch * 0.8);
    grd.addColorStop(0, 'rgba(0,255,255,0.15)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, ch * 0.45, cw, ch * 0.35);

    ctx.restore();
  }

  function drawRoad(ctx, road, laneOffset, cw, ch) {
    // road body
    ctx.save();
    const rx = road.x, rw = road.w;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(rx, 0, rw, ch);

    // glowing edges
    ctx.shadowColor = 'rgba(34,211,238,0.8)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = 'rgba(34,211,238,0.25)';
    ctx.fillRect(rx - 6, 0, 6, ch);
    ctx.fillRect(rx + rw, 0, 6, ch);

    // lane markers
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    const laneW = rw / road.lanes;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    ctx.setLineDash([22, 18]);
    ctx.lineDashOffset = -laneOffset;
    for (let i = 1; i < road.lanes; i++) {
      const x = rx + laneW * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, ch);
      ctx.stroke();
    }

    // neon underglow
    const g = ctx.createLinearGradient(rx, ch * 0.6, rx, ch);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(34,211,238,0.08)');
    ctx.fillStyle = g;
    ctx.fillRect(rx, ch * 0.6, rw, ch * 0.4);

    ctx.restore();
  }

  function drawCar(ctx, x, y, w, h, color, isPlayer = false) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    ctx.fillStyle = color;
    roundRect(ctx, x, y, w, h, 10, true, false);

    // windshield glow
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundRect(ctx, x + 6, y + 10, w - 12, h * 0.28, 8, true, false);

    // light streaks
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x + 4, y + h * 0.65, w - 8, 3);

    // headlights for player
    if (isPlayer) {
      ctx.shadowColor = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(x + 6, y - 10, 10, 8);
      ctx.fillRect(x + w - 16, y - 10, 10, 8);

      // headlight beams
      const grad = ctx.createLinearGradient(x, y - 40, x, y);
      grad.addColorStop(0, 'rgba(255,255,255,0.0)');
      grad.addColorStop(1, 'rgba(255,255,255,0.25)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - 4, y - 40, w + 8, 40);
    }

    ctx.restore();
  }

  function drawTrail(ctx, trail, color, maxLen, alpha) {
    for (let i = 0; i < Math.min(maxLen, trail.length - 1); i++) {
      const a = i / maxLen;
      const p0 = trail[i];
      const p1 = trail[i + 1];
      if (!p0 || !p1) continue;
      const width = Math.max(2, 14 - i);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha * (1 - a);
      ctx.lineWidth = width;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // Click to start if user taps on canvas button region
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e) => {
      if (status === 'running') return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const btnW = 220, btnH = 56;
      const bx = rect.width / 2 - btnW / 2;
      const by = rect.height * 0.62 - btnH / 2;
      if (x >= bx && x <= bx + btnW && y >= by && y <= by + btnH) {
        onStart?.();
      }
    };
    canvas.addEventListener('mousedown', handler);
    return () => canvas.removeEventListener('mousedown', handler);
  }, [status, onStart]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full h-[60vh] md:h-[70vh] block" />
      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3 text-xs text-white/60 select-none">
        <span className="hidden sm:inline">Controls:</span>
        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">←</span>
        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">→</span>
        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">or Touch</span>
      </div>
    </div>
  );
}
