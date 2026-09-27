'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2, X, ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { imageSrc } from '@/lib/media';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
  hint?: string;
}

export function ImageUpload({ value, onChange, multiple = false, hint }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const uploadFiles = async (files: File[]) => {
    const selected = files.filter((f) => f.type.startsWith('image/'));
    if (selected.length === 0) {
      setError('Please choose an image file (PNG, JPG, WEBP)');
      return;
    }
    const toUpload = multiple ? selected : selected.slice(0, 1);
    setUploading(true);
    setError('');
    try {
      const urls: string[] = [];
      for (const file of toUpload) {
        try {
          urls.push((await api.upload(file, 'minio')).url);
        } catch {
          urls.push((await api.upload(file, 'local')).url);
        }
      }
      onChange(multiple ? [...value, ...urls] : urls);
    } catch (e: any) {
      setError(e.message || 'Image upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (url: string) => onChange(value.filter((v) => v !== url));

  const canAddMore = multiple || value.length === 0;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (uploading) return;
    uploadFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        disabled={uploading}
        onChange={(e) => e.target.files && uploadFiles(Array.from(e.target.files))}
        className="hidden"
      />

      {value.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {value.map((url) => (
            <div key={url} className="relative group">
              <img
                src={imageSrc(url)}
                alt="upload preview"
                className="w-20 h-20 object-cover rounded-xl border border-divider shadow-sm"
              />
              <button
                type="button"
                onClick={() => removeAt(url)}
                title="Remove image"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full flex flex-col items-center justify-center gap-2 py-7 px-4 rounded-2xl border-2 border-dashed transition-colors duration-150 ${
            dragging
              ? 'border-primary bg-primary/10'
              : 'border-divider bg-surface-light/40 hover:border-primary-light hover:bg-primary/5'
          } ${uploading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
        >
          {uploading ? (
            <>
              <Loader2 size={26} className="text-primary-light animate-spin" />
              <span className="text-text-secondary text-sm font-medium">Uploading...</span>
            </>
          ) : (
            <>
              <span className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                <UploadCloud size={22} className="text-primary-light" />
              </span>
              <span className="text-text-primary text-sm font-semibold">
                Click to upload{multiple ? ' images' : ' an image'}
              </span>
              <span className="text-text-muted text-xs">or drag and drop · PNG, JPG, WEBP</span>
            </>
          )}
        </button>
      )}

      {hint && <p className="text-text-muted text-xs mt-2">{hint}</p>}
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
