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

export const validateReview = (
  text: string,
): {
  isValid: boolean;
  error: string | null;
  wordCount: number;
  charCount: number;
} => {
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const MAX_WORDS = 80;
  const MAX_CHARS = 500;

  if (charCount > MAX_CHARS) {
    return {
      isValid: false,
      error: `Review cannot exceed ${MAX_CHARS} characters. Please shorten your message.`,
      wordCount,
      charCount,
    };
  }

  if (wordCount > MAX_WORDS) {
    return {
      isValid: false,
      error: `Review cannot exceed ${MAX_WORDS} words. Please shorten your message.`,
      wordCount,
      charCount,
    };
  }

  return {
    isValid: true,
    error: null,
    wordCount,
    charCount,
  };
};

/**
 * Validates swap content (title, skill name, etc.) to prevent gibberish and empty strings.
 */
export const validateSwapContent = (
  text: string,
  label: string,
): string | null => {
  const trimmed = text.trim();

  if (!trimmed) {
    return `${label} is required.`;
  }

  if (trimmed.length < 3) {
    return `${label} must be at least 3 characters long.`;
  }

  // Check for gibberish: no vowels in a word or too many consecutive consonants
  const words = trimmed.toLowerCase().split(/\s+/);
  const vowelRegex = /[aeiouy]/;
  const consonantRepetitionRegex = /[^aeiouy\s\d,.-]{6,}/;
  const charRepetitionRegex = /(.)\1{4,}/;

  for (const word of words) {
    // If the word is at least 3 chars long and has no vowels, it's likely gibberish
    if (word.length >= 3 && !vowelRegex.test(word)) {
      return `${label} must contain valid words.`;
    }

    // Check for too many consecutive consonants
    if (consonantRepetitionRegex.test(word)) {
      return `${label} contains invalid character sequences.`;
    }
  }

  // Check for excessive single character repetition (e.g., "aaaaaaa")
  if (charRepetitionRegex.test(trimmed)) {
    return `Please enter a valid ${label.toLowerCase()}.`;
  }

  return null;
};
