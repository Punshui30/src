import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// VPS API endpoint
export const API_BASE_URL = 'http://165.227.111.7:3000';