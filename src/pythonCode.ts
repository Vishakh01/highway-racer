export const PYTHON_SOURCE_CODE = `"""
===============================================================================
HIGHWAY RACER - Single-File Realistic Python Car Racing Game
===============================================================================
Author: Senior Python Game Developer
Target Platform: Python 3.12+ with Pygame 2.5+
Resolution: 1280 x 720 @ 60 FPS
Architecture: Clean Object-Oriented Programming (OOP)

How to Run:
  1. Install Pygame: pip install pygame
  2. Run the game:   python main.py

Controls:
  - W / UP Arrow       : Accelerate
  - S / DOWN Arrow     : Brake / Reverse
  - A / LEFT Arrow     : Turn Left
  - D / RIGHT Arrow    : Turn Right
  - L-SHIFT            : Nitro Boost (Supercharged Acceleration)
  - SPACE              : Handbrake (Drift Control)
  - H                  : Horn
  - ESC / P            : Pause Game
  - R                  : Restart Game (when Game Over)
  - C                  : Change Camera Perspective / Weather Toggle (In Menu)
===============================================================================
"""

import sys
import os
import math
import random
import json
import time
import pygame
from pygame.locals import *

# =============================================================================
# CONSTANTS & CONFIGURATION
# =============================================================================
SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
TARGET_FPS = 60

# Colors (RGB)
COLOR_ROAD = (40, 44, 52)
COLOR_GRASS = (34, 139, 34)
COLOR_SHOULDER = (100, 100, 100)
COLOR_LANE_MARK = (240, 240, 240)
COLOR_WHITE = (255, 255, 255)
COLOR_BLACK = (0, 0, 0)
COLOR_RED = (235, 50, 50)
COLOR_YELLOW = (255, 200, 0)
COLOR_CYAN = (0, 230, 255)
COLOR_ORANGE = (255, 140, 0)
COLOR_NIGHT_OVERLAY = (10, 15, 30)

# Highway Configuration
ROAD_WIDTH = 540
LANE_COUNT = 4
LANE_WIDTH = ROAD_WIDTH // LANE_COUNT
ROAD_LEFT = (SCREEN_WIDTH - ROAD_WIDTH) // 2
ROAD_RIGHT = ROAD_LEFT + ROAD_WIDTH

# High Score File
HIGH_SCORE_FILE = "highscore.json"

# =============================================================================
# CLASS: Camera
# =============================================================================
class Camera:
    """Manages smooth camera follow, camera lag, collision shake, and dynamic zoom."""
    def __init__(self):
        self.x = 0.0
        self.y = 0.0
        self.target_x = 0.0
        self.target_y = 0.0
        self.shake_intensity = 0.0
        self.shake_offset_x = 0.0
        self.shake_offset_y = 0.0
        self.zoom = 1.0

    def update(self, player_x, player_speed, dt):
        # Smooth camera tracking with slight inertia / lag
        self.target_x = (player_x - SCREEN_WIDTH / 2) * 0.15
        self.x += (self.target_x - self.x) * 0.1

        # Dynamic zoom effect based on speed
        speed_ratio = player_speed / 240.0
        target_zoom = 1.0 - (speed_ratio * 0.05)
        self.zoom += (target_zoom - self.zoom) * 0.05

        # Handle camera shake decaying over time
        if self.shake_intensity > 0:
            self.shake_offset_x = random.uniform(-self.shake_intensity, self.shake_intensity)
            self.shake_offset_y = random.uniform(-self.shake_intensity, self.shake_intensity)
            self.shake_intensity *= 0.88
            if self.shake_intensity < 0.2:
                self.shake_intensity = 0.0
                self.shake_offset_x = 0.0
                self.shake_offset_y = 0.0

    def add_shake(self, amount):
        self.shake_intensity = min(35.0, self.shake_intensity + amount)


# =============================================================================
# CLASS: ParticleSystem
# =============================================================================
class Particle:
    """Represents an individual visual particle (smoke, spark, flame, rain)."""
    def __init__(self, x, y, vx, vy, color, size, life, particle_type='smoke'):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.color = color
        self.size = size
        self.max_life = life
        self.life = life
        self.type = particle_type

    def update(self, dt, road_speed=0):
        self.x += self.vx * dt
        self.y += (self.vy + road_speed) * dt
        self.life -= dt
        if self.type == 'flame':
            self.size = max(1.0, self.size - dt * 10)
        elif self.type == 'smoke':
            self.size += dt * 4.0

    def draw(self, surface, cam_offset_x, cam_offset_y):
        if self.life <= 0:
            return
        alpha = max(0, min(255, int((self.life / self.max_life) * 255)))
        radius = max(1, int(self.size))
        px = int(self.x - cam_offset_x)
        py = int(self.y - cam_offset_y)

        # Draw circle particle
        p_surf = pygame.Surface((radius * 2, radius * 2), pygame.SRCALPHA)
        c = self.color
        pygame.draw.circle(p_surf, (c[0], c[1], c[2], alpha), (radius, radius), radius)
        surface.blit(p_surf, (px - radius, py - radius))


class ParticleSystem:
    """Manages particle emission, updates, and memory-efficient rendering."""
    def __init__(self):
        self.particles = []

    def emit_smoke(self, x, y, speed_ratio):
        for _ in range(int(2 * speed_ratio)):
            vx = random.uniform(-10, 10)
            vy = random.uniform(20, 60)
            size = random.uniform(3, 7)
            life = random.uniform(0.3, 0.6)
            self.particles.append(Particle(x, y, vx, vy, (180, 180, 180), size, life, 'smoke'))

    def emit_flame(self, x, y):
        for _ in range(3):
            vx = random.uniform(-8, 8)
            vy = random.uniform(80, 150)
            size = random.uniform(4, 9)
            life = random.uniform(0.15, 0.3)
            color = random.choice([(255, 200, 0), (255, 100, 0), (0, 200, 255)])
            self.particles.append(Particle(x, y, vx, vy, color, size, life, 'flame'))

    def emit_sparks(self, x, y, count=15):
        for _ in range(count):
            angle = random.uniform(0, math.pi * 2)
            speed = random.uniform(50, 250)
            vx = math.cos(angle) * speed
            vy = math.sin(angle) * speed
            size = random.uniform(2, 4)
            life = random.uniform(0.2, 0.5)
            self.particles.append(Particle(x, y, vx, vy, (255, 220, 50), size, life, 'spark'))

    def emit_debris(self, x, y, count=20):
        for _ in range(count):
            vx = random.uniform(-150, 150)
            vy = random.uniform(-150, 150)
            size = random.uniform(3, 8)
            life = random.uniform(0.5, 1.2)
            color = random.choice([(80, 80, 80), (200, 50, 50), (220, 220, 220)])
            self.particles.append(Particle(x, y, vx, vy, color, size, life, 'debris'))

    def update(self, dt, road_speed=0):
        for p in self.particles:
            p.update(dt, road_speed)
        self.particles = [p for p in self.particles if p.life > 0]

    def draw(self, surface, cam_x, cam_y):
        for p in self.particles:
            p.draw(surface, cam_x, cam_y)


# =============================================================================
# CLASS: Weather
# =============================================================================
class Weather:
    """Dynamic environmental weather system: Sunny, Rain, Fog, Night."""
    def __init__(self):
        self.current_mode = 'sunny' # 'sunny', 'rain', 'fog', 'night'
        self.rain_drops = []
        self.timer = 0.0
        self.auto_switch = True

        for _ in range(120):
            self.rain_drops.append([
                random.uniform(0, SCREEN_WIDTH),
                random.uniform(0, SCREEN_HEIGHT),
                random.uniform(400, 700), # Speed
                random.uniform(10, 20)    # Length
            ])

    def set_mode(self, mode):
        self.current_mode = mode

    def update(self, dt):
        self.timer += dt
        if self.auto_switch and self.timer > 25.0:
            self.timer = 0.0
            modes = ['sunny', 'rain', 'fog', 'night']
            modes.remove(self.current_mode)
            self.current_mode = random.choice(modes)

        if self.current_mode == 'rain':
            for drop in self.rain_drops:
                drop[1] += drop[2] * dt
                drop[0] -= 100 * dt
                if drop[1] > SCREEN_HEIGHT:
                    drop[1] = random.uniform(-50, -10)
                    drop[0] = random.uniform(0, SCREEN_WIDTH + 100)

    def draw_effects(self, surface, player_car, cam_x, cam_y):
        if self.current_mode == 'rain':
            for rx, ry, speed, length in self.rain_drops:
                pygame.draw.line(surface, (180, 210, 255, 160), (rx, ry), (rx - 3, ry + length), 1)

        elif self.current_mode == 'fog':
            fog_surf = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            fog_surf.fill((200, 215, 225, 90))
            surface.blit(fog_surf, (0, 0))

        elif self.current_mode == 'night':
            # Create dark ambient night overlay with headlight cutouts
            dark_mask = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            dark_mask.fill((10, 12, 28, 220))

            # Headlights beam cutout
            hl_x = player_car.x - cam_x
            hl_y = player_car.y - cam_y - 30

            headlight_poly = [
                (hl_x - 15, hl_y),
                (hl_x + 15, hl_y),
                (hl_x + 120, hl_y - 320),
                (hl_x - 120, hl_y - 320)
            ]
            
            # Car headlights glow
            pygame.draw.polygon(dark_mask, (255, 255, 200, 0), headlight_poly)
            pygame.draw.circle(dark_mask, (255, 255, 220, 0), (int(hl_x - 12), int(hl_y)), 25)
            pygame.draw.circle(dark_mask, (255, 255, 220, 0), (int(hl_x + 12), int(hl_y)), 25)

            surface.blit(dark_mask, (0, 0))


# =============================================================================
# CLASS: PlayerCar
# =============================================================================
class PlayerCar:
    """Player Sports Car with arcade/realistic driving dynamics."""
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 44
        self.height = 84
        self.speed = 0.0          # in km/h
        self.max_speed = 220.0    # Normal top speed km/h
        self.nitro_max_speed = 270.0
        self.accel = 120.0        # Acceleration rate
        self.decel = 80.0         # Friction / engine braking
        self.brake_force = 240.0
        self.steer_angle = 0.0    # Visual roll tilt
        self.steering_speed = 280.0
        self.grip = 1.0
        self.health = 100.0
        self.nitro_fuel = 100.0   # 0 to 100
        self.is_nitro = False
        self.is_braking = False
        self.drift_factor = 0.0

    def update(self, dt, keys, weather_mode):
        # Weather impact on grip
        self.grip = 0.65 if weather_mode == 'rain' else 1.0

        # Nitro handling
        self.is_nitro = keys[K_LSHIFT] and self.nitro_fuel > 5 and self.speed > 30
        current_max = self.nitro_max_speed if self.is_nitro else self.max_speed

        if self.is_nitro:
            self.nitro_fuel = max(0.0, self.nitro_fuel - dt * 35.0)
            self.speed = min(current_max, self.speed + self.accel * 1.8 * dt)
        else:
            self.nitro_fuel = min(100.0, self.nitro_fuel + dt * 10.0) # Regenerate nitro

        # Throttle / Brake
        if keys[K_w] or keys[K_UP]:
            if self.speed < current_max:
                self.speed += self.accel * dt
        elif keys[K_s] or keys[K_DOWN]:
            self.is_braking = True
            if self.speed > 0:
                self.speed -= self.brake_force * dt
            else:
                self.speed -= self.accel * 0.5 * dt # Reverse
                self.speed = max(-40.0, self.speed)
        else:
            self.is_braking = False
            # Engine braking / rolling friction
            if self.speed > 0:
                self.speed = max(0.0, self.speed - self.decel * dt)
            elif self.speed < 0:
                self.speed = min(0.0, self.speed + self.decel * dt)

        # Steering (sensitivity decreases naturally at high speeds)
        speed_factor = min(1.0, abs(self.speed) / 60.0)
        steer_dir = 0
        if keys[K_a] or keys[K_LEFT]:
            steer_dir = -1
        elif keys[K_d] or keys[K_RIGHT]:
            steer_dir = 1

        # Handbrake drift
        is_handbrake = keys[K_SPACE]
        turn_mult = 1.5 if is_handbrake else 1.0

        if steer_dir != 0 and abs(self.speed) > 5:
            move_x = steer_dir * self.steering_speed * speed_factor * turn_mult * self.grip * dt
            self.x += move_x
            self.steer_angle += (steer_dir * 12.0 - self.steer_angle) * 0.2
            if is_handbrake and self.speed > 80:
                self.drift_factor = min(1.0, self.drift_factor + dt * 2.0)
        else:
            self.steer_angle *= 0.8
            self.drift_factor *= 0.9

        # Bound player inside highway shoulders
        left_bound = ROAD_LEFT + 15
        right_bound = ROAD_RIGHT - 15 - self.width
        if self.x < left_bound:
            self.x = left_bound
            self.speed *= 0.92
        elif self.x > right_bound:
            self.x = right_bound
            self.speed *= 0.92

    def draw(self, surface, cam_x, cam_y):
        draw_x = self.x - cam_x
        draw_y = self.y - cam_y

        # Car base surface with tilt rotation
        car_surf = pygame.Surface((self.width + 20, self.height + 20), pygame.SRCALPHA)
        cx, cy = (self.width + 20) // 2, (self.height + 20) // 2

        # Shadow
        pygame.draw.ellipse(car_surf, (0, 0, 0, 100), (10, 15, self.width, self.height))

        # Main Body - Sleek Red Sports Car
        car_rect = pygame.Rect(10, 10, self.width, self.height)
        pygame.draw.rect(car_surf, (220, 30, 30), car_rect, border_radius=8) # Body
        pygame.draw.rect(car_surf, (180, 20, 20), car_rect, width=2, border_radius=8)

        # Roof & Hood lines
        roof_rect = pygame.Rect(14, 28, self.width - 8, 36)
        pygame.draw.rect(car_surf, (30, 35, 45), roof_rect, border_radius=5) # Windshield & Glass
        pygame.draw.rect(car_surf, (200, 20, 20), (18, 34, self.width - 16, 24), border_radius=3)

        # Wheels (4 wheels)
        wheel_w, wheel_h = 7, 16
        pygame.draw.rect(car_surf, (20, 20, 20), (5, 18, wheel_w, wheel_h), border_radius=2)
        pygame.draw.rect(car_surf, (20, 20, 20), (self.width + 8, 18, wheel_w, wheel_h), border_radius=2)
        pygame.draw.rect(car_surf, (20, 20, 20), (5, self.height - 10, wheel_w, wheel_h), border_radius=2)
        pygame.draw.rect(car_surf, (20, 20, 20), (self.width + 8, self.height - 10, wheel_w, wheel_h), border_radius=2)

        # Headlights (Front top)
        pygame.draw.rect(car_surf, (255, 255, 200), (14, 11, 8, 5), border_radius=1)
        pygame.draw.rect(car_surf, (255, 255, 200), (self.width - 2, 11, 8, 5), border_radius=1)

        # Brake Light glow
        brake_color = (255, 30, 30) if self.is_braking else (180, 0, 0)
        pygame.draw.rect(car_surf, brake_color, (14, self.height + 6, 8, 4))
        pygame.draw.rect(car_surf, brake_color, (self.width - 2, self.height + 6, 8, 4))

        # Rotate surface based on steering tilt
        rotated_surf = pygame.transform.rotate(car_surf, -self.steer_angle)
        new_rect = rotated_surf.get_rect(center=(draw_x + self.width // 2, draw_y + self.height // 2))
        surface.blit(rotated_surf, new_rect.topleft)

    def get_bbox(self):
        return pygame.Rect(self.x + 4, self.y + 4, self.width - 8, self.height - 8)


# =============================================================================
# CLASS: TrafficCar
# =============================================================================
class TrafficCar:
    """AI Traffic Vehicle (Sedan, SUV, Truck, Bus) operating in lanes."""
    TYPES = {
        'sedan': {'w': 42, 'h': 78, 'speed': 90, 'color': (50, 120, 220)},
        'suv':   {'w': 46, 'h': 86, 'speed': 80, 'color': (60, 170, 90)},
        'truck': {'w': 50, 'h': 110, 'speed': 65, 'color': (220, 140, 30)},
        'bus':   {'w': 52, 'h': 130, 'speed': 55, 'color': (200, 180, 40)}
    }

    def __init__(self, lane_idx, y, vtype=None):
        self.lane = lane_idx
        self.type = vtype if vtype else random.choice(['sedan', 'suv', 'truck', 'bus'])
        data = self.TYPES[self.type]
        self.width = data['w']
        self.height = data['h']
        self.base_speed = data['speed'] + random.uniform(-10, 15)
        self.color = data['color']

        # Center car in selected lane
        lane_x = ROAD_LEFT + lane_idx * LANE_WIDTH
        self.x = lane_x + (LANE_WIDTH - self.width) // 2
        self.y = y

    def update(self, dt, player_speed_kmh):
        # Relative motion compared to player road speed
        relative_speed_px = (player_speed_kmh - self.base_speed) * 3.5
        self.y += relative_speed_px * dt

    def draw(self, surface, cam_x, cam_y):
        dx = self.x - cam_x
        dy = self.y - cam_y

        if dy < -200 or dy > SCREEN_HEIGHT + 200:
            return

        # Shadow
        pygame.draw.rect(surface, (0, 0, 0, 90), (dx + 3, dy + 5, self.width, self.height), border_radius=6)

        # Vehicle Body
        pygame.draw.rect(surface, self.color, (dx, dy, self.width, self.height), border_radius=6)
        pygame.draw.rect(surface, (30, 30, 30), (dx + 4, dy + 18, self.width - 8, self.height - 36), border_radius=4) # Glass

        # Taillights
        pygame.draw.rect(surface, (220, 20, 20), (dx + 4, dy + self.height - 4, 8, 3))
        pygame.draw.rect(surface, (220, 20, 20), (dx + self.width - 12, dy + self.height - 4, 8, 3))

    def get_bbox(self):
        return pygame.Rect(self.x + 3, self.y + 3, self.width - 6, self.height - 6)


# =============================================================================
# CLASS: Road
# =============================================================================
class Road:
    """Endless Highway road generator with lane markings and roadside scenery."""
    def __init__(self):
        self.scroll_y = 0.0
        self.trees = []
        for _ in range(16):
            side = random.choice([-1, 1])
            x = ROAD_LEFT - random.uniform(60, 220) if side == -1 else ROAD_RIGHT + random.uniform(60, 220)
            y = random.uniform(0, SCREEN_HEIGHT)
            self.trees.append({'x': x, 'y': y, 'size': random.uniform(25, 45)})

    def update(self, dt, player_speed_kmh):
        scroll_delta = player_speed_kmh * 4.2 * dt
        self.scroll_y = (self.scroll_y + scroll_delta) % 80

        # Move roadside trees
        for tree in self.trees:
            tree['y'] += scroll_delta
            if tree['y'] > SCREEN_HEIGHT + 50:
                tree['y'] = -50
                side = random.choice([-1, 1])
                tree['x'] = ROAD_LEFT - random.uniform(60, 220) if side == -1 else ROAD_RIGHT + random.uniform(60, 220)

    def draw(self, surface, cam_x, cam_y, weather_mode):
        # Background Grass / Shoulder
        surface.fill(COLOR_GRASS)

        # Highway Asphalt Surface
        road_rect = pygame.Rect(ROAD_LEFT - cam_x, 0, ROAD_WIDTH, SCREEN_HEIGHT)
        pygame.draw.rect(surface, COLOR_ROAD, road_rect)

        # Shoulders (Red-White curbing)
        pygame.draw.rect(surface, COLOR_SHOULDER, (ROAD_LEFT - 12 - cam_x, 0, 12, SCREEN_HEIGHT))
        pygame.draw.rect(surface, COLOR_SHOULDER, (ROAD_RIGHT - cam_x, 0, 12, SCREEN_HEIGHT))

        # Animated Lane Markings
        dash_length = 35
        gap_length = 45
        step = dash_length + gap_length

        for lane_i in range(1, LANE_COUNT):
            lx = ROAD_LEFT + lane_i * LANE_WIDTH - cam_x
            y = -step + (self.scroll_y % step)
            while y < SCREEN_HEIGHT + step:
                pygame.draw.line(surface, COLOR_LANE_MARK, (lx, y), (lx, y + dash_length), 4)
                y += step

        # Roadside Trees
        for tree in self.trees:
            tx = tree['x'] - cam_x
            ty = tree['y'] - cam_y
            r = int(tree['size'])
            # Trunk & Foliage
            pygame.draw.circle(surface, (20, 80, 20), (int(tx), int(ty)), r)
            pygame.draw.circle(surface, (30, 110, 30), (int(tx - 3), int(ty - 3)), int(r * 0.75))


# =============================================================================
# CLASS: HUD
# =============================================================================
class HUD:
    """Modern dashboard UI displaying Speedometer, RPM, Health, Score, FPS."""
    def __init__(self):
        self.font_large = pygame.font.SysFont("Helvetica", 36, bold=True)
        self.font_medium = pygame.font.SysFont("Helvetica", 22, bold=True)
        self.font_small = pygame.font.SysFont("Helvetica", 14)

    def draw(self, surface, player, score, distance, fps, high_score, weather_mode):
        # Speedometer Box (Bottom Right)
        speed_box = pygame.Rect(SCREEN_WIDTH - 240, SCREEN_HEIGHT - 140, 220, 120)
        pygame.draw.rect(surface, (15, 20, 30, 220), speed_box, border_radius=12)
        pygame.draw.rect(surface, COLOR_CYAN, speed_box, width=2, border_radius=12)

        # Speed Value
        kmh = max(0, int(player.speed))
        speed_text = self.font_large.render(f"{kmh}", True, COLOR_WHITE)
        unit_text = self.font_small.render("KM/H", True, COLOR_CYAN)
        surface.blit(speed_text, (SCREEN_WIDTH - 220, SCREEN_HEIGHT - 132))
        surface.blit(unit_text, (SCREEN_WIDTH - 120, SCREEN_HEIGHT - 118))

        # Health Bar
        pygame.draw.rect(surface, (50, 50, 50), (SCREEN_WIDTH - 220, SCREEN_HEIGHT - 85, 180, 12), border_radius=6)
        hp_w = max(0, int((player.health / 100.0) * 180))
        hp_color = COLOR_RED if player.health < 30 else COLOR_YELLOW if player.health < 60 else (40, 220, 100)
        pygame.draw.rect(surface, hp_color, (SCREEN_WIDTH - 220, SCREEN_HEIGHT - 85, hp_w, 12), border_radius=6)

        # Nitro Gauge
        pygame.draw.rect(surface, (40, 40, 60), (SCREEN_WIDTH - 220, SCREEN_HEIGHT - 65, 180, 8), border_radius=4)
        nitro_w = max(0, int((player.nitro_fuel / 100.0) * 180))
        pygame.draw.rect(surface, COLOR_CYAN, (SCREEN_WIDTH - 220, SCREEN_HEIGHT - 65, nitro_w, 8), border_radius=4)

        # Score & Distance (Top Left)
        score_box = pygame.Rect(20, 20, 260, 90)
        pygame.draw.rect(surface, (15, 20, 30, 200), score_box, border_radius=10)
        pygame.draw.rect(surface, (100, 110, 130), score_box, width=1, border_radius=10)

        txt_score = self.font_medium.render(f"SCORE: {int(score):,}", True, COLOR_YELLOW)
        txt_dist = self.font_small.render(f"Distance: {distance:.1f} km", True, COLOR_WHITE)
        txt_hi = self.font_small.render(f"BEST: {int(high_score):,}", True, (180, 180, 180))
        surface.blit(txt_score, (32, 28))
        surface.blit(txt_dist, (32, 56))
        surface.blit(txt_hi, (32, 76))

        # Weather & FPS Badge (Top Right)
        info_txt = self.font_small.render(f"FPS: {int(fps)} | Weather: {weather_mode.upper()}", True, COLOR_WHITE)
        surface.blit(info_txt, (SCREEN_WIDTH - 220, 20))


# =============================================================================
# CLASS: Game
# =============================================================================
class Game:
    """Master Game Controller maintaining loop, states, AI, audio, collision."""
    def __init__(self):
        pygame.init()
        pygame.mixer.init()
        pygame.display.set_caption("Highway Racer - Senior Python Game Developer")
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.clock = pygame.time.Clock()

        # Engine Systems
        self.camera = Camera()
        self.road = Road()
        self.weather = Weather()
        self.particles = ParticleSystem()
        self.hud = HUD()

        # Entities
        self.player = PlayerCar(SCREEN_WIDTH // 2 - 22, SCREEN_HEIGHT - 180)
        self.traffic = []

        # Game State Variables
        self.state = 'menu' # 'menu', 'playing', 'paused', 'gameover'
        self.score = 0.0
        self.distance = 0.0
        self.high_score = self.load_high_score()
        self.traffic_spawn_timer = 0.0

    def load_high_score(self):
        if os.path.exists(HIGH_SCORE_FILE):
            try:
                with open(HIGH_SCORE_FILE, 'r') as f:
                    data = json.load(f)
                    return data.get('high_score', 0)
            except Exception:
                return 0
        return 0

    def save_high_score(self):
        if self.score > self.high_score:
            self.high_score = self.score
            try:
                with open(HIGH_SCORE_FILE, 'w') as f:
                    json.dump({'high_score': int(self.high_score)}, f)
            except Exception:
                pass

    def spawn_traffic(self, dt):
        self.traffic_spawn_timer += dt
        spawn_rate = max(0.6, 1.8 - (self.distance * 0.05)) # Increases frequency over time
        
        if self.traffic_spawn_timer >= spawn_rate and len(self.traffic) < 8:
            self.traffic_spawn_timer = 0.0
            lane = random.randint(0, LANE_COUNT - 1)
            spawn_y = -180

            # Prevent lane overlap
            overlap = False
            for t in self.traffic:
                if t.lane == lane and abs(t.y - spawn_y) < 220:
                    overlap = True
                    break

            if not overlap:
                self.traffic.append(TrafficCar(lane, spawn_y))

    def reset_game(self):
        self.player = PlayerCar(SCREEN_WIDTH // 2 - 22, SCREEN_HEIGHT - 180)
        self.traffic.clear()
        self.score = 0.0
        self.distance = 0.0
        self.state = 'playing'

    def handle_collisions(self):
        player_rect = self.player.get_bbox()
        for t in self.traffic:
            if player_rect.colliderect(t.get_bbox()):
                # Collision Impact
                self.player.speed *= 0.3
                self.player.health -= 22
                self.camera.add_shake(25)

                # Emit sparks & debris
                cx = (self.player.x + t.x) / 2
                cy = (self.player.y + t.y) / 2
                self.particles.emit_sparks(cx, cy, count=25)
                self.particles.emit_debris(cx, cy, count=15)

                # Bounce traffic away
                t.y -= 80

                if self.player.health <= 0:
                    self.save_high_score()
                    self.state = 'gameover'

    def run(self):
        while True:
            dt = self.clock.tick(TARGET_FPS) / 1000.0 # Delta time in seconds
            dt = min(dt, 0.05) # Cap delta time to avoid physics tunneling

            # Event Loop
            for event in pygame.event.get():
                if event.type == QUIT:
                    self.save_high_score()
                    pygame.quit()
                    sys.exit()

                if event.type == KEYDOWN:
                    if event.key == K_ESCAPE or event.key == K_p:
                        if self.state == 'playing':
                            self.state = 'paused'
                        elif self.state == 'paused':
                            self.state = 'playing'
                    elif event.key == K_r and self.state == 'gameover':
                        self.reset_game()
                    elif event.key == K_RETURN and self.state == 'menu':
                        self.reset_game()

            keys = pygame.key.get_pressed()

            # State Logic
            if self.state == 'playing':
                # Player & World Update
                self.player.update(dt, keys, self.weather.current_mode)
                self.road.update(dt, self.player.speed)
                self.weather.update(dt)
                self.camera.update(self.player.x, self.player.speed, dt)

                # Traffic AI Update
                self.spawn_traffic(dt)
                for t in self.traffic:
                    t.update(dt, self.player.speed)
                self.traffic = [t for t in self.traffic if t.y < SCREEN_HEIGHT + 300]

                # Collisions
                self.handle_collisions()

                # Score & Distance Accumulation
                if self.player.speed > 5:
                    dist_delta = (self.player.speed / 3600.0) * dt
                    self.distance += dist_delta
                    self.score += (self.player.speed * 0.1) * (2.0 if self.player.is_nitro else 1.0) * dt

                # Particle Emissions (Exhaust, Smoke)
                if self.player.is_nitro:
                    self.particles.emit_flame(self.player.x + 12, self.player.y + self.player.height)
                    self.particles.emit_flame(self.player.x + self.player.width - 12, self.player.y + self.player.height)

                self.particles.update(dt)

            # RENDER SECTION
            cam_x = self.camera.x + self.camera.shake_offset_x
            cam_y = self.camera.y + self.camera.shake_offset_y

            # 1. World & Road
            self.road.draw(self.screen, cam_x, cam_y, self.weather.current_mode)

            # 2. Traffic
            for t in self.traffic:
                t.draw(self.screen, cam_x, cam_y)

            # 3. Player Car
            self.player.draw(self.screen, cam_x, cam_y)

            # 4. Particles
            self.particles.draw(self.screen, cam_x, cam_y)

            # 5. Environmental Lighting (Weather)
            self.weather.draw_effects(self.screen, self.player, cam_x, cam_y)

            # 6. Heads-Up Display
            if self.state in ['playing', 'paused']:
                self.hud.draw(self.screen, self.player, self.score, self.distance, self.clock.get_fps(), self.high_score, self.weather.current_mode)

            # Overlays for Menu / Pause / Gameover
            if self.state == 'menu':
                self.draw_menu_overlay()
            elif self.state == 'paused':
                self.draw_pause_overlay()
            elif self.state == 'gameover':
                self.draw_gameover_overlay()

            pygame.display.flip()

    def draw_menu_overlay(self):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((10, 15, 25, 210))
        self.screen.blit(overlay, (0, 0))

        font_title = pygame.font.SysFont("Helvetica", 64, bold=True)
        font_sub = pygame.font.SysFont("Helvetica", 24)

        t1 = font_title.render("HIGHWAY RACER", True, COLOR_CYAN)
        t2 = font_sub.render("Press [ENTER] to Start Racing", True, COLOR_WHITE)
        t3 = font_sub.render("Controls: W/A/S/D - Drive | SHIFT - Nitro | SPACE - Handbrake", True, (180, 180, 180))

        self.screen.blit(t1, (SCREEN_WIDTH // 2 - t1.get_width() // 2, 220))
        self.screen.blit(t2, (SCREEN_WIDTH // 2 - t2.get_width() // 2, 340))
        self.screen.blit(t3, (SCREEN_WIDTH // 2 - t3.get_width() // 2, 400))

    def draw_pause_overlay(self):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 150))
        self.screen.blit(overlay, (0, 0))

        font = pygame.font.SysFont("Helvetica", 48, bold=True)
        txt = font.render("GAME PAUSED - Press ESC to Resume", True, COLOR_YELLOW)
        self.screen.blit(txt, (SCREEN_WIDTH // 2 - txt.get_width() // 2, SCREEN_HEIGHT // 2 - 30))

    def draw_gameover_overlay(self):
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((30, 0, 0, 200))
        self.screen.blit(overlay, (0, 0))

        font_large = pygame.font.SysFont("Helvetica", 56, bold=True)
        font_sub = pygame.font.SysFont("Helvetica", 24)

        t1 = font_large.render("CRASHED - GAME OVER", True, COLOR_RED)
        t2 = font_sub.render(f"Final Score: {int(self.score):,} | Distance: {self.distance:.1f} km", True, COLOR_WHITE)
        t3 = font_sub.render("Press [R] to Restart", True, COLOR_YELLOW)

        self.screen.blit(t1, (SCREEN_WIDTH // 2 - t1.get_width() // 2, 220))
        self.screen.blit(t2, (SCREEN_WIDTH // 2 - t2.get_width() // 2, 320))
        self.screen.blit(t3, (SCREEN_WIDTH // 2 - t3.get_width() // 2, 380))


# =============================================================================
# MAIN ENTRY POINT
# =============================================================================
if __name__ == "__main__":
    game = Game()
    game.run()
`;
