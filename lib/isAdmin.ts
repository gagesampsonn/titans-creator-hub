/**
 * Admin Authorization Helper
 * 
 * Simple email allowlist for admin access.
 * This is checked both client-side (for route protection)
 * and server-side (in API endpoints).
 */

// Hardcoded admin email allowlist
// Add emails here as needed
const ADMIN_EMAILS = [
  'gagesampson2016@gmail.com',
];

/**
 * Check if an email is in the admin allowlist
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Get the list of admin emails (for debugging/display)
 */
export function getAdminEmails(): string[] {
  return [...ADMIN_EMAILS];
}
