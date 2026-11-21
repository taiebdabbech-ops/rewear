import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Tunisian mobile number: 8 digits, optionally preceded by +216. */
export const TN_PHONE = /^(\+216\s?)?[2-9]\d{1}\s?\d{3}\s?\d{3}$/;

/** Cities offered in the sign-up and profile forms. */
export const CITIES: string[] = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Sfax',
  'Sousse',
  'Monastir',
  'Nabeul',
  'Bizerte',
  'Gabès',
  'Kairouan',
];

/**
 * Group validator: the controls named `password` and `confirm` must hold the same value.
 * Used by the sign-up form and by the "change password" form of the profile.
 */
export const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
};

/** Removes the spaces a user may type in a phone number ("22 123 456" → "22123456"). */
export function cleanPhone(phone: string): string {
  return phone.replace(/\s/g, '');
}
