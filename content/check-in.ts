/**
 * The check-in scale.
 *
 * One tap, five points, plain words. Deliberately not a clinical instrument
 * and not framed as one: this is a man's own read on his week, kept so he
 * can look back at it, not scored, diagnosed or interpreted at him.
 *
 * The numbers exist so the record is readable later. Nothing in the product
 * tells a member what his number means.
 */

export type HoldingUp = 1 | 2 | 3 | 4 | 5;

export const HOLDING_UP: { value: HoldingUp; label: string }[] = [
  { value: 1, label: "Barely" },
  { value: 2, label: "Rough" },
  { value: 3, label: "Getting by" },
  { value: 4, label: "Alright" },
  { value: 5, label: "Good week" },
];

export function holdingUpLabel(value: number | null | undefined) {
  return HOLDING_UP.find((option) => option.value === value)?.label ?? null;
}
