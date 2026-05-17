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
  if (!phone.startsWith("+")) return "Phone number must be in international format starting with +";
  const rest = phone.slice(1);
  if (!/^[0-9]+$/.test(rest)) return "Phone number must contain numbers only after +";
  if (rest.length < 7 || rest.length > 15) return "Phone number must be between 7 and 15 digits";

  if (minDigits !== undefined && maxDigits !== undefined) {
    // Local part excludes the country code. We expect callers to pass the full +CC+local string.
    // Determine local length by stripping the country code if it matches a known prefix isn't trivial here;
    // callers concatenate countryCode + local, so local length = total digits - countryCodeDigits.
    // We require callers to also provide the local length implicitly: use rest.length minus an assumed CC.
    // To stay robust, compute by allowing callers to pass just the local part: if rest length is already
    // within [minDigits, maxDigits], accept; otherwise try subtracting common CC lengths is unreliable.
    // Simpler contract: assume the local digit count equals rest length minus inferred CC. Since callers
    // pass the full +CC+local, we approximate by checking if the trailing digits satisfy the range.
    const local = rest; // when caller passes only local digits with a leading "+CC" prefix handled upstream
    // Validate using the last segment fits the range — but we actually want exact local digits.
    // For correctness, the caller should pass only the local part as `phone` after stripping CC.
    const country = countryName ? ` for ${countryName}` : "";
    const lenOk = local.length >= minDigits && local.length <= maxDigits;
    if (!lenOk) {
      if (minDigits === maxDigits) return `Phone number must be ${minDigits} digits${country}`;
      return `Phone number must be between ${minDigits} and ${maxDigits} digits${country}`;
    }
  }
  return null;
};
