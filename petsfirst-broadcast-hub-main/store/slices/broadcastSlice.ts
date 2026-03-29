import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BroadcastResult, BroadcastStatus, CSVData } from '../../types';

interface BroadcastState {
  csvData: CSVData | null;
  results: BroadcastResult[];
  isBroadcasting: boolean;
  isTestBroadcasting: boolean;
  currentBroadcastId: string | null;
}

const initialState: BroadcastState = {
  csvData: null,
  results: [],
  isBroadcasting: false,
  isTestBroadcasting: false,
  currentBroadcastId: null,
};

const broadcastSlice = createSlice({
  name: 'broadcast',
  initialState,
  reducers: {
    setCsvData: (state, action: PayloadAction<CSVData | null>) => {
      state.csvData = action.payload;
    },
    addResult: (state, action: PayloadAction<BroadcastResult>) => {
      state.results.push(action.payload);
    },
    setResults: (state, action: PayloadAction<BroadcastResult[]>) => {
      state.results = action.payload;
    },
    clearResults: (state) => {
      state.results = [];
    },
    setIsBroadcasting: (state, action: PayloadAction<boolean>) => {
      state.isBroadcasting = action.payload;
    },
    setIsTestBroadcasting: (state, action: PayloadAction<boolean>) => {
      state.isTestBroadcasting = action.payload;
    },
    setCurrentBroadcastId: (state, action: PayloadAction<string | null>) => {
      state.currentBroadcastId = action.payload;
    },
    resetBroadcast: (state) => {
      state.csvData = null;
      state.results = [];
      state.isBroadcasting = false;
      state.isTestBroadcasting = false;
      state.currentBroadcastId = null;
    },
  },
});

export const {
  setCsvData,
  addResult,
  setResults,
  clearResults,
  setIsBroadcasting,
  setIsTestBroadcasting,
  setCurrentBroadcastId,
  resetBroadcast,
} = broadcastSlice.actions;

export default broadcastSlice.reducer;
