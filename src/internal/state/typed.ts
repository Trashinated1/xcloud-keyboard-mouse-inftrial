// Special types for redux that are more specific to our app's data

import { createAsyncThunk } from '@reduxjs/toolkit';
import { store } from './store';

// https://redux-toolkit.js.org/usage/usage-with-typescript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();
