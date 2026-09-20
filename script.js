// Jungle Dash - canvas platformer with double-jump, enemies, and nicer visuals
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

let keys = {};
let score = 0;

const player = {
  x: 80,
  y: 300,
  w: 36,
  h: 48,
  vx: 0,
  vy: 0,
  speed: 3.6,
  jumpPower: 11.5,
  onGround: false,
  jumps: 0,
  maxJumps: 2,
};

const gravity = 0.65;

const camera = { x: 0 };

const platforms = [];
const coins = [];
const enemies = [];

function initLevel() {
  platforms.length = 0;
  coins.length = 0;
  enemies.length = 0;
  score = 0;
  player.x = 80; player.y = 300; player.vx = 0; player.vy = 0; player.jumps = 0;

  // ground
  platforms.push({ x: -1000, y: 420, w: 4000, h: 80 });

  // floating platforms
  platforms.push({ x: 320, y: 340, w: 140, h: 16 });
  platforms.push({ x: 520, y: 260, w: 120, h: 16 });
  platforms.push({ x: 760, y: 200, w: 160, h: 16 });
  platforms.push({ x: 1100, y: 300, w: 140, h: 16 });
  platforms.push({ x: 1400, y: 240, w: 160, h: 16 });

  // coins
  coins.push({ x: 360, y: 300, r: 8, taken: false });
  coins.push({ x: 560, y: 220, r: 8, taken: false });
  coins.push({ x: 820, y: 160, r: 8, taken: false });
  coins.push({ x: 1140, y: 260, r: 8, taken: false });
  coins.push({ x: 1440, y: 200, r: 8, taken: false });

  // enemies on some platforms
  for (let i = 1; i < platforms.length; i++) {
    const p = platforms[i];
    // place an enemy in the center
    const ex = p.x + Math.max(20, (p.w - 32) / 2);
    enemies.push({ x: ex, y: p.y - 28, w: 30, h: 24, vx: 1.2, minX: p.x + 8, maxX: p.x + p.w - 8, alive: true });
  }
}

function rectsIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  // input
  player.vx = 0;
  if (keys.ArrowLeft || keys.a) player.vx = -player.speed;
  if (keys.ArrowRight || keys.d) player.vx = player.speed;

  // apply gravity
  player.vy += gravity;

  // horizontal move
  player.x += player.vx;

  // vertical move
  player.y += player.vy;

  // collisions with platforms
  let wasOnGround = player.onGround;
  player.onGround = false;
  for (let p of platforms) {
    if (rectsIntersect(player, p)) {
      // landing on top
      if (player.vy > 0 && player.y + player.h - player.vy <= p.y + 1) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0 && player.y >= p.y + p.h - 1) {
        // hit head
        player.y = p.y + p.h;
        player.vy = 0;
      } else if (player.vx !== 0) {
        // horizontal push
        if (player.vx > 0) player.x = p.x - player.w;
        else player.x = p.x + p.w;
      }
    }
  }

  // reset jumps when landing
  if (!wasOnGround && player.onGround) {
    player.jumps = 0;
  }

  // collect coins
  for (let c of coins) {
    if (!c.taken) {
      const dx = player.x + player.w/2 - c.x;
      const dy = player.y + player.h/2 - c.y;
      if (Math.hypot(dx, dy) < c.r + Math.max(player.w, player.h)/4) {
        c.taken = true;
        score += 10;
        document.getElementById('score').textContent = `Score: ${score}`;
      }
    }
  }

  // update enemies
  for (let e of enemies) {
    if (!e.alive) continue;
    e.x += e.vx;
    if (e.x < e.minX || e.x > e.maxX) e.vx *= -1;

    // collision with player
    if (rectsIntersect(player, e) && e.alive) {
      // player stomps enemy
      if (player.vy > 0 && player.y + player.h - player.vy <= e.y + 8) {
        e.alive = false;
        player.vy = -player.jumpPower * 0.7;
        score += 20;
        document.getElementById('score').textContent = `Score: ${score}`;
      } else {
        endGame();
      }
    }
  }

  // camera follows player
  camera.x = Math.max(0, player.x - 140);

  // fall out
  if (player.y > 1000) {
    endGame();
  }
}

let running = true;
function drawRoundedRect(x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  ctx.clearRect(0,0,W,H);

  // parallax background
  // sky
  const skyGrad = ctx.createLinearGradient(0,0,0,H);
  skyGrad.addColorStop(0, '#7bdff6');
  skyGrad.addColorStop(1, '#88e37b');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0,0,W,H);

  ctx.save();
  ctx.translate(-camera.x * 0.3, 20);
  // distant mountains
  ctx.fillStyle = '#6aa06a';
  ctx.beginPath(); ctx.moveTo(-200,400); ctx.lineTo(200,200); ctx.lineTo(500,400); ctx.fill();
  ctx.beginPath(); ctx.moveTo(400,400); ctx.lineTo(700,220); ctx.lineTo(980,400); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(-camera.x * 0.6, 40);
  // closer tree silhouettes
  ctx.fillStyle = '#2f6b3b';
  for (let i = -2; i < 8; i++) {
    const tx = i * 220;
    ctx.beginPath(); ctx.moveTo(tx+60,380); ctx.lineTo(tx+100,300); ctx.lineTo(tx+140,380); ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(-camera.x, 0);

  // draw platforms with texture
  for (let p of platforms) {
    ctx.fillStyle = '#5b3f22';
    drawRoundedRect(p.x, p.y, p.w, p.h, 6);
    // top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(p.x+6, p.y+2, p.w-12, 4);
  }

  // draw coins
  for (let c of coins) {
    if (c.taken) continue;
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#b88600'; ctx.fillRect(c.x-1, c.y-6, 2, 12);
  }

  // draw enemies
  for (let e of enemies) {
    if (!e.alive) continue;
    ctx.fillStyle = '#c14b4b';
    drawRoundedRect(e.x, e.y, e.w, e.h, 6);
    // eye
    ctx.fillStyle = '#fff'; ctx.fillRect(e.x + e.w - 12, e.y + 6, 6, 6);
  }

  // player shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(player.x + player.w/2, player.y + player.h + 8, player.w/1.2, 6, 0, 0, Math.PI*2); ctx.fill();

  // draw player (rounded body + head)
  ctx.fillStyle = '#2b6ee6';
  drawRoundedRect(player.x, player.y+8, player.w, player.h-8, 6);
  ctx.beginPath(); ctx.arc(player.x + player.w/2 - 4, player.y + 10, 12, 0, Math.PI*2); ctx.fill();
  // eye
  ctx.fillStyle = '#fff'; ctx.fillRect(player.x + player.w - 12, player.y + 12, 6, 6);

  ctx.restore();
}

function loop() {
  if (!running) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

function jump() {
  if (player.jumps < player.maxJumps) {
    player.vy = -player.jumpPower;
    player.jumps += 1;
    player.onGround = false;
  }
}

function endGame() {
  running = false;
  document.getElementById('restart').classList.remove('hidden');
}

function restart() {
  initLevel();
  running = true;
  document.getElementById('score').textContent = `Score: ${score}`;
  document.getElementById('restart').classList.add('hidden');
  requestAnimationFrame(loop);
}

// input
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w')) {
    jump();
  }
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

document.getElementById('restart').addEventListener('click', restart);

// init
initLevel();
document.getElementById('score').textContent = `Score: ${score}`;
requestAnimationFrame(loop);
