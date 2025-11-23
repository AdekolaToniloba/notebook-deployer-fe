// lib/utils/password.ts

/**
 * Password Strength Calculator
 *
 * Why we validate password strength:
 * - Weak passwords are the #1 security vulnerability
 * - We guide users to create strong passwords
 * - This runs CLIENT-SIDE only - never trust it for security
 * - Server MUST also validate (which our Zod schema does)
 *
 * Returns: 0-4 (weak to strong)
 */

export function calculatePasswordStrength(password: string): number {
  if (!password) return 0;

  let strength = 0;

  // Length check (8+ chars = 1 point)
  if (password.length >= 8) strength++;

  // Uppercase check
  if (/[A-Z]/.test(password)) strength++;

  // Lowercase check
  if (/[a-z]/.test(password)) strength++;

  // Number check
  if (/\d/.test(password)) strength++;

  // Special character check (optional bonus)
  if (/[^A-Za-z0-9]/.test(password)) {
    // If all other criteria met, special chars push to max strength
    if (strength === 4 && password.length >= 12) {
      return 4;
    }
  }

  return Math.min(strength, 4);
}

/**
 * Get human-readable strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
  switch (strength) {
    case 0:
    case 1:
      return "Weak password";
    case 2:
      return "Fair password";
    case 3:
      return "Good password";
    case 4:
      return "Strong password";
    default:
      return "";
  }
}

/**
 * Get strength color
 */
export function getPasswordStrengthColor(strength: number): string {
  switch (strength) {
    case 0:
    case 1:
      return "bg-error";
    case 2:
      return "bg-warning";
    case 3:
    case 4:
      return "bg-success";
    default:
      return "bg-border";
  }
}
