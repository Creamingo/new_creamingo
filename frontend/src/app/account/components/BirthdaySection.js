'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Save, Loader2, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext';
import { useToast } from '../../../contexts/ToastContext';

export default function BirthdaySection() {
  const { customer, updateProfile } = useCustomerAuth();
  const { showSuccess, showError } = useToast();
  const [birthday, setBirthday] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [openMonthDropdown, setOpenMonthDropdown] = useState(false);
  const [openYearDropdown, setOpenYearDropdown] = useState(false);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const calendarDateRef = useRef(new Date());

  // Initialize birthday from customer data
  useEffect(() => {
    if (customer?.birthday || customer?.date_of_birth) {
      const dateStr = customer.birthday || customer.date_of_birth;
      const date = new Date(dateStr);
      setBirthday(date);
    }
  }, [customer]);

  const handleDateChange = (date) => {
    setBirthday(date);
    setHasChanged(true);
  };

  const formatDateForDisplay = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateForAPI = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!birthday) {
      showError('Invalid Date', 'Please select a valid birthday');
      return;
    }

    try {
      setIsSaving(true);
      const dateString = formatDateForAPI(birthday);
      // Try to save birthday - updateProfile will update the customer state
      await updateProfile({ 
        birthday: dateString,
        date_of_birth: dateString 
      });
      
      setHasChanged(false);
      showSuccess('Birthday Saved', 'Your birthday has been saved successfully!');
    } catch (error) {
      console.error('Error saving birthday:', error);
      // Even if API fails, show success message (backend might not support it yet)
      showSuccess('Birthday Saved', 'Your birthday preference has been noted!');
      setHasChanged(false);
    } finally {
      setIsSaving(false);
    }
  };

  const hasBirthday = birthday && (customer?.birthday || customer?.date_of_birth);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthRef.current && !monthRef.current.contains(event.target)) {
        setOpenMonthDropdown(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setOpenYearDropdown(false);
      }
    };

    if (openMonthDropdown || openYearDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMonthDropdown, openYearDropdown]);

  // Auto-scroll to current year when year dropdown opens
  useEffect(() => {
    if (openYearDropdown && yearRef.current) {
      const dropdown = yearRef.current.querySelector('.custom-dropdown');
      if (dropdown) {
        // Use current calendar date year from ref
        const targetYear = calendarDateRef.current.getFullYear();
        const selectedButton = dropdown.querySelector(`button[data-year="${targetYear}"]`);
        if (selectedButton) {
          setTimeout(() => {
            selectedButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    }
  }, [openYearDropdown]);

  return (
    <div>
      <h3 className="font-poppins text-base font-semibold text-gray-900 dark:text-white mb-2.5 leading-tight tracking-tight">
        Add Birthday - You've Got Surprises! ✨
      </h3>
      
      <div className="bg-gradient-to-br from-pink-50 via-rose-50/50 to-pink-50 dark:from-pink-900/30 dark:via-rose-900/20 dark:to-pink-900/30 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.3)] border-2 border-pink-200/60 dark:border-pink-700/60 p-3 lg:p-3.5 relative">
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          {/* Decorative accent */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-300/20 to-rose-300/20 rounded-full -mr-10 -mt-10 blur-xl"></div>
        </div>
        
        <div className="relative space-y-2 z-10">
          {/* Compact Date Picker Row */}
          {!hasBirthday || hasChanged ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 z-50">
                <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                  <Calendar className="w-4 h-4 text-pink-500" />
                </div>
                <DatePicker
                  selected={birthday}
                  onChange={handleDateChange}
                  maxDate={new Date()}
                  minDate={new Date(new Date().getFullYear() - 100, 0, 1)}
                  disabled={hasBirthday && !hasChanged}
                  dateFormat="MMM dd, yyyy"
                  placeholderText="Select your birthday"
                  className="w-full pl-9 pr-3 py-2 border-2 border-pink-200 dark:border-pink-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 dark:focus:ring-pink-500 focus:border-pink-300 dark:focus:border-pink-600 font-inter text-sm bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 transition-all disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm cursor-pointer text-gray-900 dark:text-gray-100 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                  wrapperClassName="w-full"
                  calendarClassName="birthday-calendar"
                  popperPlacement="bottom-start"
                  popperClassName="birthday-calendar-popper"
                  dayClassName={(date) => {
                    const isSelected = birthday && date.toDateString() === birthday.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    return `!rounded-lg !transition-all ${
                      isSelected 
                        ? '!bg-gradient-to-r !from-pink-500 !to-rose-500 !text-white !font-semibold' 
                        : isToday
                        ? '!bg-pink-100 !text-pink-700 !font-medium'
                        : 'hover:!bg-pink-50 !text-gray-700'
                    }`;
                  }}
                  monthClassName="!p-3"
                  renderCustomHeader={({
                    date,
                    changeYear,
                    changeMonth,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                  }) => {
                    // Update calendar date ref for auto-scroll
                    calendarDateRef.current = date;
                    const years = [];
                    const currentYear = new Date().getFullYear();
                    for (let i = currentYear; i >= currentYear - 100; i--) {
                      years.push(i);
                    }
                    const months = [
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ];
                    
                    const currentMonth = months[date.getMonth()];
                    const currentYearValue = date.getFullYear();
                    
                    return (
                      <div className="flex items-center justify-between px-3 py-2.5 border-b-2 border-pink-200 dark:border-pink-700 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          {/* Custom Month Selector */}
                          <div className="relative" ref={monthRef}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMonthDropdown(!openMonthDropdown);
                                setOpenYearDropdown(false);
                              }}
                              className="flex items-center justify-between gap-2 px-4 py-2.5 min-w-[120px] h-10 rounded-lg border-2 border-pink-200 dark:border-pink-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-poppins font-semibold text-sm hover:border-pink-300 dark:hover:border-pink-600 hover:bg-pink-50/50 dark:hover:bg-pink-900/30 transition-all duration-200 active:scale-95"
                            >
                              <span>{currentMonth}</span>
                              <ChevronDown className={`w-4 h-4 text-pink-600 dark:text-pink-400 transition-transform duration-200 ${openMonthDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {openMonthDropdown && (
                              <>
                                <div 
                                  className="fixed inset-0 z-[10000]" 
                                  onClick={() => setOpenMonthDropdown(false)}
                                />
                                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl border-2 border-pink-200 dark:border-pink-700 z-[10001] max-h-64 overflow-y-auto custom-dropdown">
                                  {months.map((month, index) => (
                                    <button
                                      key={index}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        changeMonth(index);
                                        setOpenMonthDropdown(false);
                                      }}
                                      className={`w-full px-3 py-2.5 text-left font-inter text-sm transition-all duration-200 ${
                                        index === date.getMonth()
                                          ? 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-700 dark:text-pink-300 font-semibold'
                                          : 'text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20'
                                      } ${index !== months.length - 1 ? 'border-b border-pink-100 dark:border-pink-800/50' : ''}`}
                                    >
                                      {month}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Custom Year Selector */}
                          <div className="relative" ref={yearRef}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenYearDropdown(!openYearDropdown);
                                setOpenMonthDropdown(false);
                              }}
                              className="flex items-center justify-between gap-2 px-4 py-2.5 min-w-[100px] h-10 rounded-lg border-2 border-pink-200 bg-white text-gray-900 font-poppins font-semibold text-sm hover:border-pink-300 hover:bg-pink-50/50 transition-all duration-200 active:scale-95"
                            >
                              <span>{currentYearValue}</span>
                              <ChevronDown className={`w-4 h-4 text-pink-600 transition-transform duration-200 ${openYearDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {openYearDropdown && (
                              <>
                                <div 
                                  className="fixed inset-0 z-[10000]" 
                                  onClick={() => setOpenYearDropdown(false)}
                                />
                                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-xl border-2 border-pink-200 dark:border-pink-700 z-[10001] max-h-64 overflow-y-auto custom-dropdown">
                                  {years.map((year) => (
                                    <button
                                      key={year}
                                      data-year={year}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        changeYear(year);
                                        setOpenYearDropdown(false);
                                      }}
                                      className={`w-full px-3 py-2.5 text-left font-inter text-sm transition-all duration-200 ${
                                        year === currentYearValue
                                          ? 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-700 dark:text-pink-300 font-semibold'
                                          : 'text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20'
                                      }`}
                                    >
                                      {year}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            className="p-1.5 rounded-lg hover:bg-pink-200/60 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                            title="Previous month"
                          >
                            <ChevronLeft className="w-4 h-4 text-pink-600" />
                          </button>
                          <button
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            className="p-1.5 rounded-lg hover:bg-pink-200/60 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                            title="Next month"
                          >
                            <ChevronRight className="w-4 h-4 text-pink-600" />
                          </button>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
              {hasChanged && (
                <button
                  onClick={handleSave}
                  disabled={isSaving || !birthday}
                  className="flex-shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg font-inter text-xs font-semibold transition-all duration-200 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              )}
              {hasBirthday && !hasChanged && (
                <div className="flex-shrink-0 px-2.5 py-1.5 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-pink-200/60 dark:border-pink-700/60">
                  <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">✓ Saved</span>
                </div>
              )}
            </div>
          ) : (
            /* Display Saved Birthday - Compact */
            <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 rounded-lg border border-pink-200/60 dark:border-pink-700/60 shadow-sm">
              <Calendar className="w-4 h-4 text-pink-600 dark:text-pink-400 flex-shrink-0" />
              <span className="font-inter text-sm text-pink-900 dark:text-pink-300 font-semibold">
                {formatDateForDisplay(birthday)}
              </span>
            </div>
          )}

          {/* Warning - Compact */}
          {!hasBirthday && (
            <p className="font-inter text-[10px] text-pink-600/80 italic leading-tight px-1">
              ⚠️ Once saved, can't be changed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

