/**
 * Minimal type declaration for window.gtag (Google Analytics 4).
 * Covers the `event` command used by the analytics service.
 */

type GtagCommand = "event" | "config" | "set" | "js" | "get";

type GtagEventParams = Record<string, string | number | boolean | undefined>;

interface Window {
  gtag: (command: GtagCommand, eventNameOrTarget: string, params?: GtagEventParams) => void;
}
