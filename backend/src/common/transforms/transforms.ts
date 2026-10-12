export const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.toLowerCase().trim() : value;

export const toBoolean = ({ value }: { value: unknown }): boolean =>
  value === 'true' || value === true;

export const toInt = ({ value }: { value: unknown }): number =>
  parseInt(String(value), 10);

export const toFloat = ({ value }: { value: unknown }): number =>
  parseFloat(String(value));
