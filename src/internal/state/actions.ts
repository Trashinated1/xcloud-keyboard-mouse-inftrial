import { AnyAction, createAction, PayloadAction, ThunkAction } from '@reduxjs/toolkit';
import { DEFAULT_CONFIG_NAME } from '../../shared/gamepadConfig';
import { activateGamepadConfigMsg, updatePrefsMsg } from '../../shared/messages';
import { getPayment } from '../../shared/payments';
import { GamepadConfig, GlobalPrefs, Payment } from '../../shared/types';
import { postGa } from '../utils/ga';
import { disableActiveConfig, sendMessage, setActiveConfig } from '../utils/messageUtils';
import {
  deleteGamepadConfig,
  getAllStoredSync,
  getLocalGameStatus,
  storeGamepadConfig,
  storeGlobalPrefs,
} from './chromeStoredData';
import { getGamepadConfig, getIsAllowed, isConfigActive } from './selectors';
import { createAppAsyncThunk, RootState } from './typed';

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;

export const showUpsellModalAction = createAction<boolean>('upsellModal/show');

export const fetchGameStatusAction = createAppAsyncThunk('meta/gameStatus', getLocalGameStatus);

export const fetchAllAction = createAppAsyncThunk('config/fetchAll', getAllStoredSync);

export const fetchPaymentAction = createAppAsyncThunk('payment/fetch', async (): Promise<Payment> => {
  const user = await getPayment();
  return {
    paid: user.paid,
    paidAt: user.paidAt && user.paidAt.getTime(),
    installedAt: user.installedAt.getTime(),
    trialStartedAt: user.trialStartedAt && user.trialStartedAt.getTime(),
  };
});

async function _setActiveConfig(name: string, state: RootState) {
  const { config: gamepadConfig } = getGamepadConfig(state, name);
  if (!gamepadConfig) throw new Error('Missing gamepad config cache');
  if (!getIsAllowed(state)) throw new Error('Not allowed to enable config');
  postGa('switch_config', { name });
  return await setActiveConfig(name, gamepadConfig);
}

export const activateGamepadConfigAction = createAppAsyncThunk(
  'config/activate',
  ({ name }: { name: string }, { getState }) => {
    return _setActiveConfig(name, getState());
  },
);

export const disableGamepadConfigAction = createAppAsyncThunk('config/disable', async () => {
  postGa('disable_config');
  await disableActiveConfig();
});

export const deleteGamepadConfigAction = createAppAsyncThunk(
  'config/delete',
  async ({ name }: { name: string }, { getState }) => {
    postGa('modify_config', { name, action: 'delete' });
    const promises: Promise<any>[] = [];
    if (isConfigActive(getState(), name)) {
      // We are deleting the active config, so activate default instead
      promises.push(_setActiveConfig(DEFAULT_CONFIG_NAME, getState()));
    }
    await Promise.all([...promises, deleteGamepadConfig(name)]);
    return { name };
  },
);

export const modifyGamepadConfigAction = createAppAsyncThunk(
  'config/modify',
  async ({ name, gamepadConfig }: { name: string; gamepadConfig: GamepadConfig }, { getState }) => {
    postGa('modify_config', { name, action: 'update' });
    if (isConfigActive(getState(), name)) {
      // Update the active config on page
      await sendMessage(activateGamepadConfigMsg(name, gamepadConfig));
    }
    await storeGamepadConfig(name, gamepadConfig);
    return { name, gamepadConfig };
  },
);

// Sends the updated prefs (without waiting)
export const updatePrefsAction = (prefs: GlobalPrefs): PayloadAction<GlobalPrefs> => {
  // TODO should we just make this createAppAsyncThunk and await here?
  sendMessage(updatePrefsMsg(prefs));
  storeGlobalPrefs(prefs);
  return { type: 'prefs/update', payload: prefs };
};
