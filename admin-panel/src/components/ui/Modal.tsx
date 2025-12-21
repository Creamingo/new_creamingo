import React, { useEffect, Children, isValidElement } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'large-height' | 'wide' | 'large';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'w-[90vw] max-w-none',
    'large-height': 'w-[70vw] max-w-4xl',
    wide: 'w-[98vw] md:w-[80vw] max-w-none',
    large: 'w-[80vw] h-[80vh] max-w-none'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div
          className={cn(
            'relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg transform transition-all flex flex-col',
            size === 'large' ? 'max-h-[80vh]' : 'max-h-[90vh]',
            sizeClasses[size]
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 rounded-t-2xl">
              {title && (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
              )}
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}
          
          {/* Content wrapper */}
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable content area */}
            <div className="px-6 py-5 overflow-y-auto flex-1">
              {Children.map(children, (child) => {
                // Don't render ModalFooter in scrollable area
                if (isValidElement(child) && (child.type as any)?.displayName === 'ModalFooter') {
                  return null;
                }
                return child;
              })}
            </div>
            {/* Footer - rendered outside scrollable area */}
            {Children.toArray(children).find(
              (child) => isValidElement(child) && (child.type as any)?.displayName === 'ModalFooter'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const ModalFooterComponent: React.FC<ModalFooterProps> = ({ children, className }) => {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 flex items-center justify-end gap-3 pt-3 pb-4 px-5 border-t border-gray-200 dark:border-gray-700 flex-shrink-0',
      'shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1),0_-2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]',
      className
    )}>
      {children}
    </div>
  );
};

ModalFooterComponent.displayName = 'ModalFooter';

export const ModalFooter = ModalFooterComponent;
