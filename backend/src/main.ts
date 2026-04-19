import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';

const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'access_token', 'refresh_token'];

function nowStamp() {
  return new Date().toLocaleString('es-CO', { hour12: false });
}

function redactSensitive(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => redactSensitive(item));
  }

  if (input && typeof input === 'object') {
    const source = input as Record<string, unknown>;
    const target: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(source)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        target[key] = '[REDACTED]';
      } else {
        target[key] = redactSensitive(value);
      }
    }

    return target;
  }

  return input;
}

function safeJson(input: unknown): string {
  try {
    return JSON.stringify(redactSensitive(input));
  } catch {
    return '{}';
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use((req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  app.use((req: any, res: any, next: () => void) => {
    const started = Date.now();
    const stamp = nowStamp();
    const query = req.query && Object.keys(req.query).length > 0 ? safeJson(req.query) : '{}';
    const body = req.body && Object.keys(req.body).length > 0 ? safeJson(req.body) : '{}';

    console.log(`[BACKEND][${stamp}] -> ${req.method} ${req.originalUrl}`);
    console.log(`[BACKEND][${stamp}]    query=${query}`);
    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
      console.log(`[BACKEND][${stamp}]    body=${body}`);
    }

    res.on('finish', () => {
      const endedStamp = nowStamp();
      const ms = Date.now() - started;
      console.log(
        `[BACKEND][${endedStamp}] <- ${req.method} ${req.originalUrl} status=${res.statusCode} duracionMs=${ms}`,
      );
    });

    next();
  });

  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
