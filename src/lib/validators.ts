// Shared frontend + backend-style validators.
// "Backend" rules are enforced in code before any DB insert/update.

export interface PasswordChecks {
  length: boolean;
  number: boolean;
  special: boolean;
}

export const checkPassword = (pw: string): PasswordChecks => ({
  length: pw.length >= 6,
  number: /[0-9]/.test(pw),
  special: /[!@#$%^&*]/.test(pw),
});

export const isPasswordValid = (pw: string) => {
  const c = checkPassword(pw);
  return c.length && c.number && c.special;
};

export const getPasswordError = (pw: string): string | null => {
  if (pw.length < 6) return "Password must be at least 6 characters";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one number";
  if (!/[!@#$%^&*]/.test(pw)) return "Password must contain at least one special character";
  return null;
};

export const getNameError = (name: string): string | null => {
  if (!name || !name.trim()) return "Full name is required";
  if (!/^[A-Za-z\u00C0-\u024F\u0600-\u06FF\s'\-]+$/.test(name.trim())) {
    return "Full name must contain letters only (no numbers or symbols)";
  }
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return "Full name must contain at least a first and last name";
  return null;
};

export const getEmailError = (email: string): string | null => {
  if (!email || !email.trim()) return "Email must not be empty";
  if (/\s/.test(email)) return "Invalid email format";
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) return "Email must contain @";
  const [local, domain] = email.split("@");
  if (!local) return "Invalid email format";
  if (!domain || !/^[^\s@]+\.[^\s@]{2,}$/.test(domain)) return "Email must have a valid domain";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
  return null;
};

export const getPhoneError = (
  phone: string,
  minDigits?: number,
  maxDigits?: number,
  countryName?: string,
): string | null => {
  if (!phone || !phone.trim()) return "Phone number must not be empty";
  if (/[\s\-()]/.test(phone)) return "Phone number must not contain spaces, dashes, or parentheses";

  // Determine the local digit part. Callers may pass either the full "+CC+local" string
  // or only the local digits. When min/max are provided, the local part is what gets range-checked.
  let local = phone;
  if (phone.startsWith("+")) {
    const rest = phone.slice(1);
    if (!/^[0-9]+$/.test(rest)) return "Phone number must contain numbers only after +";
    if (rest.length < 7 || rest.length > 15) return "Phone number must be between 7 and 15 digits";
    // Strip the leading country code if we can infer it from the provided range:
    // local length should match [minDigits, maxDigits]; the remainder is the CC.
    if (minDigits !== undefined && maxDigits !== undefined) {
      // Try lengths from maxDigits down to minDigits to find a valid suffix split.
      const candidate = rest.length >= minDigits ? rest.slice(rest.length - Math.min(rest.length, maxDigits)) : rest;
      local = candidate;
      // Prefer the exact local length within range when possible.
      for (let n = maxDigits; n >= minDigits; n--) {
        if (rest.length >= n) { local = rest.slice(rest.length - n); break; }
      }
    } else {
      local = rest;
    }
  } else {
    if (!/^[0-9]+$/.test(phone)) return "Phone number must contain numbers only";
  }

  if (minDigits !== undefined && maxDigits !== undefined) {
    const country = countryName ? ` for ${countryName}` : "";
    if (local.length < minDigits || local.length > maxDigits) {
      if (minDigits === maxDigits) return `Phone number must be ${minDigits} digits${country}`;
      return `Phone number must be between ${minDigits} and ${maxDigits} digits${country}`;
    }
  }
  return null;
};
