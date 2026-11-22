import { useEffect, useRef } from "react";

type TurnstileApi = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: TurnstileApi } }

export default function Turnstile({ siteKey, action, onToken }: { siteKey: string; action: string; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    let widgetId = "";
    const render = () => {
      if (cancelled || !container.current || !window.turnstile) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey, action,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };
    if (window.turnstile) render();
    else {
      const script = document.querySelector<HTMLScriptElement>('script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]') || document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.addEventListener("load", render, { once: true });
      if (!script.isConnected) document.head.appendChild(script);
      return () => { cancelled = true; script.removeEventListener("load", render); if (widgetId) window.turnstile?.remove(widgetId); };
    }
    return () => { cancelled = true; if (widgetId) window.turnstile?.remove(widgetId); };
  }, [siteKey, action, onToken]);
  return <div ref={container} aria-label="Bot verification" />;
}
