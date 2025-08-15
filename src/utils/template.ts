export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v !== undefined ? v : `{{${key}}}`;
  });
}

