import React, { useState, useEffect, useCallback } from 'react';
import { Save, Globe, MapPin, CreditCard, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { FileUpload } from '../components/ui/FileUpload';
import { settingsService } from '../services/settingsService';
import { useToastContext } from '../contexts/ToastContext';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Creamingo',
    siteDescription: 'Delicious cakes for every occasion',
    siteLogo: null as File | null,
    contactEmail: 'info@creamingo.com',
    contactPhone: '+1 (555) 123-4567',
    
    // Delivery Settings
    deliveryAreas: ['Downtown', 'Uptown', 'Midtown', 'Suburbs'],
    deliveryFee: 5.99,
    freeDeliveryThreshold: 50.00,
    deliveryTime: '2-4 hours',
    
    // Payment Settings
    acceptCard: true,
    acceptUPI: true,
    acceptWallet: true,
    acceptCash: true,
    
    // Business Hours
    mondayOpen: '09:00',
    mondayClose: '21:00',
    tuesdayOpen: '09:00',
    tuesdayClose: '21:00',
    wednesdayOpen: '09:00',
    wednesdayClose: '21:00',
    thursdayOpen: '09:00',
    thursdayClose: '21:00',
    fridayOpen: '09:00',
    fridayClose: '21:00',
    saturdayOpen: '09:00',
    saturdayClose: '21:00',
    sundayOpen: '10:00',
    sundayClose: '20:00',
    
    // Footer Settings
    footerText: '© 2024 Creamingo. All rights reserved.',
    socialFacebook: 'https://facebook.com/creamingo',
    socialInstagram: 'https://instagram.com/creamingo',
    socialTwitter: 'https://twitter.com/creamingo'
  });

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [changeCount, setChangeCount] = useState(0);
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  const { showError, showSuccess } = useToastContext();

  // Convert time string to "09:00" format (handles both 12-hour and 24-hour formats)
  const convertTo24Hour = useCallback((timeStr: string) => {
    // If it's already in 24-hour format (e.g., "09:00"), return as is
    if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
    
    // If it's in 12-hour format (e.g., "9:00 AM"), convert to 24-hour
    const [time, period] = timeStr.split(' ');
    if (!time || !period) {
      return '09:00'; // Default fallback
    }
    
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  }, []);

  // Parse business hours from various formats to "09:00" format
  const parseBusinessHours = useCallback((hoursString: string) => {
    if (!hoursString || !hoursString.includes(' - ')) {
      return { open: '09:00', close: '21:00' };
    }
    
    const [openStr, closeStr] = hoursString.split(' - ');
    return {
      open: convertTo24Hour(openStr.trim()),
      close: convertTo24Hour(closeStr.trim())
    };
  }, [convertTo24Hour]);

  // Load settings from API
  const loadSettings = useCallback(async () => {
    try {
      setInitialLoading(true);
      const response = await settingsService.getSettings();
      console.log('Settings API response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to load settings');
      }
      
      if (!response.data) {
        throw new Error('No settings data received');
      }
      
      const apiSettings = settingsService.transformSettingsForUI(response.data.settings);
      
      // Transform API data to UI format
      const uiSettings = {
        siteName: apiSettings.site_name,
        siteDescription: apiSettings.site_description,
        contactEmail: apiSettings.contact_email,
        contactPhone: apiSettings.contact_phone,
        deliveryAreas: apiSettings.delivery_areas,
        deliveryFee: apiSettings.delivery_fee,
        freeDeliveryThreshold: apiSettings.free_delivery_threshold,
        deliveryTime: apiSettings.delivery_time,
        footerText: apiSettings.footer_text,
        socialFacebook: apiSettings.social_links.facebook,
        socialInstagram: apiSettings.social_links.instagram,
        socialTwitter: apiSettings.social_links.twitter,
        
        // Payment methods
        acceptCard: apiSettings.payment_methods.includes('card'),
        acceptUPI: apiSettings.payment_methods.includes('upi'),
        acceptWallet: apiSettings.payment_methods.includes('wallet'),
        acceptCash: apiSettings.payment_methods.includes('cash'),
        
        // Business hours - parse from string format
        mondayOpen: parseBusinessHours(apiSettings.business_hours.monday).open,
        mondayClose: parseBusinessHours(apiSettings.business_hours.monday).close,
        tuesdayOpen: parseBusinessHours(apiSettings.business_hours.tuesday).open,
        tuesdayClose: parseBusinessHours(apiSettings.business_hours.tuesday).close,
        wednesdayOpen: parseBusinessHours(apiSettings.business_hours.wednesday).open,
        wednesdayClose: parseBusinessHours(apiSettings.business_hours.wednesday).close,
        thursdayOpen: parseBusinessHours(apiSettings.business_hours.thursday).open,
        thursdayClose: parseBusinessHours(apiSettings.business_hours.thursday).close,
        fridayOpen: parseBusinessHours(apiSettings.business_hours.friday).open,
        fridayClose: parseBusinessHours(apiSettings.business_hours.friday).close,
        saturdayOpen: parseBusinessHours(apiSettings.business_hours.saturday).open,
        saturdayClose: parseBusinessHours(apiSettings.business_hours.saturday).close,
        sundayOpen: parseBusinessHours(apiSettings.business_hours.sunday).open,
        sundayClose: parseBusinessHours(apiSettings.business_hours.sunday).close,
        
        siteLogo: null as File | null
      };
      
      setSettings(uiSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      showError('Failed to load settings');
    } finally {
      setInitialLoading(false);
    }
  }, [showError, parseBusinessHours]);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
    setChangeCount(prev => prev + 1);
    setChangedFields(prev => new Set(Array.from(prev).concat(field)));
  };

  const handleFileSelect = (files: File[]) => {
    setUploadedFiles(files);
    if (files.length > 0) {
      setSettings(prev => ({
        ...prev,
        siteLogo: files[0]
      }));
      setHasUnsavedChanges(true);
      setChangeCount(prev => prev + 1);
      setChangedFields(prev => new Set(Array.from(prev).concat('siteLogo')));
    }
  };

  const handleFileRemove = (file: File) => {
    setUploadedFiles(uploadedFiles.filter(f => f !== file));
    setSettings(prev => ({
      ...prev,
      siteLogo: null
    }));
    setHasUnsavedChanges(true);
    setChangeCount(prev => prev + 1);
    setChangedFields(prev => new Set(Array.from(prev).concat('siteLogo')));
  };

  // Helper function to check if a field has been changed
  const isFieldChanged = (field: string) => {
    return changedFields.has(field);
  };

  const handleResetChanges = () => {
    // Reload settings from API to reset all changes
    loadSettings();
    setHasUnsavedChanges(false);
    setChangeCount(0);
    setChangedFields(new Set());
    setUploadedFiles([]);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Transform UI data to API format
      const apiData = settingsService.transformUIForAPI(settings);
      
      // Save settings via API
      await settingsService.updateSettings(apiData);
      
      setHasUnsavedChanges(false);
      setChangeCount(0);
      setChangedFields(new Set());
      showSuccess('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="w-full px-3 sm:px-4 lg:px-6">
            <div className="py-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Manage site-wide settings and configuration
                  </p>
            </div>
            <div className="flex items-center gap-3">
              <Button disabled className="shadow-lg text-base px-8 py-2">
                <Save className="h-5 w-5 mr-2" />
                Loading...
              </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Loading Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 dark:border-primary-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Manage site-wide settings and configuration
              {hasUnsavedChanges && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-700">
                  {changeCount} unsaved change{changeCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <Button 
                variant="secondary" 
                onClick={handleResetChanges}
                disabled={loading || initialLoading}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 dark:hover:border-gray-500 text-base px-6 py-2"
              >
                Reset Changes
              </Button>
            )}
            <Button 
              onClick={handleSave} 
              disabled={loading || initialLoading}
              className={`shadow-lg transition-all duration-200 text-base px-8 py-2 ${
                hasUnsavedChanges 
                      ? 'bg-orange-500 dark:bg-orange-600 hover:bg-orange-600 dark:hover:bg-orange-700 border-orange-500 dark:border-orange-600 animate-pulse' 
                  : ''
              }`}
            >
              <Save className="h-5 w-5 mr-2" />
              {loading ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Save Settings'}
            </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
      {/* General Settings */}
        <Card className="mb-4 overflow-hidden border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Site Name"
              value={settings.siteName}
              onChange={(e) => handleInputChange('siteName', e.target.value)}
              placeholder="Enter site name"
              className={isFieldChanged('siteName') ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20' : ''}
            />
            <Input
              label="Contact Email"
              value={settings.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              placeholder="Enter contact email"
              className={isFieldChanged('contactEmail') ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20' : ''}
            />
            <Input
              label="Contact Phone"
              value={settings.contactPhone}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              placeholder="Enter contact phone"
              className={isFieldChanged('contactPhone') ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20' : ''}
            />
          </div>
          <Input
            label="Site Description"
            value={settings.siteDescription}
            onChange={(e) => handleInputChange('siteDescription', e.target.value)}
            placeholder="Enter site description"
          />
          <FileUpload
            label="Site Logo"
            accept="image/*"
            maxSize={2}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            files={uploadedFiles}
            helperText="Recommended size: 200x60px"
          />
        </CardContent>
      </Card>

      {/* Delivery Settings */}
        <Card className="mb-4 overflow-hidden border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <MapPin className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            Delivery Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Delivery Fee"
              type="number"
              value={settings.deliveryFee}
              onChange={(e) => handleInputChange('deliveryFee', parseFloat(e.target.value))}
              placeholder="0.00"
              className={isFieldChanged('deliveryFee') ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20' : ''}
            />
            <Input
              label="Free Delivery Threshold"
              type="number"
              value={settings.freeDeliveryThreshold}
              onChange={(e) => handleInputChange('freeDeliveryThreshold', parseFloat(e.target.value))}
              placeholder="0.00"
            />
            <Input
              label="Delivery Time"
              value={settings.deliveryTime}
              onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
              placeholder="e.g., 2-4 hours"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Areas
            </label>
            <div className="space-y-2">
              {settings.deliveryAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={area}
                    onChange={(e) => {
                      const newAreas = [...settings.deliveryAreas];
                      newAreas[index] = e.target.value;
                      handleInputChange('deliveryAreas', newAreas);
                    }}
                    placeholder="Enter delivery area"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newAreas = settings.deliveryAreas.filter((_, i) => i !== index);
                      handleInputChange('deliveryAreas', newAreas);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  handleInputChange('deliveryAreas', [...settings.deliveryAreas, '']);
                }}
              >
                Add Area
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Settings */}
        <Card className="mb-4 overflow-hidden border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            Payment Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="acceptCard"
                checked={settings.acceptCard}
                onChange={(e) => handleInputChange('acceptCard', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 cursor-pointer"
              />
              <label htmlFor="acceptCard" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Credit Card
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="acceptUPI"
                checked={settings.acceptUPI}
                onChange={(e) => handleInputChange('acceptUPI', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 cursor-pointer"
              />
              <label htmlFor="acceptUPI" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                UPI
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="acceptWallet"
                checked={settings.acceptWallet}
                onChange={(e) => handleInputChange('acceptWallet', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 cursor-pointer"
              />
              <label htmlFor="acceptWallet" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Digital Wallet
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="acceptCash"
                checked={settings.acceptCash}
                onChange={(e) => handleInputChange('acceptCash', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 cursor-pointer"
              />
              <label htmlFor="acceptCash" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Cash on Delivery
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
        <Card className="mb-4 overflow-hidden border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            Business Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
              <div key={day} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {day}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={settings[`${day}Open` as keyof typeof settings] as string}
                    onChange={(e) => handleInputChange(`${day}Open`, e.target.value)}
                  />
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <Input
                    type="time"
                    value={settings[`${day}Close` as keyof typeof settings] as string}
                    onChange={(e) => handleInputChange(`${day}Close`, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer Settings */}
        <Card className="mb-4 overflow-hidden border border-primary-100/50 dark:border-primary-800/30 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            Footer & Social Media
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Footer Text"
            value={settings.footerText}
            onChange={(e) => handleInputChange('footerText', e.target.value)}
            placeholder="Enter footer text"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Facebook URL"
              value={settings.socialFacebook}
              onChange={(e) => handleInputChange('socialFacebook', e.target.value)}
              placeholder="https://facebook.com/creamingo"
            />
            <Input
              label="Instagram URL"
              value={settings.socialInstagram}
              onChange={(e) => handleInputChange('socialInstagram', e.target.value)}
              placeholder="https://instagram.com/creamingo"
            />
            <Input
              label="Twitter URL"
              value={settings.socialTwitter}
              onChange={(e) => handleInputChange('socialTwitter', e.target.value)}
              placeholder="https://twitter.com/creamingo"
            />
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};
