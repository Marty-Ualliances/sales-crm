import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ override: false });

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().optional(),
    INTERNAL_PORT: z.string().optional(),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    SMTP_FROM: z.string().optional(),
    APP_URL: z.string().optional(),
    ALLOWED_ORIGINS: z.string().optional().default(''),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error("❌ Invalid environment variables:");
    console.error(_env.error.format());
    process.exit(1);
}

export const env = _env.data;
