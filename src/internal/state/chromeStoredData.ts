import { AllMyGamepadConfigs, GamepadConfig, GlobalPrefs, Payment, Session } from '../../shared/types';
import { defaultGamepadConfig, DEFAULT_CONFIG_NAME, upgradeOldGamepadConfig } from '../../shared/gamepadConfig';
import { defaultPrefs } from '../../shared/defaults';

// Chrome Sync Storage Limits:
// max items = 512
// max writes per second = 2
// max bytes per item = 8.192 KB

enum LocalStorageKeys {
  GAME_NAME = 'GAME_NAME',
  SESSION = 'SESSION',
}

enum SyncStorageKeys {
  CID = 'CID',
  GAMEPAD_CONFIGS = 'GP_CONF',
  ACTIVE_GAMEPAD_CONFIG = 'ACTIVE_GP_CONF',
  ENABLED = 'ENABLED',
  PAYMENT = 'PAYMENT',
  ONBOARDED = 'ONBOARDED',
  GLOBAL_PREFS = 'PREFS',
}

async function syncStorageSet(items: { [key: string]: any }): Promise<void> {
  try {
    await chrome.storage.sync.set(items);
  } catch (e) {
    await chrome.storage.local.set(items);
  }
}

async function syncStorageGet(
  keys?: string | string[] | { [key: string]: any } | null,
): Promise<{ [key: string]: any }> {
  try {
    return await chrome.storage.sync.get(keys);
  } catch (e) {
    return await chrome.storage.local.get(keys);
  }
}

async function syncStorageRemove(keys: string | string[]): Promise<void> {
  try {
    return await chrome.storage.sync.remove(keys);
  } catch (e) {
    return await chrome.storage.local.remove(keys);
  }
}

export function updateGameName(gameName: string | null) {
  return chrome.storage.local.set({ [LocalStorageKeys.GAME_NAME]: gameName });
}

export async function getLocalGameStatus(): Promise<string | null> {
  const data = await chrome.storage.local.get(LocalStorageKeys.GAME_NAME);
  return (data && data[LocalStorageKeys.GAME_NAME]) || null;
}

/**
 * Sets "seen onboarding" to true.
 */
export function storeSeenOnboarding() {
  return syncStorageSet({ [SyncStorageKeys.ONBOARDED]: true });
}

/**
 * Updates a stored gamepad config by name (does not set it as active)
 */
export function storeGamepadConfig(name: string, gamepadConfig: GamepadConfig) {
  return syncStorageSet({ [`${SyncStorageKeys.GAMEPAD_CONFIGS}:${name}`]: gamepadConfig });
}

/**
 * Deletes a stored gamepad config.
 * Be careful not to delete the active config!
 */
export function deleteGamepadConfig(name: string) {
  if (name === DEFAULT_CONFIG_NAME) {
    throw new Error('Cannot delete default config');
  }
  return syncStorageRemove(`${SyncStorageKeys.GAMEPAD_CONFIGS}:${name}`);
}

/**
 * Sets the extension enabled/disabled.
 */
export function storeGamepadConfigEnabled(enabled: boolean) {
  return syncStorageSet({ [SyncStorageKeys.ENABLED]: enabled });
}

/**
 * Updates global preferences.
 */
export function storeGlobalPrefs(prefs: GlobalPrefs) {
  return syncStorageSet({ [SyncStorageKeys.GLOBAL_PREFS]: prefs });
}

/**
 * Sets a gamepad config as active.
 */
export function storeActiveGamepadConfig(name: string) {
  // TODO validate the name exists before setting it active?
  return syncStorageSet({
    [SyncStorageKeys.ENABLED]: true,
    [SyncStorageKeys.ACTIVE_GAMEPAD_CONFIG]: name,
  });
}

/**
 * Stores a new client ID to sync storage.
 */
export function storeClientId(clientId: string) {
  return syncStorageSet({ [SyncStorageKeys.CID]: clientId });
}

/**
 * Stores a new session to local storage.
 */
export function storeSession(session: Session) {
  return chrome.storage.local.set({ [LocalStorageKeys.SESSION]: session });
}

/**
 * Gets client ID from sync storage.
 */
export async function getClientId(): Promise<string | null> {
  const data = await syncStorageGet(SyncStorageKeys.CID);
  return (data && data[SyncStorageKeys.CID]) || null;
}

/**
 * Gets session from local storage.
 */
export async function getSession(): Promise<Session | null> {
  const data = await chrome.storage.local.get(LocalStorageKeys.SESSION);
  return (data && data[LocalStorageKeys.SESSION]) || null;
}

function normalizeGamepadConfigs(data: Record<string, any> = {}): AllMyGamepadConfigs {
  const cid = data[SyncStorageKeys.CID];
  const activeConfig: string = data[SyncStorageKeys.ACTIVE_GAMEPAD_CONFIG] || DEFAULT_CONFIG_NAME;
  const payment: Payment = data[SyncStorageKeys.PAYMENT];
  const prefs: GlobalPrefs = data[SyncStorageKeys.GLOBAL_PREFS] || defaultPrefs;
  const isEnabled: boolean =
    data[SyncStorageKeys.ENABLED] === undefined
      ? !!data[SyncStorageKeys.ACTIVE_GAMEPAD_CONFIG]
      : data[SyncStorageKeys.ENABLED];
  const allKeys = Object.keys(data);
  const configKeys = allKeys.filter((key) => key.startsWith(SyncStorageKeys.GAMEPAD_CONFIGS));
  const seenOnboarding: boolean =
    data[SyncStorageKeys.ONBOARDED] || configKeys.length > 1 || activeConfig !== DEFAULT_CONFIG_NAME;
  const initialConfigsMap: AllMyGamepadConfigs['configs'] = {
    [DEFAULT_CONFIG_NAME]: defaultGamepadConfig,
  };
  return {
    cid,
    isEnabled,
    activeConfig,
    seenOnboarding,
    payment,
    prefs,
    configs: configKeys.reduce((configs, key) => {
      const name = key.split(':')[1];
      const config = data[key];
      upgradeOldGamepadConfig(config);
      configs[name] = config;
      return configs;
    }, initialConfigsMap),
  };
}

export async function getAllStoredSync() {
  const data = await syncStorageGet(null);
  return normalizeGamepadConfigs(data);
}
