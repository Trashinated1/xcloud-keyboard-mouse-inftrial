import { configureStore } from '@reduxjs/toolkit';
import logger from 'redux-logger';
import {
  activeConfigReducer,
  configDetailsReducer,
  enabledReducer,
  currentGameReducer,
  pendingStatusesReducer,
  paymentReducer,
  upsellModalVisibilityReducer,
  prefsReducer,
} from './reducers';

export const store = configureStore({
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(process.env.NODE_ENV === 'production' ? [] : [logger]),
  reducer: {
    gameName: currentGameReducer,
    enabled: enabledReducer,
    active: activeConfigReducer,
    configs: configDetailsReducer,
    payment: paymentReducer,
    pending: pendingStatusesReducer,
    upsellModalVisibility: upsellModalVisibilityReducer,
    prefs: prefsReducer,
  },
});
