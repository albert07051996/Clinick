import { useEffect, useRef, useState } from 'react';

/* Google Identity Services — vanilla integration without extra deps.
   The GSI script is loaded once on mount; the rendered button fires
   `onCredential` with Google's ID token when the user authenticates. */

declare global {
  // Minimal typings for the subset of GSI we touch.
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            },
          ) => void;
        };
      };
    };
  }
}

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

type ButtonText = 'signin_with' | 'signup_with' | 'continue_with';

interface Props {
  onCredential: (idToken: string) => void;
  text?: ButtonText;
  disabled?: boolean;
}

const IS_CONFIGURED = !!CLIENT_ID && !CLIENT_ID.startsWith('YOUR_');

/** True when VITE_GOOGLE_CLIENT_ID is set. Pages can use this to also hide
    their "or continue with …" divider when the Google button is hidden. */
export const isGoogleSignInConfigured = (): boolean => IS_CONFIGURED;

export default function GoogleSignInButton({ onCredential, text = 'continue_with', disabled = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(!!window.google);
  const [error, setError] = useState<string | null>(null);
  // Keep the callback behind a ref so changing it from the parent doesn't
  // re-initialize Google's SDK (which logs "initialize() called multiple times").
  const onCredentialRef = useRef(onCredential);
  useEffect(() => { onCredentialRef.current = onCredential; }, [onCredential]);

  // Load the GSI script once per session.
  useEffect(() => {
    if (!IS_CONFIGURED) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[GoogleSignInButton] VITE_GOOGLE_CLIENT_ID is not set — the Google button is hidden.');
      }
      return;
    }
    if (window.google) { setReady(true); return; }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => setReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => setReady(true);
    script.onerror = () => setError('Could not load Google Sign-In.');
    document.body.appendChild(script);
    // Deliberately do NOT remove — other mounts need the same script.
  }, []);

  // Initialize + render the button once GSI is ready and we have a container.
  useEffect(() => {
    if (!ready || !containerRef.current) return;

    try {
      window.google!.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp) => resp.credential && onCredentialRef.current(resp.credential),
        cancel_on_tap_outside: true,
      });

      // Clear any previous render (StrictMode double-invokes effects).
      containerRef.current.innerHTML = '';
      window.google!.accounts.id.renderButton(containerRef.current, {
        type:  'standard',
        theme: 'outline',
        size:  'large',
        text,
        shape: 'pill',
        logo_alignment: 'left',
        width: containerRef.current.offsetWidth || 320,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in init failed.');
    }
  }, [ready, text]);

  // No Client ID → render nothing. End-users shouldn't see developer config errors.
  if (!IS_CONFIGURED) return null;

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex min-h-[42px] w-full items-center justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      aria-busy={!ready}
    />
  );
}
