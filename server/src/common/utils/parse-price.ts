import { BadRequestException } from '@nestjs/common';

export const MAX_PRICE = 99_999_999.99;

export function parsePrice(value: unknown): string {
  const cleaned = String(value ?? '')
    .trim()
    .replace(/^(rs\.?|inr|₹)\s*/i, '')
    .replace(/[₹,\s]/g, '')
    .replace(/\/-?$/, '');
  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_PRICE) {
    throw new BadRequestException(
      'Price must be a valid number greater than 0 (e.g. 99 or 99.50)',
    );
  }
  return amount.toFixed(2);
}
