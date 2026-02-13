'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import deliverySlotApi from '../api/deliverySlotApi';

const DAYS_TO_CHECK = 7;
const PREVIEW_LIMIT = 3;
const LIMITED_THRESHOLD = 3;
const LIMITED_PREVIEW_DAYS = 2;

const DeliverySlotPreview = ({ className = '' }) => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const getLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const [todayKey, setTodayKey] = useState(() => getLocalDateString(new Date()));

  useEffect(() => {
    const update = () => setTodayKey(getLocalDateString(new Date()));
    const id = setInterval(update, 60000);
    window.addEventListener('focus', update);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', update);
    };
  }, []);

  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateStr) => {
    const date = new Date(dateStr);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
  };

  const getDateLabel = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [ty, tm, td] = todayKey.split('-').map(Number);
    const dateOnly = new Date(y, m - 1, d);
    const todayOnly = new Date(ty, tm - 1, td);
    const diffDays = Math.round((dateOnly - todayOnly) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return formatDateForDisplay(dateStr);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isExpiredForDate = (dateStr, startTime) => {
    if (!dateStr || !startTime) return false;
    if (dateStr < todayKey) return true;
    const [y, m, d] = dateStr.split('-').map(Number);
    const [ty, tm, td] = todayKey.split('-').map(Number);
    const dateOnly = new Date(y, m - 1, d);
    const todayOnly = new Date(ty, tm - 1, td);
    if (dateOnly.getTime() !== todayOnly.getTime()) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = startTime.split(':').map(Number);
    const slotStartTime = startHour * 60 + startMin;
    return currentTime >= slotStartTime;
  };

  const getStatus = (item) => {
    if (isExpiredForDate(item.deliveryDate, item.startTime)) return 'Closed';
    if (!item.isAvailable || item.availableOrders <= 0) return 'Full';
    if (item.availableOrders <= LIMITED_THRESHOLD) return 'Limited';
    return 'Available';
  };

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        const startDate = todayKey;
        const [y, m, d] = todayKey.split('-').map(Number);
        const endDateObj = new Date(y, m - 1, d + (DAYS_TO_CHECK - 1));
        const endDate = getLocalDateString(endDateObj);

        const response = await deliverySlotApi.getSlotAvailability(startDate, endDate);
        if (response.success) {
          setAvailability(response.data || []);
        } else {
          setError('Unable to load delivery availability');
        }
      } catch (err) {
        console.error('Error loading delivery preview:', err);
        setError('Unable to load delivery availability');
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [todayKey]);

  const datesToCheck = useMemo(() => {
    const dates = [];
    const [y, m, d] = todayKey.split('-').map(Number);
    for (let i = 0; i < DAYS_TO_CHECK; i += 1) {
      const dateObj = new Date(y, m - 1, d + i);
      dates.push(getLocalDateString(dateObj));
    }
    return dates;
  }, [todayKey]);

  const availabilityByDate = useMemo(() => {
    const map = {};
    availability.forEach((item) => {
      if (!map[item.deliveryDate]) {
        map[item.deliveryDate] = [];
      }
      map[item.deliveryDate].push(item);
    });
    Object.values(map).forEach((items) => {
      items.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    });
    return map;
  }, [availability]);

  const earliestAvailable = useMemo(() => {
    for (const dateStr of datesToCheck) {
      if (dateStr < todayKey) continue;
      const items = availabilityByDate[dateStr] || [];
      for (const item of items) {
        if (
          item.deliveryDate >= todayKey &&
          item.isAvailable &&
          item.availableOrders > 0 &&
          !isExpiredForDate(item.deliveryDate, item.startTime)
        ) {
          return item;
        }
      }
    }
    return null;
  }, [availabilityByDate, datesToCheck, todayKey]);

  const nextAvailableDate = useMemo(() => {
    for (const dateStr of datesToCheck) {
      if (dateStr < todayKey) continue;
      const items = availabilityByDate[dateStr] || [];
      if (
        items.some(
          (item) =>
            item.deliveryDate >= todayKey &&
            item.isAvailable &&
            item.availableOrders > 0 &&
            !isExpiredForDate(item.deliveryDate, item.startTime)
        )
      ) {
        return dateStr;
      }
    }
    return null;
  }, [availabilityByDate, datesToCheck, todayKey]);

  const limitedFound = useMemo(() => {
    for (let i = 0; i < Math.min(LIMITED_PREVIEW_DAYS, datesToCheck.length); i += 1) {
      const dateStr = datesToCheck[i];
      if (dateStr < todayKey) continue;
      const items = availabilityByDate[dateStr] || [];
      if (
        items.some(
          (item) =>
            item.deliveryDate >= todayKey &&
            item.isAvailable &&
            item.availableOrders > 0 &&
            item.availableOrders <= LIMITED_THRESHOLD &&
            !isExpiredForDate(item.deliveryDate, item.startTime)
        )
      ) {
        return true;
      }
    }
    return false;
  }, [availabilityByDate, datesToCheck, todayKey]);

  const previewDate = nextAvailableDate || datesToCheck[0];
  const previewItems = (availabilityByDate[previewDate] || []).slice(0, PREVIEW_LIMIT);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 border-green-500 dark:border-green-400 border border-gray-200 dark:border-gray-700 shadow-md dark:shadow-xl dark:shadow-black/30 p-3 sm:p-4 ${className}`}>
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700/80 mb-3">
        <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
          <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">Delivery Time</h3>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-green-500 dark:border-green-400"></div>
          <span>Checking slots...</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-2">
          {earliestAvailable ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Clock className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getDateLabel(earliestAvailable.deliveryDate)}, {formatTime(earliestAvailable.startTime)}–{formatTime(earliestAvailable.endTime)}
                </span>
                {(() => {
                  const status = getStatus(earliestAvailable);
                  const dateLabel = getDateLabel(earliestAvailable.deliveryDate);
                  const availableLabel = dateLabel === 'Today' ? 'Today' : dateLabel === 'Tomorrow' ? 'Tomorrow' : dateLabel;
                  const limitedLabel = 'Limited';
                  const badgeConfig = {
                    Available: {
                      bg: 'bg-green-100 dark:bg-green-900/30',
                      text: 'text-green-700 dark:text-green-400',
                      label: availableLabel,
                      border: 'border-green-200 dark:border-green-800'
                    },
                    Limited: {
                      bg: 'bg-amber-100 dark:bg-amber-900/30',
                      text: 'text-amber-700 dark:text-amber-400',
                      label: limitedLabel,
                      border: 'border-amber-200 dark:border-amber-800'
                    },
                    Full: {
                      bg: 'bg-red-100 dark:bg-red-900/30',
                      text: 'text-red-700 dark:text-red-400',
                      label: 'Fully booked',
                      border: 'border-red-200 dark:border-red-800'
                    }
                  };
                  const config = badgeConfig[status] || badgeConfig.Available;
                  return (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
                      {config.label}
                    </span>
                  );
                })()}
                {earliestAvailable.availableOrders > 0 && earliestAvailable.availableOrders <= LIMITED_THRESHOLD && (
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    · {earliestAvailable.availableOrders} left
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 pl-5">
                This is the soonest we can deliver. Choose your preferred time slot during checkout.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>No slots in next {DAYS_TO_CHECK} days</span>
            </div>
          )}

          {limitedFound && previewItems.length > 0 && (
            <div className="mt-2 rounded-lg border border-amber-200/70 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-900/10 p-3">
              <div className="text-xs font-semibold text-amber-900 dark:text-amber-300 mb-2">
                Availability preview (read-only)
              </div>
              <div className="space-y-1.5">
                {previewItems.map((item) => {
                  const status = getStatus(item);
                  const badgeConfig = {
                    Available: {
                      bg: 'bg-green-100 dark:bg-green-900/30',
                      text: 'text-green-700 dark:text-green-400',
                      label: '🟢 Available',
                      border: 'border-green-200 dark:border-green-800'
                    },
                    Limited: {
                      bg: 'bg-amber-100 dark:bg-amber-900/30',
                      text: 'text-amber-700 dark:text-amber-400',
                      label: '🟡 Limited',
                      border: 'border-amber-200 dark:border-amber-800'
                    },
                    Full: {
                      bg: 'bg-red-100 dark:bg-red-900/30',
                      text: 'text-red-700 dark:text-red-400',
                      label: '🔴 Full',
                      border: 'border-red-200 dark:border-red-800'
                    },
                    Closed: {
                      bg: 'bg-gray-100 dark:bg-gray-700/50',
                      text: 'text-gray-500 dark:text-gray-400',
                      label: 'Closed',
                      border: 'border-gray-200 dark:border-gray-600'
                    }
                  };
                  const config = badgeConfig[status] || badgeConfig.Available;
                  return (
                    <div key={`${item.deliveryDate}-${item.slotId}`} className="flex items-center justify-between text-xs gap-2">
                      <span className="text-gray-700 dark:text-gray-300 flex-1">
                        {getDateLabel(item.deliveryDate)} • {formatTime(item.startTime)} - {formatTime(item.endTime)}
                        {item.availableOrders > 0 && item.availableOrders <= LIMITED_THRESHOLD && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">
                            ({item.availableOrders} left)
                          </span>
                        )}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
                        {config.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliverySlotPreview;
