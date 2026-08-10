import process from 'node:process';

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  jwtSecret: string;
  databaseUrl?: string;
  corsOrigins: string[] | '*';
  adminToken?: string;
  openAiApiKey?: string;
  googleClientIds: string[];
  appleClientId?: string;
  socialDevMode: boolean;
}

const DEV_JWT_SECRET = 'local-development-secret-change-me';

function parseNodeEnv(value: string | undefined): AppConfig['nodeEnv'] {
  if (value === 'production' || value === 'test') return value;
  return 'development';
}

function parseCsv(value: string | undefined): string[] {
  return (
    value
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function requiredProductionValue(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`${name} is required when NODE_ENV=production`);
  }
  return value.trim();
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = parseNodeEnv(env.NODE_ENV);
  const jwtSecret = env.JWT_SECRET?.trim() || (nodeEnv === 'production' ? '' : DEV_JWT_SECRET);
  const databaseUrl = env.DATABASE_URL?.trim() || undefined;
  const corsOrigins = parseCsv(env.CORS_ORIGIN);
  const socialDevMode = env.SOCIAL_DEV_MODE === 'true';

  if (nodeEnv === 'production') {
    if (jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must contain at least 32 characters in production');
    }
    requiredProductionValue('DATABASE_URL', databaseUrl);
    if (corsOrigins.length === 0 || corsOrigins.includes('*')) {
      throw new Error('CORS_ORIGIN must contain explicit origins in production');
    }
    if (socialDevMode) {
      throw new Error('SOCIAL_DEV_MODE must be disabled in production');
    }
  }

  const port = Number.parseInt(env.PORT ?? '3000', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return {
    nodeEnv,
    port,
    jwtSecret,
    databaseUrl,
    corsOrigins: corsOrigins.length ? corsOrigins : '*',
    adminToken: env.ADMIN_TOKEN?.trim() || undefined,
    openAiApiKey: env.OPENAI_API_KEY?.trim() || undefined,
    googleClientIds: parseCsv(env.GOOGLE_CLIENT_IDS),
    appleClientId: env.APPLE_CLIENT_ID?.trim() || undefined,
    socialDevMode,
  };
}

export const config = loadConfig();
