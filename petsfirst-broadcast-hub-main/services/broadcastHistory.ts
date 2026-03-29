import { BroadcastHistory } from '../types';

const STORAGE_KEY = 'pets_first_broadcast_history';

export const saveBroadcastHistory = (broadcast: BroadcastHistory): void => {
  const history = getBroadcastHistory();
  history.unshift(broadcast);
  // Keep only last 100 broadcasts
  const limited = history.slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
};

export const getBroadcastHistory = (): BroadcastHistory[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as BroadcastHistory[];
  } catch {
    return [];
  }
};

export const createBroadcastHistory = (
  name: string,
  fileName: string,
  templateName: string,
  recipients: number,
  createdBy: string = 'Clinic Administrator',
): BroadcastHistory => {
  return {
    id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    fileName,
    templateName,
    status: 'PENDING',
    recipients,
    sent: 0,
    delivered: 0,
    read: 0,
    replied: 0,
    clicks: 0,
    formReplied: 0,
    failed: 0,
    createdAt: Date.now(),
    createdBy,
  };
};

export const updateBroadcastStatus = (
  id: string,
  updates: Partial<BroadcastHistory>,
): void => {
  const history = getBroadcastHistory();
  const index = history.findIndex((b) => b.id === id);
  if (index !== -1) {
    history[index] = { ...history[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
};
