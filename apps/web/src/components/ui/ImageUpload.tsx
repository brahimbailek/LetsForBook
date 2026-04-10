'use client';

import React, { useState, useRef, useCallback } from 'react';

function sanitizeFolderName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'salon';
}

interface ImageUploadProps {
  salonName: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  currentImage?: string | null;
  label?: string;
  aspectRatio?: 'square' | '16/9';
  className?: string;
}

export function ImageUpload({
  salonName,
  onUpload,
  onRemove,
  currentImage,
  label = 'Image',
  aspectRatio = 'square',
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass = aspectRatio === '16/9' ? 'aspect-video' : 'aspect-square';

  const folder = `salons/${sanitizeFolderName(salonName)}`;

  const handleFile = useCallback(async (file: File) => {
    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Seules les images sont acceptées');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5 Mo');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      // 1. Get signature
      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      });
      const signData = await signRes.json();

      if (!signRes.ok) {
        throw new Error(signData.error || 'Erreur de signature');
      }

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', String(signData.timestamp));
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error?.message || 'Erreur d\'upload');
      }

      onUpload(uploadData.secure_url);
      setPreview(null);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Erreur lors de l\'upload. Réessayez.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [folder, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input
    if (inputRef.current) inputRef.current.value = '';
  };

  const displayImage = preview || currentImage;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-coffee-700 mb-1.5">{label}</label>
      <div
        className={`relative ${aspectClass} w-full rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
          dragOver
            ? 'border-cream-500 bg-cream-100'
            : displayImage
            ? 'border-cream-300'
            : 'border-cream-300 hover:border-cream-400 bg-cream-50'
        }`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt={label}
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!uploading && onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                  setPreview(null);
                }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm transition-colors"
              >
                X
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-coffee-400">
            <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0l-3 3m3-3l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">Glissez ou cliquez</span>
            {uploading && (
              <div className="mt-2 w-6 h-6 border-2 border-cream-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
