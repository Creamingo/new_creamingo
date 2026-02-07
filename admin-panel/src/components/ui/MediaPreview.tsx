import React from 'react';
import { resolveImageUrl } from '../../utils/imageUrl';

interface MediaPreviewProps {
  url: string;
  type: 'image' | 'video';
  alt?: string;
  className?: string;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
  url,
  type,
  alt = 'Media preview',
  className = '',
  onRemove,
  showRemoveButton = true
}) => {
  const getFileType = (url: string): 'image' | 'video' => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov'];
    const extension = url.toLowerCase().substring(url.lastIndexOf('.'));
    return videoExtensions.includes(extension) ? 'video' : 'image';
  };

  const resolvedUrl = resolveImageUrl(url);
  const actualType = type || getFileType(resolvedUrl);

  return (
    <div className={`relative group ${className}`}>
      {actualType === 'image' ? (
        <img
          src={resolvedUrl}
          alt={alt}
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            // Fallback to a placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+';
          }}
        />
      ) : (
        <video
          src={resolvedUrl}
          className="w-full h-full object-cover rounded-lg"
          controls
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      )}

      {showRemoveButton && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
          title="Remove"
        >
          ×
        </button>
      )}

      {/* File type indicator */}
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {actualType === 'video' ? (
          <div className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            Video
          </div>
        ) : (
          <div className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            Image
          </div>
        )}
      </div>
    </div>
  );
};
