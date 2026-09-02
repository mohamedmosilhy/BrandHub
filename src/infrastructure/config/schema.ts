/**
 * The configuration contract.
 *
 * Kept free of Expo imports so it can be validated in a plain Node test, and so
 * that a configuration mistake is caught by the type system and by a unit test
 * rather than only at app start.
 */
import { z } from 'zod';

const booleanFromString = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) =>
    typeof value === 'boolean' ? value : value === 'true',
  );

export const appEnvSchema = z.enum(['development', 'staging', 'production']);
export type AppEnvName = z.infer<typeof appEnvSchema>;

export const appConfigSchema = z.object({
  env: appEnvSchema,
  apiBaseUrl: z.url({ message: 'must be an absolute URL' }),
  defaultLocale: z.enum(['ar', 'en']),
  requestTimeoutMs: z.coerce.number().int().positive().max(120_000),
  enableDevMenu: booleanFromString,
});

export type AppConfig = Readonly<z.infer<typeof appConfigSchema>>;

/** Formats Zod issues into a message a developer can act on immediately. */
function describeIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `  • ${path}: ${issue.message}`;
    })
    .join('\n');
}

/**
 * Parses and freezes configuration. Throws with an actionable message rather
 * than letting an undefined value surface three screens later.
 */
export function parseAppConfig(raw: unknown): AppConfig {
  const result = appConfigSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      'Invalid application configuration.\n' +
        `${describeIssues(result.error)}\n` +
        'Check the .env file for the active APP_ENV, then restart the bundler. ' +
        'A template is in .env.example.',
    );
  }
  return Object.freeze(result.data);
}
