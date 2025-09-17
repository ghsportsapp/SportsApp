export interface UsernameValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validates username format according to business rules
 * @param username - The username to validate
 * @returns ValidationResult with isValid flag and error message
 */
export function validateUsername(username: string): UsernameValidationResult {
  if (username.length === 0) {
    return { isValid: false, error: null };
  }
  
  // Must start with a letter
  if (!/^[a-zA-Z]/.test(username)) {
    return { isValid: false, error: "Username must start with a letter" };
  }
  
  // Cannot have consecutive dots
  if (/\.\./.test(username)) {
    return { isValid: false, error: "Username cannot have consecutive dots" };
  }
  
  // Cannot end with a dot
  if (/\.$/.test(username)) {
    return { isValid: false, error: "Username cannot end with a dot" };
  }
  
  // Only letters, numbers, underscores, and dots allowed
  if (!/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(username)) {
    return { isValid: false, error: "Username can only contain letters, numbers, underscores, and dots" };
  }
  
  // Length validation
  if (username.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters long" };
  }
  
  if (username.length > 20) {
    return { isValid: false, error: "Username cannot exceed 20 characters" };
  }
  
  return { isValid: true, error: null };
}

/**
 * Helper function to safely get user initials from a name
 * @param name - The full name to extract initials from
 * @param fallback - Fallback character if name is invalid
 * @returns Formatted initials string
 */
export function getInitials(name?: string, fallback = 'U'): string {
  const s = name?.trim().split(/\s+/).map(p => p[0]).join('').slice(0, 2);
  return s ? s.toUpperCase() : fallback;
}