import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ override: false });

const resolvedMongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    '';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().optional(),
    INTERNAL_PORT: z.string().optional(),
    MONGODB_URI: z.string().optional(),
    MONGODB_URL: z.string().optional(),
    MONGO_URL: z.string().optional(),
    DATABASE_URL: z.string().optional(),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    APP_URL: z.string().optional(),
    ALLOWED_ORIGINS: z.string().optional().default(''),
    COOKIE_DOMAIN: z.string().optional(),
    COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error("❌ Invalid environment variables:");
    console.error(_env.error.format());
    process.exit(1);
}

if (!resolvedMongoUri) {
    console.error("❌ Missing MongoDB connection string. Set one of: MONGODB_URI, MONGODB_URL, MONGO_URL, DATABASE_URL");
    process.exit(1);
}

export const env = {
    ..._env.data,
    MONGODB_URI: resolvedMongoUri,
};
