import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

/**
 * Initialise Sentry for the React frontend.
 * Safe to call when VITE_SENTRY_DSN is not set – Sentry stays in no-op mode.
 */
export function initSentry() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE ?? "production",
    // Capture 10 % of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Only send errors in production
    enabled: import.meta.env.PROD,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
  });
}

export { Sentry };
