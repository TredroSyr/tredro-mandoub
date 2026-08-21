import { z } from "zod";
import { defaultCountries, parseCountry } from "react-international-phone";

export const phoneFormatOverrides: Record<string, string> = {
  sy: "... ... ...", // 9 أرقام: 9XX XXX XXX
};

/** حذف الصفر في بداية الرقم الوطني (0912... => 912...) */
export const stripNationalLeadingZero = (
  phone: string,
  dialCode: string,
): string => {
  const prefix = `+${dialCode}`;
  if (!phone.startsWith(prefix)) return phone;
  const national = phone.slice(prefix.length).replace(/^0+/, "");
  return `${prefix}${national}`;
};

const expectedNationalLength = (dialCode: string): number | null => {
  const country = defaultCountries
    .map(parseCountry)
    .find((c) => c.dialCode === dialCode);
  if (!country) return null;
  const format = phoneFormatOverrides[country.iso2] ?? country.format;
  const mask =
    typeof format === "string"
      ? format
      : typeof format === "object" && format
        ? format.default
        : undefined;

  if (!mask) return null;
  const dots = mask.split("").filter((char) => char === ".").length;
  return dots > 0 ? dots : null;
};

export const isPhoneValid = (phone: string): boolean => {
  if (!phone?.startsWith("+")) return false;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return false;

  const dialCode = [4, 3, 2, 1]
    .map((len) => digits.slice(0, len))
    .find((candidate) =>
      defaultCountries.some((c) => parseCountry(c).dialCode === candidate),
    );
  if (!dialCode) return false;

  const nationalLength = digits.length - dialCode.length;
  if (nationalLength === 0) return false;

  const expected = expectedNationalLength(dialCode);
  return expected === null ? nationalLength >= 6 : nationalLength === expected;
};

export const phoneSchema = z
  .string()
  .trim()
  .min(1, { message: "رقم الهاتف مطلوب" })
  .refine(isPhoneValid, { message: "رقم الهاتف غير صحيح للدولة المختارة" });
