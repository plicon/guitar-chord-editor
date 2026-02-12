import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes a filename by trimming and removing trailing special characters
 * like spaces, dots, commas, etc.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .trim()
    .replace(/[\s.,;:!?'"]+$/g, '') // Remove trailing spaces and punctuation
    .replace(/\s+/g, '-') // Replace remaining spaces with hyphens
    .toLowerCase();
}
