import { configureStore } from '@reduxjs/toolkit';
import configReducer from './slices/configSlice';
import broadcastReducer from './slices/broadcastSlice';
import templatesReducer from './slices/templatesSlice';
import uiReducer from './slices/uiSlice';
import createTemplateReducer from './slices/createTemplateSlice';

export const store = configureStore({
  reducer: {
    config: configReducer,
    broadcast: broadcastReducer,
    templates: templatesReducer,
    ui: uiReducer,
    createTemplate: createTemplateReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['broadcast/addResult', 'config/setTemplate'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['broadcast.results', 'config.template'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
