/**
 * Date utility functions
 */

/**
 * Formats a date to a readable string
 */
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return '—';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };

  return dateObj.toLocaleString('en-US', { ...defaultOptions, ...options });
};

/**
 * Formats a date to a short string (date only)
 */
export const formatDateShort = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return '—';

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Gets relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return '—';

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDateShort(dateObj);
};
