import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface MultiSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: (string | number)[];
  onChange: (selected: (string | number)[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxHeight?: string;
  searchable?: boolean;
  clearable?: boolean;
  error?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  disabled = false,
  className,
  maxHeight = "200px",
  searchable = true,
  clearable = true,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle option selection
  const handleOptionClick = (option: MultiSelectOption) => {
    if (option.disabled) return;

    const newSelected = selected.includes(option.value)
      ? selected.filter(item => item !== option.value)
      : [...selected, option.value];

    onChange(newSelected);
  };

  // Handle clear all
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  // Handle remove individual item
  const handleRemove = (value: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== value));
  };

  // Get selected options for display
  const selectedOptions = options.filter(option => selected.includes(option.value));

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 border rounded-md cursor-pointer transition-colors",
          "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
          "hover:border-gray-400 dark:hover:border-gray-500",
          "focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700",
          error && "border-red-500 focus-within:ring-red-500 focus-within:border-red-500"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-h-[20px]">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {placeholder}
            </span>
          ) : (
            selectedOptions.map(option => (
              <span
                key={option.value}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md"
              >
                {option.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(option.value, e)}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          {clearable && selected.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-gray-500 transition-transform",
              isOpen && "rotate-180"
            )} 
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg",
            "max-h-60 overflow-hidden"
          )}
          style={{ maxHeight }}
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-gray-700",
                    selected.includes(option.value) && "bg-blue-50 dark:bg-blue-900/20",
                    option.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleOptionClick(option)}
                >
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {option.label}
                  </span>
                  {selected.includes(option.value) && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
