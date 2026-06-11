/**
 * Plausible Analytics – custom event tracking helper.
 * Uses the tagged-events script, so events are tracked via window.plausible().
 * Safe to call even if Plausible is blocked (ad-blockers) – fails silently.
 */

type PlausibleEvent =
  | "Translator Used"
  | "Map Opened"
  | "Finance Expense Added"
  | "Finance Debt Paid"
  | "Chat Message Sent"
  | "Vault File Uploaded"
  | "Dictionary Phrase Played"
  | "Join Trip"
  | "Trip Created"
  | "Shopping Item Added"
  | "Task Created";

export function usePlausible() {
  const trackEvent = (event: PlausibleEvent, props?: Record<string, string | number | boolean>) => {
    try {
      const w = window as any;
      if (typeof w.plausible === "function") {
        w.plausible(event, props ? { props } : undefined);
      }
    } catch {
      // Silently ignore – analytics should never break the app
    }
  };

  return { trackEvent };
}
