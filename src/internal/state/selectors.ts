import { notPaidPayment } from '../../shared/payments';
import { computeTrialState, TrialState } from '../../shared/trial';
import { RootState } from './typed';

export const getAllGamepadConfigs = (state: RootState) => {
  return {
    configs: state.configs,
    status: state.pending.readAll,
    error: state.pending.readAllError,
  };
};

export const getGamepadConfig = (state: RootState, name: string) => {
  return {
    config: state.configs[name],
    status: state.pending.configs[name],
  };
};

export const getIsEnabled = (state: RootState): boolean => {
  return state.enabled;
};

export const getActiveConfigName = (state: RootState): string => {
  return state.active;
};

export const isConfigActive = (state: RootState, name: string): boolean => {
  return getActiveConfigName(state) === name;
};

export const getGameName = (state: RootState) => {
  return {
    gameName: state.gameName,
    status: state.pending.gameStatus,
  };
};

export const getPayment = (state: RootState) => {
  return state.payment || notPaidPayment;
};

export const getPaymentStatus = (state: RootState) => {
  return state.pending.payment;
};

export const getTrialState = (state: RootState): TrialState => {
  return computeTrialState(getPayment(state).trialStartedAt);
};

export const getIsAllowed = (state: RootState): boolean => {
  const trialState = getTrialState(state);
  const payment = getPayment(state);
  return payment.paid || trialState.status === 'active';
};

export const getUpsellModalVisibility = (state: RootState) => {
  return state.upsellModalVisibility;
};

export const getGlobalPrefs = (state: RootState) => {
  return state.prefs;
};
