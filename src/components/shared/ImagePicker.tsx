import { useRef, useState } from 'react';
import { filesService } from '../../services/api/filesService';
import ZoomableImage from './ZoomableImage';

/* Edit-aware single-image picker. Shows the current image when `value` is set,
   with Replace / Remove buttons; otherwise shows the drop zone. Uploads go
   through filesService (Cloudinary) and emit the resulting secure URL and
   publicId via `onChange`. Pair with any field that holds a photo (doctor,
   patient, procedure, …). */

interface Props {
  /** Current image URL (edit mode) — null/undefined shows the empty drop zone. */
  value?: string | null;
  /** Called when the image is replaced (uploaded) or removed (nulls). */
  onChange: (url: string | null, publicId: string | null) => void;
  /** Cloudinary folder, e.g. "doctors", "patients", "procedures". */
  folder: string;
  /** Visual height of the preview area, px. Default 160. */
  previewHeight?: number;
  disabled?: boolean;
  className?: string;
  /** Optional labels (fall back to English). */
  labels?: {
    uploadCta?:  string;    // "Click to upload or drag & drop"
    hint?:       string;    // "JPEG, PNG, WebP · max 5 MB"
    replace?:    string;
    remove?:     string;
    uploading?:  string;    // suffix shown after percent
    failed?:     string;
  };
}

const DEFAULTS = {
  uploadCta: 'Click to upload or drag & drop',
  hint:      'JPEG, PNG, GIF, WebP',
  replace:   'Replace',
  remove:    'Remove',
  uploading: 'Uploading',
  failed:    'Upload failed',
};

export default function ImagePicker({
  value, onChange, folder, previewHeight = 160, disabled, className, labels,
}: Props) {
  const l = { ...DEFAULTS, ...labels };
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [dragOver, setDragOver]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const pick = () => { if (!disabled && !uploading) inputRef.current?.click(); };

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      const res = await filesService.uploadImage(file, {
        folder,
        onProgress: (p) => setProgress(p),
      });
      if (res.success && res.secureUrl && res.publicId) {
        onChange(res.secureUrl, res.publicId);
      } else {
        setError(res.error || l.failed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : l.failed);
    } finally {
      setUploading(false);
    }
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handleFile(f);
    e.target.value = '';   // allow re-selecting the same file
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) void handleFile(f);
  };

  const maxMb = (filesService.limits.maxBytes / 1024 / 1024).toFixed(0);

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={filesService.limits.imageTypes.join(',')}
        onChange={onSelect}
        className="hidden"
      />

      {value ? (
        /* Existing image — click image to zoom; action buttons below replace/remove. */
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 shadow-sm">
          <ZoomableImage
            src={value}
            alt=""
            style={{ height: previewHeight }}
            className="w-full object-cover"
          />
          {uploading && <ProgressBar percent={progress} />}
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
            <button type="button" disabled={disabled || uploading} onClick={pick}
              className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-stone-800 shadow-sm hover:bg-white disabled:opacity-60">
              ↻ {l.replace}
            </button>
            <button type="button" disabled={disabled || uploading} onClick={() => onChange(null, null)}
              className="rounded-full bg-rose-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60">
              ✕ {l.remove}
            </button>
          </div>
        </div>
      ) : (
        /* Empty — drop zone. */
        <div
          role="button"
          tabIndex={0}
          aria-disabled={disabled}
          onClick={pick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pick(); }}
          onDragOver={(e) => { if (!disabled) { e.preventDefault(); setDragOver(true); } }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{ minHeight: previewHeight }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
            disabled ? 'cursor-not-allowed opacity-60 border-stone-200 bg-stone-50' :
            dragOver ? 'border-rose-500 bg-rose-50' :
            'border-stone-300 bg-white hover:border-rose-400 hover:bg-rose-50/40'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-amber-300 text-white shadow-md">
            <UploadIcon className="h-5 w-5" />
          </div>
          <p className="mt-2 text-sm font-semibold text-stone-800">{l.uploadCta}</p>
          <p className="mt-0.5 text-xs text-stone-500">{l.hint} · max {maxMb}&nbsp;MB</p>
          {uploading && <ProgressBar percent={progress} className="mt-3 w-full max-w-xs" />}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-rose-700">{error}</p>}
    </div>
  );
}

function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={className ?? 'absolute inset-x-0 bottom-0'}>
      <div className="h-1.5 w-full overflow-hidden bg-black/20">
        <div className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all"
             style={{ width: `${Math.max(5, percent)}%` }} />
      </div>
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}
