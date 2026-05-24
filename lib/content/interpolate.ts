/** Replace `{key}` placeholders in copy templates. */
export function t(
  template: string,
  vars?: Record<string, string | number | null | undefined>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v !== undefined && v !== null ? String(v) : `{${key}}`;
  });
}
