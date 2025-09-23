import { v4 as uuidv4 } from 'uuid';

/**
 * Generates or retrieves a guest ID from localStorage
 * @returns {string} The guest ID
 */
export function getGuestId(): string {
  if (typeof window === 'undefined') return '';
  
  let guestId = localStorage.getItem('guestId');
  if (!guestId) {
    guestId = `guest_${uuidv4()}`;
    localStorage.setItem('guestId', guestId);
  }
  console.log("guestId",guestId);
  return guestId;
}


/**
 * Validates if a string is a valid guest ID
 * @param id The ID to validate
 * @returns {boolean} True if the ID is a valid guest ID
 */
export function isValidGuestId(id: string): boolean {
  return id.startsWith('guest_') && id.length > 6; // guest_ + at least 1 character
}

/**
 * Clears the guest ID from localStorage
 */
export function clearGuestId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('guestId');
  }
}
