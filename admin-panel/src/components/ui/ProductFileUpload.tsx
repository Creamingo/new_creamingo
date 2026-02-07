import React, { useCallback, useState } from 'react';
import uploadService from '../../services/uploadService';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onUploadComplete: (urls: string[]) => void;
  onUploadError: (error: string) => void;
  multiple?: boolean;
  accept?: string;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
  uploadType?: string;
}

export const ProductFileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  onUploadComplete,
  onUploadError,
  multiple = true,
  accept = 'image/*,video/*',
  maxFiles = 10,
  className = '',
  disabled = false,
  uploadType = 'products'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = uploadService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      onUploadError(errors.join('\n'));
    }

    if (validFiles.length === 0) return;

    // Limit number of files
    const filesToProcess = validFiles.slice(0, maxFiles);
    if (validFiles.length > maxFiles) {
      onUploadError(`Only ${maxFiles} files can be uploaded at once. ${validFiles.length - maxFiles} files were ignored.`);
    }

    onFilesSelected(filesToProcess);

    // Upload files
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = filesToProcess.map(async (file, index) => {
        const response = await uploadService.uploadSingle(file, uploadType);
        setUploadProgress(((index + 1) / filesToProcess.length) * 100);
        return response.data?.url || '';
      });

      const urls = await Promise.all(uploadPromises);
      onUploadComplete(urls);
    } catch (error) {
      console.error('Upload error:', error);
      onUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [maxFiles, onFilesSelected, onUploadComplete, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [disabled, handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const files = Array.from(e.target.files || []);
    handleFiles(files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [disabled, handleFiles]);

  return (
    <div className={`w-full ${className}`}>
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
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {isUploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto">
              <svg className="animate-spin w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Uploading... {Math.round(uploadProgress)}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
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
              Images and videos up to 10MB each
            </div>
            {multiple && (
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Maximum {maxFiles} files
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};