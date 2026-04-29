/** Replace `{{key}}` placeholders in copy strings (e.g. "{{year}}", "{{current}}"). */
export function formatSiteCopy(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ''));
}
