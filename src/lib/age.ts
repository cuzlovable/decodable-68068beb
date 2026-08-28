/** Age helpers — AuraChem never stores a separate age field. */

export const MIN_AGE = 18;

/** Whole years between a YYYY-MM-DD birth date and today. Null when unknown/invalid. */
export const ageFromBirthDate = (birthDate?: string | null): number | null => {
  if (!birthDate) return null;
  const born = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age;
};

export const isAdult = (birthDate?: string | null) => {
  const age = ageFromBirthDate(birthDate);
  return age !== null && age >= MIN_AGE;
};

export const GENDER_OPTIONS = ["Woman", "Man", "Non-binary"] as const;

export const ORIENTATION_OPTIONS = [
  "Straight",
  "Gay",
  "Lesbian",
  "Bisexual",
  "Pansexual",
  "Queer",
  "Asexual",
] as const;
