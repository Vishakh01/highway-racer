import { GameSettings, GameState, Particle, SkidMark, VehicleType, WeatherType } from '../types';
import { soundSynth } from './audio';

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Window size
  private width = 1280;
  private height = 720;

  // Game state
  public state: GameState = 'menu';
  public settings: GameSettings;

  // Player Car
  public player = {
    x: 640 - 22,
    y: 520,
    width: 44,
    height: 84,
    speed: 0, // km/h
    maxSpeed: 220,
    nitroMaxSpeed: 270,
    accel: 110,
    decel: 70,
    brakeForce: 230,
    steerAngle: 0,
    steeringSpeed: 290,
    grip: 1,
    health: 100,
    nitroFuel: 100,
    isNitro: false,
    isBraking: false,
    gear: '1'
  };

  // Highway specs
  private roadWidth = 540;
  private laneCount = 4;
  private laneWidth = 135;
  private roadLeft = (1280 - 540) / 2; // 370
  private roadRight = 370 + 540; // 910

  // Camera
  private camX = 0;
  private camY = 0;
  private targetCamX = 0;
  private shakeIntensity = 0;
  private shakeOffsetX = 0;
  private shakeOffsetY = 0;

  // Entities
  private traffic: Array<{
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    lane: number;
    type: VehicleType;
    speed: number; // km/h
    color: string;
  }> = [];

  private trees: Array<{ x: number; y: number; size: number }> = [];
  private particles: Particle[] = [];
  private skidMarks: SkidMark[] = [];
  private rainDrops: Array<{ x: number; y: number; speed: number; len: number }> = [];

  // Metrics
  public score = 0;
  public distance = 0; // in km
  public highScore = 0;
  public fps = 60;
  public weather: WeatherType = 'sunny';

  // Timers & Controls
  private weatherTimer = 0;
  private trafficSpawnTimer = 0;
  private nextTrafficId = 1;
  private nextParticleId = 1;
  private scrollY = 0;
  private lastTime = performance.now();
  private keys: Record<string, boolean> = {};

  constructor(canvas: HTMLCanvasElement, settings: GameSettings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.settings = settings;

    // Load saved high score
    const saved = localStorage.getItem('highway_racer_highscore');
    if (saved) {
      this.highScore = parseInt(saved, 10) || 0;
    }

    // Initialize trees
    for (let i = 0; i < 20; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = side === -1 ? this.roadLeft - 80 - Math.random() * 200 : this.roadRight + 80 + Math.random() * 200;
      const y = Math.random() * 720;
      this.trees.push({ x, y, size: 28 + Math.random() * 20 });
    }

    // Initialize rain drops
    for (let i = 0; i < 150; i++) {
      this.rainDrops.push({
        x: Math.random() * 1380 - 50,
        y: Math.random() * 720,
        speed: 500 + Math.random() * 300,
        len: 12 + Math.random() * 12
      });
    }

    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'playing') this.state = 'paused';
        else if (this.state === 'paused') this.state = 'playing';
      }
      if (e.code === 'KeyH' && this.state === 'playing') {
        soundSynth.playHorn();
      }
      if (e.code === 'KeyR' && this.state === 'gameover') {
        this.resetGame();
      }
      if (e.code === 'Enter' && this.state === 'menu') {
        this.resetGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  public updateSettings(newSettings: GameSettings) {
    this.settings = newSettings;
    if (newSettings.weatherMode !== 'auto') {
      this.weather = newSettings.weatherMode;
    }
  }

  public resetGame() {
    this.player = {
      x: 640 - 22,
      y: 520,
      width: 44,
      height: 84,
      speed: 0,
      maxSpeed: 220,
      nitroMaxSpeed: 270,
      accel: 110,
      decel: 70,
      brakeForce: 230,
      steerAngle: 0,
      steeringSpeed: 290,
      grip: 1,
      health: 100,
      nitroFuel: 100,
      isNitro: false,
      isBraking: false,
      gear: '1'
    };
    this.traffic = [];
    this.particles = [];
    this.skidMarks = [];
    this.score = 0;
    this.distance = 0;
    this.state = 'playing';
    soundSynth.startEngine();
  }

  public startLoop() {
    const loop = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.fps = Math.round(1 / (dt || 0.016));
      this.lastTime = now;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private update(dt: number) {
    if (this.state !== 'playing') {
      soundSynth.updateEngine(0, 220, false, false);
      return;
    }

    // Dynamic Weather Cycling if set to Auto
    if (this.settings.weatherMode === 'auto') {
      this.weatherTimer += dt;
      if (this.weatherTimer > 30) {
        this.weatherTimer = 0;
        const modes: WeatherType[] = ['sunny', 'rain', 'fog', 'night'];
        const filtered = modes.filter((m) => m !== this.weather);
        this.weather = filtered[Math.floor(Math.random() * filtered.length)];
      }
    } else {
      this.weather = this.settings.weatherMode;
    }

    // Weather impact on car grip
    this.player.grip = this.weather === 'rain' ? 0.65 : 1.0;

    // Controls Handling
    const isUp = this.keys['KeyW'] || this.keys['ArrowUp'];
    const isDown = this.keys['KeyS'] || this.keys['ArrowDown'];
    const isLeft = this.keys['KeyA'] || this.keys['ArrowLeft'];
    const isRight = this.keys['KeyD'] || this.keys['ArrowRight'];
    const isShift = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const isSpace = this.keys['Space'];

    // Nitro
    this.player.isNitro = Boolean(isShift && this.player.nitroFuel > 5 && this.player.speed > 20);
    const targetMaxSpeed = this.player.isNitro ? this.player.nitroMaxSpeed : this.player.maxSpeed;

    if (this.player.isNitro) {
      this.player.nitroFuel = Math.max(0, this.player.nitroFuel - dt * 30);
      this.player.speed = Math.min(targetMaxSpeed, this.player.speed + this.player.accel * 1.8 * dt);
      soundSynth.playNitroWhoosh();
    } else {
      this.player.nitroFuel = Math.min(100, this.player.nitroFuel + dt * 8);
    }

    // Throttle / Brake
    if (isUp) {
      if (this.player.speed < targetMaxSpeed) {
        this.player.speed += this.player.accel * dt;
      }
    } else if (isDown) {
      this.player.isBraking = true;
      if (this.player.speed > 0) {
        this.player.speed -= this.player.brakeForce * dt;
      } else {
        this.player.speed = Math.max(-35, this.player.speed - this.player.accel * 0.5 * dt);
      }
    } else {
      this.player.isBraking = false;
      if (this.player.speed > 0) {
        this.player.speed = Math.max(0, this.player.speed - this.player.decel * dt);
      } else if (this.player.speed < 0) {
        this.player.speed = Math.min(0, this.player.speed + this.player.decel * dt);
      }
    }

    // Gears
    if (this.player.speed < 0) this.player.gear = 'R';
    else if (this.player.isNitro) this.player.gear = 'NTR';
    else if (this.player.speed < 40) this.player.gear = '1';
    else if (this.player.speed < 90) this.player.gear = '2';
    else if (this.player.speed < 140) this.player.gear = '3';
    else if (this.player.speed < 190) this.player.gear = '4';
    else this.player.gear = '5';

    // Steering
    const speedRatio = Math.min(1, Math.abs(this.player.speed) / 50);
    let steerDir = 0;
    if (isLeft) steerDir = -1;
    if (isRight) steerDir = 1;

    const turnMult = isSpace ? 1.6 : 1.0;

    if (steerDir !== 0 && Math.abs(this.player.speed) > 3) {
      this.player.x += steerDir * this.player.steeringSpeed * speedRatio * turnMult * this.player.grip * dt;
      this.player.steerAngle += (steerDir * 14 - this.player.steerAngle) * 0.2;

      // Tire smoke & skid marks on handbrake
      if (isSpace && this.player.speed > 60) {
        this.emitParticles('smoke', this.player.x + 10, this.player.y + 70, 2);
        this.emitParticles('smoke', this.player.x + 34, this.player.y + 70, 2);
      }
    } else {
      this.player.steerAngle *= 0.8;
    }

    // Shoulder boundaries
    if (this.player.x < this.roadLeft + 15) {
      this.player.x = this.roadLeft + 15;
      this.player.speed *= 0.94;
    } else if (this.player.x > this.roadRight - 15 - this.player.width) {
      this.player.x = this.roadRight - 15 - this.player.width;
      this.player.speed *= 0.94;
    }

    // Audio Engine Update
    soundSynth.updateEngine(this.player.speed, this.player.maxSpeed, isUp, this.player.isNitro);

    // Road Scroll & Trees
    const scrollDelta = this.player.speed * 4.5 * dt;
    this.scrollY = (this.scrollY + scrollDelta) % 80;

    for (const tree of this.trees) {
      tree.y += scrollDelta;
      if (tree.y > 750) {
        tree.y = -50;
        const side = Math.random() > 0.5 ? 1 : -1;
        tree.x = side === -1 ? this.roadLeft - 80 - Math.random() * 200 : this.roadRight + 80 + Math.random() * 200;
      }
    }

    // Traffic Spawning
    this.trafficSpawnTimer += dt;
    const spawnThreshold = Math.max(0.5, 1.8 - this.distance * 0.04);
    if (this.trafficSpawnTimer > spawnThreshold && this.traffic.length < 8) {
      this.trafficSpawnTimer = 0;
      const lane = Math.floor(Math.random() * this.laneCount);
      const laneX = this.roadLeft + lane * this.laneWidth + (this.laneWidth - 46) / 2;
      const spawnY = -200;

      // Check overlap
      const hasOverlap = this.traffic.some((t) => t.lane === lane && Math.abs(t.y - spawnY) < 220);
      if (!hasOverlap) {
        const vTypes: VehicleType[] = ['sedan', 'suv', 'truck', 'bus'];
        const vtype = vTypes[Math.floor(Math.random() * vTypes.length)];
        const specs = {
          sedan: { w: 42, h: 78, speed: 90, color: '#3b82f6' },
          suv: { w: 46, h: 86, speed: 80, color: '#10b981' },
          truck: { w: 50, h: 110, speed: 65, color: '#f59e0b' },
          bus: { w: 52, h: 130, speed: 55, color: '#eab308' }
        }[vtype];

        this.traffic.push({
          id: this.nextTrafficId++,
          x: laneX,
          y: spawnY,
          width: specs.w,
          height: specs.h,
          lane,
          type: vtype,
          speed: specs.speed + Math.random() * 20 - 10,
          color: specs.color
        });
      }
    }

    // Traffic Update & Despawn
    for (const t of this.traffic) {
      const relSpeed = (this.player.speed - t.speed) * 3.6;
      t.y += relSpeed * dt;
    }
    this.traffic = this.traffic.filter((t) => t.y < 900);

    // Collisions
    this.checkCollisions();

    // Distance & Score
    if (this.player.speed > 5) {
      const dDist = (this.player.speed / 3600) * dt;
      this.distance += dDist;
      this.score += this.player.speed * 0.1 * (this.player.isNitro ? 2 : 1) * dt;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('highway_racer_highscore', Math.floor(this.highScore).toString());
      }
    }

    // Camera Lag & Shake
    this.targetCamX = (this.player.x - 640) * 0.12;
    this.camX += (this.targetCamX - this.camX) * 0.1;

    if (this.shakeIntensity > 0) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) {
        this.shakeIntensity = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
      }
    }

    // Particles Update
    if (this.player.isNitro) {
      this.emitParticles('flame', this.player.x + 10, this.player.y + 80, 2);
      this.emitParticles('flame', this.player.x + 34, this.player.y + 80, 2);
    }

    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += (p.vy + this.player.speed * 3) * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    // Rain drop update
    if (this.weather === 'rain') {
      for (const drop of this.rainDrops) {
        drop.y += drop.speed * dt;
        drop.x -= 80 * dt;
        if (drop.y > 720) {
          drop.y = -20;
          drop.x = Math.random() * 1380 - 50;
        }
      }
    }
  }

  private checkCollisions() {
    const pRect = {
      x: this.player.x + 4,
      y: this.player.y + 4,
      w: this.player.width - 8,
      h: this.player.height - 8
    };

    for (const t of this.traffic) {
      const tRect = { x: t.x + 3, y: t.y + 3, w: t.width - 6, h: t.height - 6 };
      if (
        pRect.x < tRect.x + tRect.w &&
        pRect.x + pRect.w > tRect.x &&
        pRect.y < tRect.y + tRect.h &&
        pRect.y + pRect.h > tRect.y
      ) {
        // Crash
        this.player.speed *= 0.35;
        this.player.health -= 25;
        this.shakeIntensity = 30;

        soundSynth.playCrash();

        this.emitParticles('spark', (pRect.x + tRect.x) / 2, (pRect.y + tRect.y) / 2, 20);
        this.emitParticles('debris', (pRect.x + tRect.x) / 2, (pRect.y + tRect.y) / 2, 12);

        t.y -= 90;

        if (this.player.health <= 0) {
          this.state = 'gameover';
          soundSynth.stopEngine();
        }
      }
    }
  }

  private emitParticles(type: Particle['type'], x: number, y: number, count: number) {
    for (let i = 0; i < count; i++) {
      let vx = (Math.random() - 0.5) * 60;
      let vy = Math.random() * 80 + 40;
      let size = Math.random() * 5 + 3;
      let life = Math.random() * 0.4 + 0.2;
      let color = '#9ca3af';

      if (type === 'flame') {
        color = Math.random() > 0.5 ? '#f59e0b' : '#3b82f6';
        size = Math.random() * 7 + 4;
        life = 0.2;
      } else if (type === 'spark') {
        vx = (Math.random() - 0.5) * 300;
        vy = (Math.random() - 0.5) * 300;
        color = '#fbbf24';
        size = 3;
        life = 0.4;
      } else if (type === 'debris') {
        vx = (Math.random() - 0.5) * 200;
        vy = (Math.random() - 0.5) * 200;
        color = '#ef4444';
        size = 6;
        life = 0.8;
      }

      this.particles.push({
        id: this.nextParticleId++,
        x,
        y,
        vx,
        vy,
        life,
        maxLife: life,
        size,
        color,
        type,
        alpha: 1
      });
    }
  }

  private render() {
    const cx = this.camX + this.shakeOffsetX;
    const cy = this.camY + this.shakeOffsetY;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Grass Background
    this.ctx.fillStyle = '#15803d'; // Green grass
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. Highway Surface
    this.ctx.fillStyle = '#27272a'; // Road dark gray
    this.ctx.fillRect(this.roadLeft - cx, 0, this.roadWidth, this.height);

    // Red-White Shoulders
    const shoulderW = 12;
    this.ctx.fillStyle = '#71717a';
    this.ctx.fillRect(this.roadLeft - shoulderW - cx, 0, shoulderW, this.height);
    this.ctx.fillRect(this.roadRight - cx, 0, shoulderW, this.height);

    // Lane Lines (Dashed)
    this.ctx.strokeStyle = '#f4f4f5';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([35, 45]);
    this.ctx.lineDashOffset = -this.scrollY;

    for (let i = 1; i < this.laneCount; i++) {
      const lx = this.roadLeft + i * this.laneWidth - cx;
      this.ctx.beginPath();
      this.ctx.moveTo(lx, -100);
      this.ctx.lineTo(lx, this.height + 100);
      this.ctx.stroke();
    }
    this.ctx.setLineDash([]); // Reset line dash

    // Wet road glossy reflections in rain
    if (this.weather === 'rain') {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      this.ctx.fillRect(this.roadLeft - cx, 0, this.roadWidth, this.height);
    }

    // 3. Roadside Trees
    for (const tree of this.trees) {
      const tx = tree.x - cx;
      const ty = tree.y - cy;
      this.ctx.fillStyle = '#14532d';
      this.ctx.beginPath();
      this.ctx.arc(tx, ty, tree.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 4. Traffic Vehicles
    for (const t of this.traffic) {
      const dx = t.x - cx;
      const dy = t.y - cy;

      // Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(dx + 4, dy + 6, t.width, t.height);

      // Body
      this.ctx.fillStyle = t.color;
      this.ctx.fillRect(dx, dy, t.width, t.height);

      // Windshield
      this.ctx.fillStyle = '#18181b';
      this.ctx.fillRect(dx + 4, dy + 18, t.width - 8, t.height - 36);

      // Tail lights
      this.ctx.fillStyle = '#ef4444';
      this.ctx.fillRect(dx + 4, dy + t.height - 4, 8, 3);
      this.ctx.fillRect(dx + t.width - 12, dy + t.height - 4, 8, 3);
    }

    // 5. Player Car
    const px = this.player.x - cx;
    const py = this.player.y - cy;

    this.ctx.save();
    this.ctx.translate(px + this.player.width / 2, py + this.player.height / 2);
    this.ctx.rotate((this.player.steerAngle * Math.PI) / 180);

    // Car Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.fillRect(-this.player.width / 2 + 3, -this.player.height / 2 + 5, this.player.width, this.player.height);

    // Main Body Color
    this.ctx.fillStyle = this.settings.carColor || '#dc2626';
    this.ctx.fillRect(-this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height);

    // Windshield & Windows
    this.ctx.fillStyle = '#09090b';
    this.ctx.fillRect(-this.player.width / 2 + 4, -this.player.height / 2 + 18, this.player.width - 8, 36);

    // Wheels
    this.ctx.fillStyle = '#27272a';
    this.ctx.fillRect(-this.player.width / 2 - 4, -this.player.height / 2 + 10, 6, 16);
    this.ctx.fillRect(this.player.width / 2 - 2, -this.player.height / 2 + 10, 6, 16);
    this.ctx.fillRect(-this.player.width / 2 - 4, this.player.height / 2 - 26, 6, 16);
    this.ctx.fillRect(this.player.width / 2 - 2, this.player.height / 2 - 26, 6, 16);

    // Headlights
    this.ctx.fillStyle = '#fef08a';
    this.ctx.fillRect(-this.player.width / 2 + 4, -this.player.height / 2, 8, 4);
    this.ctx.fillRect(this.player.width / 2 - 12, -this.player.height / 2, 8, 4);

    // Brake Lights
    this.ctx.fillStyle = this.player.isBraking ? '#ef4444' : '#991b1b';
    this.ctx.fillRect(-this.player.width / 2 + 4, this.player.height / 2 - 4, 8, 4);
    this.ctx.fillRect(this.player.width / 2 - 12, this.player.height / 2 - 4, 8, 4);

    this.ctx.restore();

    // 6. Particles
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x - cx, p.y - cy, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    // 7. Weather Overlays
    if (this.weather === 'rain') {
      this.ctx.strokeStyle = 'rgba(186, 230, 253, 0.6)';
      this.ctx.lineWidth = 1.5;
      for (const drop of this.rainDrops) {
        this.ctx.beginPath();
        this.ctx.moveTo(drop.x, drop.y);
        this.ctx.lineTo(drop.x - 4, drop.y + drop.len);
        this.ctx.stroke();
      }
    } else if (this.weather === 'fog') {
      this.ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
      this.ctx.fillRect(0, 0, this.width, this.height);
    } else if (this.weather === 'night') {
      this.ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      // Light Beams Cutout
      const hx = px + this.player.width / 2;
      const hy = py;

      this.ctx.save();
      this.ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
      this.ctx.beginPath();
      this.ctx.moveTo(hx - 15, hy);
      this.ctx.lineTo(hx + 15, hy);
      this.ctx.lineTo(hx + 140, hy - 320);
      this.ctx.lineTo(hx - 140, hy - 320);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    }
  }
}
