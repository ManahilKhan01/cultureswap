/**
 * Validation utility for form inputs
 */

export const validateName = (name: string): string | null => {
  if (!name || name.trim().length < 2) {
    return "Name must be at least 2 characters long.";
  }

  // Only letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    return "Invalid Name format. Please enter a valid name.";
  }

  // Check for suspicious repetitions (e.g., "uuuuuu")
  // If a single character is repeated more than 5 times consecutively, it's likely invalid
  const repetitionRegex = /(.)\1{5,}/;
  if (repetitionRegex.test(name.toLowerCase())) {
    return "Invalid Name format. Please enter a valid name.";
  }

  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) {
    return "Email is required.";
  }

  // Strict email regex - ensuring there's a domain part after @
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return "Invalid Email format. Please enter a valid email address.";
  }

  // Check for suspicious repetitions in the local part or domain
  const repetitionRegex = /(.)\1{8,}/;
  if (repetitionRegex.test(email.toLowerCase())) {
    return "Invalid Email format. Please enter a valid email address.";
  }

  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return "Password is required.";
  }

  const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?=.{8,})/;
  if (!passwordRegex.test(password)) {
    return "Password must meet all security requirements.";
  }

  return null;
};
