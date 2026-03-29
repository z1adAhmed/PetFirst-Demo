import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

interface UIState {
  modal: ModalState;
}

const initialState: UIState = {
  modal: {
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showModal: (state, action: PayloadAction<Omit<ModalState, 'isOpen'>>) => {
      state.modal = {
        ...action.payload,
        isOpen: true,
      };
    },
    hideModal: (state) => {
      state.modal.isOpen = false;
    },
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
      };
    },
  },
});

export const { showModal, hideModal, closeModal } = uiSlice.actions;

export default uiSlice.reducer;
