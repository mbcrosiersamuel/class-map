import { useState, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

interface PhotoUploadProps {
  onPhotoSelect: (file: File) => void;
  existingUrl?: string | null;
}

export default function PhotoUpload({ onPhotoSelect, existingUrl }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    const compressed = await imageCompression(file, {
      maxWidthOrHeight: 400,
      useWebWorker: true,
    });
    const url = URL.createObjectURL(compressed);
    setPreview(url);
    onPhotoSelect(compressed);
  }, [onPhotoSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) processFile(file);
  }, [processFile]);

  return (
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
        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
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
  );
}
