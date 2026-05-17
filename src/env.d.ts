/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ANTHROPIC_API_KEY: string;
  readonly UPSTASH_REDIS_REST_URL: string;
  readonly UPSTASH_REDIS_REST_TOKEN: string;
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM: string;
  readonly APP_URL: string;
  readonly RAZORPAY_KEY_ID?: string;
  readonly RAZORPAY_KEY_SECRET?: string;
  readonly PUBLIC_RAZORPAY_KEY_ID?: string;
  readonly PUBLIC_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    user: { id: string; email: string } | null;
  }
}
