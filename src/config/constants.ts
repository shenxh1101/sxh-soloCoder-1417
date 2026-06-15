export const BUILDING_CONFIG = {
  NUM_FLOORS: 6,
  FLOOR_HEIGHT: 1.5,
  BUILDING_WIDTH: 10,
  BUILDING_DEPTH: 6,
  WALL_THICKNESS: 0.2,
} as const;

export const ELEVATOR_CONFIG = {
  WIDTH: 1.8,
  HEIGHT: 2.2,
  DEPTH: 1.5,
  WALL_THICKNESS: 0.1,
  SPEED: 2.0,
  DOOR_SPEED: 1.5,
  DOOR_OPEN_TIME: 2000,
  NUM_ELEVATORS: 2,
  MAX_CAPACITY: 800,
  SHAFT_SPACING: 2.5,
} as const;

export const PASSENGER_CONFIG = {
  MIN_WEIGHT: 50,
  MAX_WEIGHT: 100,
  LOW_INTENSITY_INTERVAL: [8000, 15000],
  MEDIUM_INTENSITY_INTERVAL: [4000, 8000],
  HIGH_INTENSITY_INTERVAL: [1500, 4000],
} as const;

export const COLORS = {
  BACKGROUND: '#0a1628',
  PRIMARY: '#00d4ff',
  SECONDARY: '#00ff88',
  WARNING: '#ff6b35',
  DANGER: '#ff3366',
  WALL: '#1a2a4a',
  WALL_LIGHT: '#2a3a5a',
  ELEVATOR_A: '#00d4ff',
  ELEVATOR_B: '#ff6b35',
  DOOR: '#3a4a6a',
  GLASS: 'rgba(100, 200, 255, 0.15)',
  LIGHT_ON: '#ffff88',
  LIGHT_OFF: '#333344',
} as const;

export const STRATEGY_LABELS: Record<string, string> = {
  nearest: '就近响应',
  balanced: '均衡负载',
  peak: '高峰期模式',
} as const;

export const INTENSITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
} as const;

export const ELEVATOR_STATE_LABELS: Record<string, string> = {
  idle: '待机',
  moving: '运行',
  opening: '开门中',
  open: '开门',
  closing: '关门中',
} as const;

export const ELEVATOR_DIRECTION_LABELS: Record<string, string> = {
  up: '上行',
  down: '下行',
  idle: '停止',
} as const;
