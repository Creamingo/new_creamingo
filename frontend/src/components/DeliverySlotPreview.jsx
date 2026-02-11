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

  const today = useMemo(() => new Date(), []);

  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateStr) => {
    const date = new Date(dateStr);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
  };

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
    const date = new Date(dateStr);
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (dateOnly.getTime() !== todayOnly.getTime()) {
      return false;
    }

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
        const startDate = formatDateForAPI(today);
        const endDateObj = new Date(today);
        endDateObj.setDate(today.getDate() + (DAYS_TO_CHECK - 1));
        const endDate = formatDateForAPI(endDateObj);

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
  }, [today]);

  const datesToCheck = useMemo(() => {
    const dates = [];
    for (let i = 0; i < DAYS_TO_CHECK; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(formatDateForAPI(d));
    }
    return dates;
  }, [today]);

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
      const items = availabilityByDate[dateStr] || [];
      for (const item of items) {
        if (
          item.isAvailable &&
          item.availableOrders > 0 &&
          !isExpiredForDate(item.deliveryDate, item.startTime)
        ) {
          return item;
        }
      }
    }
    return null;
  }, [availabilityByDate, datesToCheck]);

  const nextAvailableDate = useMemo(() => {
    for (const dateStr of datesToCheck) {
      const items = availabilityByDate[dateStr] || [];
      if (
        items.some(
          (item) =>
            item.isAvailable &&
            item.availableOrders > 0 &&
            !isExpiredForDate(item.deliveryDate, item.startTime)
        )
      ) {
        return dateStr;
      }
    }
    return null;
  }, [availabilityByDate, datesToCheck]);

  const limitedFound = useMemo(() => {
    for (let i = 0; i < Math.min(LIMITED_PREVIEW_DAYS, datesToCheck.length); i += 1) {
      const dateStr = datesToCheck[i];
      const items = availabilityByDate[dateStr] || [];
      if (
        items.some(
          (item) =>
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
  }, [availabilityByDate, datesToCheck]);

  const previewDate = nextAvailableDate || datesToCheck[0];
  const previewItems = (availabilityByDate[previewDate] || []).slice(0, PREVIEW_LIMIT);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 border-green-500 dark:border-green-400 border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-xl dark:shadow-black/30 p-3 sm:p-4 lg:p-5 ${className}`}>
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-gray-700 mb-4">
        <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
          <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">Delivery Time</h3>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 dark:border-green-400"></div>
          <span>Checking available slots...</span>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              {earliestAvailable ? (
                <span>
                  Earliest slot: {getDateLabel(earliestAvailable.deliveryDate)} •{' '}
                  {formatTime(earliestAvailable.startTime)} - {formatTime(earliestAvailable.endTime)}
                </span>
              ) : (
                <span>No slots available in the next {DAYS_TO_CHECK} days</span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Next available date: {nextAvailableDate ? getDateLabel(nextAvailableDate) : '—'}
            </div>
          </div>

          <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            Select your time slot at checkout.
          </div>

          {limitedFound && previewItems.length > 0 && (
            <div className="mt-2 rounded-lg border border-amber-200/70 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-900/10 p-3">
              <div className="text-xs font-semibold text-amber-900 dark:text-amber-300 mb-2">
                Availability preview (read-only)
              </div>
              <div className="space-y-1.5">
                {previewItems.map((item) => {
                  const status = getStatus(item);
                  const statusColor =
                    status === 'Limited'
                      ? 'text-amber-700 dark:text-amber-300'
                      : status === 'Available'
                        ? 'text-green-700 dark:text-green-300'
                        : 'text-gray-500 dark:text-gray-400';
                  return (
                    <div key={`${item.deliveryDate}-${item.slotId}`} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 dark:text-gray-300">
                        {getDateLabel(item.deliveryDate)} • {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </span>
                      <span className={`font-semibold ${statusColor}`}>{status}</span>
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
