import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MONGODB_URI: z.string().url(),
    JWT_SECRET: z.string().min(32),
    PORT: z.string().default('3000'),
    APP_URL: z.string().url().default('http://localhost:3000'),

    // Email (SMTP) config
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().transform(Number).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().email().optional(),

    // CORS 
    ALLOWED_ORIGINS: z.string().optional(),
});

// Since Next.js bundles edge, middleware, and server contexts differently, 
// we only parse process.env when not in a browser environment.
const isServer = typeof window === 'undefined';

let env: z.infer<typeof envSchema>;

if (isServer) {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', parsed.error.format());
        throw new Error('Invalid environment variables');
    }

    env = parsed.data;
} else {
    // In the browser, we don't expose server env vars. 
    // Any NEXT_PUBLIC_ vars would be handled here, but this app mainly uses server vars.
    env = {} as any;
}

export const config = env;
