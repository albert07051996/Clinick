import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/* Drop-in replacement for a display <img> that opens a fullscreen lightbox
   on click. All <img> attributes still apply to the thumbnail; the lightbox
   shows the full-size image centered on a dark backdrop. Use everywhere a
   user-uploaded photo is shown read-only (homepage, admin lists, portal
   headers). Interactive uploaders — ImagePicker, the old ImageUpload — keep
   their own click handlers and should NOT be wrapped. */

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  /** Optional caption shown under the full-size image. */
  caption?: string;
};

export default function ZoomableImage({ caption, className, src, alt, onClick, ...rest }: Props) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the lightbox is open and listen for Escape.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!src) return null;

  return (
    <>
      <img
        src={src}
        alt={alt ?? ''}
        {...rest}
        onClick={(e) => {
          onClick?.(e);
          if (!e.defaultPrevented) setOpen(true);
        }}
        className={`${className ?? ''} cursor-zoom-in`}
      />

      {open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-stone-950/90 p-6 backdrop-blur-sm animate-fade-in"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/25"
          >
            <CloseIcon className="h-5 w-5" />
          </button>

          {/* Image: don't propagate clicks on it to the backdrop. */}
          <img
            src={src}
            alt={alt ?? ''}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] max-w-[92vw] cursor-default rounded-xl object-contain shadow-2xl"
          />

          {(caption || alt) && (
            <p className="mt-4 max-w-2xl px-4 text-center text-sm text-white/80">
              {caption ?? alt}
            </p>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
