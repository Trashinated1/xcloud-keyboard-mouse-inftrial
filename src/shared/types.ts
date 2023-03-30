import { User as ExtpayUser } from 'extpay';

export interface GlobalPrefs {
  showControlsOverlay: boolean;
}

export interface Session {
  startMs: number;
  sessionId: string;
}

export interface ClientIdAndSession {
  clientId: string;
  session: Session;
}

export enum Direction {
  UP = 'u',
  DOWN = 'd',
  LEFT = 'l',
  RIGHT = 'r',
}

export type StickNum = 0 | 1;

export type KeyMap = undefined | string | string[];

export interface ButtonKeyConfig {
  a?: KeyMap;
  b?: KeyMap;
  x?: KeyMap;
  y?: KeyMap;
  leftShoulder?: KeyMap;
  rightShoulder?: KeyMap;
  leftTrigger?: KeyMap;
  rightTrigger?: KeyMap;
  select?: KeyMap;
  start?: KeyMap;
  leftStickPressed?: KeyMap;
  rightStickPressed?: KeyMap;
  dpadUp?: KeyMap;
  dpadDown?: KeyMap;
  dpadLeft?: KeyMap;
  dpadRight?: KeyMap;
  home?: KeyMap;
}

export interface AxesKeyConfig {
  leftStickUp?: KeyMap;
  leftStickDown?: KeyMap;
  leftStickLeft?: KeyMap;
  leftStickRight?: KeyMap;
  rightStickUp?: KeyMap;
  rightStickDown?: KeyMap;
  rightStickLeft?: KeyMap;
  rightStickRight?: KeyMap;
}

export interface GamepadKeyConfig extends ButtonKeyConfig, AxesKeyConfig {}

export interface GamepadMouseConfig {
  mouseControls: StickNum | undefined;
  sensitivity: number;
}

export interface GamepadConfig {
  keyConfig: GamepadKeyConfig;
  mouseConfig: GamepadMouseConfig;
}

export interface Payment {
  paid: ExtpayUser['paid'];
  paidAt: number | null;
  installedAt: number;
  trialStartedAt: number | null;
}

export interface AllMyGamepadConfigs {
  cid: string | undefined;
  isEnabled: boolean;
  payment?: Payment;
  seenOnboarding: boolean;
  activeConfig: string;
  configs: Record<string, GamepadConfig>;
  prefs: GlobalPrefs;
}

// The enum number maps to MouseEvent.button
// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button#value
export enum MouseButtons {
  Click = 0,
  MiddleClick = 1,
  RightClick = 2,
  Aux4Click = 3,
  Aux5Click = 4,
}

export function getAllEnumKeys(someEnum: Record<string | number, any>) {
  // https://www.crojach.com/blog/2019/2/6/getting-enum-keys-in-typescript
  return Object.keys(someEnum).filter((key) => typeof key === 'string');
}
