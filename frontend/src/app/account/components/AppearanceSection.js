'use client';

import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

export default function AppearanceSection() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const appearanceOptions = [
    { value: 'light', label: 'Light Mode', icon: Sun },
    { value: 'dark', label: 'Dark Mode', icon: Moon },
    { value: 'auto', label: 'Auto (System Default)', icon: Monitor }
  ];

  // Use resolvedTheme for display icon, but theme for the actual selection
  const displayOption = appearanceOptions.find(opt => opt.value === resolvedTheme) || appearanceOptions.find(opt => opt.value === theme) || appearanceOptions[2];
  const DisplayIcon = displayOption.icon;
  
  const currentOption = appearanceOptions.find(opt => opt.value === theme) || appearanceOptions[2];

  const handleSelect = (value) => {
    setTheme(value);
    setIsOpen(false);
  };

  return (
    <div>
      <div className="relative">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.3)] border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
          {/* Heading inside box */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-200/60 dark:border-gray-700/60">
            <h3 className="font-poppins text-base font-semibold text-gray-900 dark:text-white leading-tight tracking-tight">
              APP Mode Appearance
            </h3>
          </div>
          {/* Main Dropdown Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="w-full flex items-center gap-3 px-4 py-4 lg:py-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 active:bg-gray-100 dark:active:bg-gray-700"
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <DisplayIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={2} />
            </div>
            
            {/* Label */}
            <span className="flex-1 text-left font-inter text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
              {currentOption.label}
            </span>
            
            {/* Dropdown Arrow */}
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </div>

        {/* Dropdown Options */}
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[100]" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700 z-[101] overflow-hidden">
              {appearanceOptions.map((option, index) => {
                const OptionIcon = option.icon;
                const isSelected = option.value === theme;
                const isLast = index === appearanceOptions.length - 1;
                return (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option.value);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-4 lg:py-5 transition-colors duration-200 relative ${
                      isSelected 
                        ? 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {/* Separator Line */}
                    {!isLast && (
                      <div className="absolute bottom-0 left-4 right-4 h-px bg-gray-200 dark:bg-gray-700" />
                    )}
                    
                    {/* Icon */}
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      <OptionIcon className={`w-5 h-5 ${isSelected ? 'text-pink-700 dark:text-pink-400' : 'text-gray-700 dark:text-gray-300'}`} strokeWidth={2} />
                    </div>
                    
                    {/* Label */}
                    <span className={`flex-1 text-left font-inter text-sm font-medium leading-relaxed ${
                      isSelected ? 'text-pink-900 dark:text-pink-300' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {option.label}
                    </span>
                    
                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-pink-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

