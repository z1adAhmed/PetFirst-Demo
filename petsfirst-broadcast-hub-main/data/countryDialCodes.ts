/** Country code, dial code and flag for phone number input. Sorted by dial code for parsing (longest first). */
export interface CountryDialCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
}

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳" },
  { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AE", dialCode: "+971", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "PK", dialCode: "+92", name: "Pakistan", flag: "🇵🇰" },
  { code: "BD", dialCode: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "SG", dialCode: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "MY", dialCode: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "DE", dialCode: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "FR", dialCode: "+33", name: "France", flag: "🇫🇷" },
  { code: "NL", dialCode: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "ES", dialCode: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "IT", dialCode: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "BR", dialCode: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "ZA", dialCode: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "EG", dialCode: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "NG", dialCode: "+234", name: "Nigeria", flag: "🇳🇬" },
  { code: "KE", dialCode: "+254", name: "Kenya", flag: "🇰🇪" },
  { code: "PH", dialCode: "+63", name: "Philippines", flag: "🇵🇭" },
  { code: "ID", dialCode: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "TH", dialCode: "+66", name: "Thailand", flag: "🇹🇭" },
  { code: "VN", dialCode: "+84", name: "Vietnam", flag: "🇻🇳" },
  { code: "CN", dialCode: "+86", name: "China", flag: "🇨🇳" },
  { code: "JP", dialCode: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "KR", dialCode: "+82", name: "South Korea", flag: "🇰🇷" },
  { code: "MX", dialCode: "+52", name: "Mexico", flag: "🇲🇽" },
  { code: "AR", dialCode: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", dialCode: "+56", name: "Chile", flag: "🇨🇱" },
  { code: "CO", dialCode: "+57", name: "Colombia", flag: "🇨🇴" },
  { code: "PL", dialCode: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "RU", dialCode: "+7", name: "Russia", flag: "🇷🇺" },
  { code: "TR", dialCode: "+90", name: "Turkey", flag: "🇹🇷" },
];

/** Sorted by dial code length descending for parsing (match longest first). */
export const COUNTRY_DIAL_CODES_BY_LENGTH = [...COUNTRY_DIAL_CODES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length,
);

export function parseFullNumber(full: string): { country: CountryDialCode; national: string } | null {
  const digits = full.replace(/\D/g, "");
  if (!digits.length) return null;
  for (const c of COUNTRY_DIAL_CODES_BY_LENGTH) {
    const codeDigits = c.dialCode.replace(/\D/g, "");
    if (digits.startsWith(codeDigits)) {
      const national = digits.slice(codeDigits.length);
      return { country: c, national };
    }
  }
  return null;
}

export function formatFullNumber(country: CountryDialCode, national: string): string {
  const digits = national.replace(/\D/g, "");
  if (!digits) return country.dialCode;
  return `${country.dialCode} ${digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim()}`;
}

export function toE164(country: CountryDialCode, national: string): string {
  return country.dialCode + national.replace(/\D/g, "");
}
