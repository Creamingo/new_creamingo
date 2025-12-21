import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  value: string; // Format: "HH:MM:SS"
  onChange: (time: string) => void;
  label?: string;
  error?: string;
  className?: string;
  compact?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({ 
  value, 
  onChange, 
  label, 
  error, 
  className = '',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState(9);
  const [minutes, setMinutes] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      const hour24 = h || 9;
      const min = m || 0;
      
      setHours(hour24);
      setMinutes(min);
      setPeriod(hour24 >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
  };

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
    setPeriod(newHours >= 12 ? 'PM' : 'AM');
    onChange(formatTime(newHours, newMinutes));
  };

  const getDisplayHour = () => {
    let displayHour = hours % 12;
    if (displayHour === 0) displayHour = 12;
    return displayHour;
  };

  const getDisplayValue = () => {
    return `${getDisplayHour().toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const incrementHour = () => {
    const newHour = (hours + 1) % 24;
    handleTimeChange(newHour, minutes);
  };

  const decrementHour = () => {
    const newHour = hours === 0 ? 23 : hours - 1;
    handleTimeChange(newHour, minutes);
  };

  const incrementMinute = () => {
    const newMinute = (minutes + 15) % 60;
    handleTimeChange(hours, newMinute);
  };

  const decrementMinute = () => {
    const newMinute = minutes < 15 ? 45 : minutes - 15;
    handleTimeChange(hours, newMinute);
  };

  const togglePeriod = () => {
    const newHour = period === 'AM' ? hours + 12 : hours - 12;
    handleTimeChange(newHour, minutes);
  };


  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full px-3 py-2 text-left border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${isOpen ? 'ring-2 ring-orange-500 border-orange-500' : ''}
            hover:border-gray-400 transition-colors duration-200
            ${compact ? 'py-2' : 'py-3'}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <span className="text-lg font-mono">
                {getDisplayValue()}
              </span>
              <span className="text-sm text-gray-500 font-medium">
                {period}
              </span>
            </div>
            <div className="text-gray-400">
              {isOpen ? '▲' : '▼'}
            </div>
          </div>
        </button>

        {isOpen && (
          <div 
            ref={pickerRef}
            className={`absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 ${compact ? 'w-64' : 'w-72'}`}
          >
            {/* Time Selector */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              {/* Hours */}
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Hour</div>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={incrementHour}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  </button>
                  <div className="text-2xl font-mono font-bold text-gray-800 my-2 min-w-[2rem]">
                    {getDisplayHour()}
                  </div>
                  <button
                    type="button"
                    onClick={decrementHour}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Separator */}
              <div className="text-2xl font-mono font-bold text-gray-800">:</div>

              {/* Minutes */}
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Min</div>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={incrementMinute}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ChevronUp className="h-4 w-4 text-gray-600" />
                  </button>
                  <div className="text-2xl font-mono font-bold text-gray-800 my-2 min-w-[2rem]">
                    {minutes.toString().padStart(2, '0')}
                  </div>
                  <button
                    type="button"
                    onClick={decrementMinute}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* AM/PM */}
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Period</div>
                <button
                  type="button"
                  onClick={togglePeriod}
                  className="px-3 py-2 bg-orange-100 text-orange-600 rounded-lg font-medium hover:bg-orange-200 transition-colors"
                >
                  {period}
                </button>
              </div>
            </div>

            {/* Quick Time Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: '9:00 AM', h: 9, m: 0 },
                { label: '12:00 PM', h: 12, m: 0 },
                { label: '3:00 PM', h: 15, m: 0 },
                { label: '6:00 PM', h: 18, m: 0 },
                { label: '9:00 PM', h: 21, m: 0 },
                { label: '12:00 AM', h: 0, m: 0 },
              ].map((time) => (
                <button
                  key={time.label}
                  type="button"
                  onClick={() => handleTimeChange(time.h, time.m)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-orange-100 hover:text-orange-600 rounded transition-colors"
                >
                  {time.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default TimePicker;
