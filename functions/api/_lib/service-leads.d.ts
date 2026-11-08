export function cleanLeadText(value: unknown, maxLength?: number): string
export function isValidLeadEmail(value: unknown): boolean
export function isValidLeadPhone(value: unknown): boolean
export function normalizeLeadFields(configuredFields: unknown, suppliedFields: unknown): {
  values: Record<string, string> | null
  error: string | null
  field?: string
}
