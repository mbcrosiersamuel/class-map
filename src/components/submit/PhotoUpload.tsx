import { useState, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB pre-compression cap; defense in depth.

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
  existingUrl?: string | null;
}

export default function PhotoUpload({ onPhotoSelect, existingUrl }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    if (!ALLOWED_MIME.includes(file.type) && !file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP, etc).');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('That photo is too large. Please pick one under 10 MB.');
      return;
    }
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 400,
        useWebWorker: true,
      });
      const url = URL.createObjectURL(compressed);
      setPreview(url);
      onPhotoSelect(compressed);
    } catch {
      setError('Could not process that photo. Try a different one.');
    }
  }, [onPhotoSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`w-32 h-32 rounded-lg border-2 border-dashed cursor-pointer flex items-center justify-center overflow-hidden transition-colors ${
          dragging ? 'border-primary bg-red-50' : 'border-gray-300 bg-surface hover:border-primary'
        }`}
      >
        {preview ? (
          <img src={preview} alt="Preview" width={128} height={128} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-2">
            <span className="text-2xl text-gray-400">📷</span>
            <p className="text-xs text-gray-400 font-sans mt-1">Add photo</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 font-sans text-center max-w-[160px]">{error}</p>
      )}
    </div>
  );
}
