/**
 * Fill `{name}` placeholders in a dictionary string. Copy that has to wrap around
 * a number belongs in the dictionary as one sentence, not as three fragments a
 * component concatenates — Indonesian and English do not put the number in the
 * same place, and concatenation quietly assumes they do.
 *
 * Its own module so that code needing to format a sentence does not have to pull
 * in the whole dictionary to do it.
 */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  )
}
