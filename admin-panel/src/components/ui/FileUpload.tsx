import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Button } from './Button';

interface FileUploadProps {
  label: string;
  accept: string;
  maxSize: number;
  onFileSelect: (files: File[]) => void;
  onFileRemove: (file: File) => void;
  files: File[];
  helperText?: string;
  className?: string;
  disabled?: boolean;
  /** When editing, show this image above the upload box so preview is visible without scrolling */
  existingImageUrl?: string;
}

const isImageAccept = (accept: string) => /image\/\*|image\//i.test(accept);

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept,
  maxSize,
  onFileSelect,
  onFileRemove,
  files,
  helperText,
  className = '',
  disabled = false,
  existingImageUrl
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Create object URLs for image previews (same order as files); revoke on cleanup or when files change
  useEffect(() => {
    if (!isImageAccept(accept) || files.length === 0) {
      setPreviewUrls((prev) => {
        prev.forEach((url) => url && URL.revokeObjectURL(url));
        return [];
      });
      return;
    }
    const urls = files.map((f) =>
      f.type.startsWith('image/') ? URL.createObjectURL(f) : ''
    );
    setPreviewUrls((prev) => {
      prev.forEach((url) => url && URL.revokeObjectURL(url));
      return urls;
    });
    return () => {
      urls.forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [accept, files]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    onFileSelect(droppedFiles);
  }, [disabled, onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const selectedFiles = Array.from(e.target.files || []);
    onFileSelect(selectedFiles);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [disabled, onFileSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const showImagePreviews = isImageAccept(accept) && (existingImageUrl || files.length > 0);

  return (
    <div className={`w-full ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>

      {/* Preview above upload box so it's visible without scrolling */}
      {showImagePreviews && (
        <div className="mb-4 space-y-3">
          {existingImageUrl && files.length === 0 && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <img
                src={existingImageUrl}
                alt="Current"
                className="w-20 h-20 object-cover rounded border border-gray-200 dark:border-gray-600"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 pt-2">Current image</span>
            </div>
          )}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex flex-col items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  {previewUrls[index] ? (
                    <img
                      src={previewUrls[index]}
                      alt={file.name}
                      className="w-20 h-20 object-cover rounded border border-gray-200 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">Preview</span>
                    </div>
                  )}
                  <p className="text-xs font-medium text-gray-900 dark:text-white mt-1 truncate max-w-[120px]">{file.name}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemove(file);
                    }}
                    className="mt-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
          ref={inputRef}
        />

        <div className="space-y-3">
          <div className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-blue-600 dark:text-blue-400">
              Click to upload
            </span>
            {' '}or drag and drop
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Max file size: {formatFileSize(maxSize * 1024 * 1024)}
          </div>
          {helperText && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {helperText}
            </div>
          )}
        </div>
      </div>

      {files.length > 0 && !isImageAccept(accept) && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onFileRemove(file)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
