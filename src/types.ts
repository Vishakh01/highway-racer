export type WeatherType = 'sunny' | 'rain' | 'fog' | 'night';

export type GameState = 'menu' | 'countdown' | 'playing' | 'paused' | 'gameover';

export type VehicleType = 'sedan' | 'suv' | 'truck' | 'bus';

export interface CarStats {
  maxSpeed: number; // in km/h
  acceleration: number;
  braking: number;
  reverseMaxSpeed: number;
  steeringSens: number;
  grip: number;
  driftFactor: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'smoke' | 'spark' | 'debris' | 'flame' | 'rain' | 'skid' | 'dust';
  alpha: number;
}

export interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

export interface GameSettings {
  carColor: string;
  weatherMode: 'auto' | WeatherType;
  difficulty: 'easy' | 'medium' | 'hard';
  soundEnabled: boolean;
  soundVolume: number;
  showFps: boolean;
  cameraZoom: boolean;
}

export interface HighScoreRecord {
  score: number;
  distance: number;
  maxSpeed: number;
  date: string;
}
