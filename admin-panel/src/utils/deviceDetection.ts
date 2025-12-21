// Device detection utility for responsive category limits
import React from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  maxCategories: number;
}

/**
 * Detect device type based on screen width
 */
export const detectDeviceType = (): DeviceType => {
  if (typeof window === 'undefined') {
    return 'desktop'; // Default for SSR
  }

  const width = window.innerWidth;
  
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * Get device information including category limits
 */
export const getDeviceInfo = (): DeviceInfo => {
  const type = detectDeviceType();
  
  return {
    type,
    isMobile: type === 'mobile',
    isTablet: type === 'tablet',
    isDesktop: type === 'desktop',
    maxCategories: getMaxCategoriesForDevice(type)
  };
};

/**
 * Get maximum categories allowed for a device type
 */
export const getMaxCategoriesForDevice = (deviceType: DeviceType): number => {
  switch (deviceType) {
    case 'mobile':
      return 6;
    case 'tablet':
      return 6; // Same as mobile for tablets
    case 'desktop':
      return 7;
    default:
      return 7;
  }
};

/**
 * Hook to get device info with window resize listener
 */
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>(() => getDeviceInfo());

  React.useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
};

