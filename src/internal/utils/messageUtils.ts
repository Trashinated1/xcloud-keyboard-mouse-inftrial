import { Message, activateGamepadConfigMsg, disableGamepadMsg } from '../../shared/messages';
import { GamepadConfig } from '../../shared/types';
import { storeActiveGamepadConfig, storeGamepadConfigEnabled } from '../state/chromeStoredData';
import { getAllTabs } from './tabsUtils';

export async function sendMessage(msg: Message) {
  const tabs = await getAllTabs();
  tabs.forEach((tab) => {
    chrome.tabs.sendMessage(tab.id!, msg, () => {
      // Ignore errors here since we blast message to all tabs, some of which may not have listeners
      // https://groups.google.com/a/chromium.org/g/chromium-extensions/c/Y5pYf1iv2k4?pli=1
      // eslint-disable-next-line no-unused-expressions
      chrome.runtime.lastError;
    });
  });
}

export async function setActiveConfig(name: string, gamepadConfig: GamepadConfig) {
  await sendMessage(activateGamepadConfigMsg(name, gamepadConfig));
  await storeActiveGamepadConfig(name);
  return { name, gamepadConfig };
}

export async function disableActiveConfig() {
  await sendMessage(disableGamepadMsg());
  await storeGamepadConfigEnabled(false);
}
