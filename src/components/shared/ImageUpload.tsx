import { useRef, useState } from 'react';
import { filesService } from '../../services/api/filesService';
import { formatMoney } from '../../utils/money';

interface ImageUploadProps {
  onUploadSuccess?: (url: string, publicId: string) => void;
  onError?: (error: string) => void;
  folder?: string;
  lang: Lang; // Add lang prop
}

export default function ImageUpload({
  onUploadSuccess,
  onError,
  folder = 'profiles',
  lang, // Use lang prop
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setProgress(0);
    try {
      const result = await filesService.uploadImage(file, {
        folder,
        onProgress: (p) => setProgress(p),
      });
      if (result.success && result.secureUrl && result.publicId) {
        onUploadSuccess?.(result.secureUrl, result.publicId);
      } else {
        onError?.(result.error || 'Upload failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      onError?.(msg);
    } finally {
      setUploading(false);
    }
  };

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const maxMb = (filesService.limits.maxBytes / 1024 / 1024).toFixed(0);

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={filesService.limits.imageTypes.join(',')}
        onChange={onSelect}
        className="hidden"
      />

      <div
        onClick={pickFile}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver
            ? 'border-rose-500 bg-rose-50'
            : 'border-stone-300 bg-white hover:border-rose-400 hover:bg-rose-50/40'
        }`}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-amber-300 text-white shadow-md">
          <UploadIcon className="h-6 w-6" />
        </div>
        <p className="font-semibold text-stone-800">Click to upload or drag &amp; drop</p>
        <p className="mt-1 text-sm text-stone-500">
          JPEG, PNG, GIF, WebP · max {maxMb}&nbsp;MB
        </p>
      </div>

      {preview && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <img src={preview} alt="Preview" className="h-auto w-full" />
        </div>
      )}

      {uploading && (
        <div className="mt-5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-center text-sm text-stone-600">
            Uploading… {progress}%
          </p>
        </div>
      )}
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
