import apiClient from './api';

export interface Setting {
  id: number;
  key: string;
  value: any;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SettingsData {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  delivery_areas: string[];
  delivery_fee: number;
  free_delivery_threshold: number;
  delivery_time: string;
  payment_methods: string[];
  business_hours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  social_links: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  footer_text: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class SettingsService {
  // Get all settings
  async getSettings(): Promise<ApiResponse<{ settings: Record<string, any> }>> {
    const response = await apiClient.get('/settings');
    return response as ApiResponse<{ settings: Record<string, any> }>;
  }

  // Get single setting
  async getSetting(key: string): Promise<ApiResponse<{ setting: Setting }>> {
    const response = await apiClient.get(`/settings/${key}`);
    return response as ApiResponse<{ setting: Setting }>;
  }

  // Update multiple settings
  async updateSettings(settingsData: Partial<SettingsData>): Promise<ApiResponse<{ settings: Record<string, any> }>> {
    const response = await apiClient.put('/settings', settingsData);
    return response as ApiResponse<{ settings: Record<string, any> }>;
  }

  // Update single setting
  async updateSetting(key: string, value: any): Promise<ApiResponse<{ setting: Setting }>> {
    const response = await apiClient.put(`/settings/${key}`, { value });
    return response as ApiResponse<{ setting: Setting }>;
  }

  // Delete setting
  async deleteSetting(key: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/settings/${key}`);
    return response as ApiResponse<void>;
  }

  // Helper method to transform settings data for the UI
  transformSettingsForUI(settings: Record<string, any>): SettingsData {
    return {
      site_name: settings.site_name || 'Creamingo',
      site_description: settings.site_description || 'Delicious cakes for every occasion',
      contact_email: settings.contact_email || 'info@creamingo.com',
      contact_phone: settings.contact_phone || '+1 (555) 123-4567',
      delivery_areas: settings.delivery_areas || ['Downtown', 'Uptown', 'Midtown', 'Suburbs'],
      delivery_fee: settings.delivery_fee || 5.99,
      free_delivery_threshold: settings.free_delivery_threshold || 50.00,
      delivery_time: settings.delivery_time || '2-4 hours',
      payment_methods: settings.payment_methods || ['cash', 'card', 'upi', 'wallet'],
      business_hours: settings.business_hours || {
        monday: '9:00 AM - 9:00 PM',
        tuesday: '9:00 AM - 9:00 PM',
        wednesday: '9:00 AM - 9:00 PM',
        thursday: '9:00 AM - 9:00 PM',
        friday: '9:00 AM - 9:00 PM',
        saturday: '9:00 AM - 9:00 PM',
        sunday: '10:00 AM - 8:00 PM'
      },
      social_links: settings.social_links || {
        facebook: 'https://facebook.com/creamingo',
        instagram: 'https://instagram.com/creamingo',
        twitter: 'https://twitter.com/creamingo'
      },
      footer_text: settings.footer_text || '© 2024 Creamingo. All rights reserved.'
    };
  }

  // Helper method to transform UI data for API
  transformUIForAPI(uiData: any): Record<string, any> {
    const apiData: Record<string, any> = {};

    // Map UI fields to API keys
    if (uiData.siteName !== undefined) apiData.site_name = uiData.siteName;
    if (uiData.siteDescription !== undefined) apiData.site_description = uiData.siteDescription;
    if (uiData.contactEmail !== undefined) apiData.contact_email = uiData.contactEmail;
    if (uiData.contactPhone !== undefined) apiData.contact_phone = uiData.contactPhone;
    if (uiData.deliveryAreas !== undefined) apiData.delivery_areas = uiData.deliveryAreas;
    if (uiData.deliveryFee !== undefined) apiData.delivery_fee = uiData.deliveryFee;
    if (uiData.freeDeliveryThreshold !== undefined) apiData.free_delivery_threshold = uiData.freeDeliveryThreshold;
    if (uiData.deliveryTime !== undefined) apiData.delivery_time = uiData.deliveryTime;
    if (uiData.footerText !== undefined) apiData.footer_text = uiData.footerText;

    // Handle payment methods
    if (uiData.acceptCard !== undefined || uiData.acceptUPI !== undefined || 
        uiData.acceptWallet !== undefined || uiData.acceptCash !== undefined) {
      const paymentMethods = [];
      if (uiData.acceptCard) paymentMethods.push('card');
      if (uiData.acceptUPI) paymentMethods.push('upi');
      if (uiData.acceptWallet) paymentMethods.push('wallet');
      if (uiData.acceptCash) paymentMethods.push('cash');
      apiData.payment_methods = paymentMethods;
    }

    // Handle business hours
    if (uiData.mondayOpen !== undefined || uiData.mondayClose !== undefined ||
        uiData.tuesdayOpen !== undefined || uiData.tuesdayClose !== undefined ||
        uiData.wednesdayOpen !== undefined || uiData.wednesdayClose !== undefined ||
        uiData.thursdayOpen !== undefined || uiData.thursdayClose !== undefined ||
        uiData.fridayOpen !== undefined || uiData.fridayClose !== undefined ||
        uiData.saturdayOpen !== undefined || uiData.saturdayClose !== undefined ||
        uiData.sundayOpen !== undefined || uiData.sundayClose !== undefined) {
      
      const businessHours: Record<string, string> = {};
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      days.forEach(day => {
        const openKey = `${day}Open`;
        const closeKey = `${day}Close`;
        if (uiData[openKey] !== undefined && uiData[closeKey] !== undefined) {
          businessHours[day] = `${uiData[openKey]} - ${uiData[closeKey]}`;
        }
      });
      
      apiData.business_hours = businessHours;
    }

    // Handle social links
    if (uiData.socialFacebook !== undefined || uiData.socialInstagram !== undefined || 
        uiData.socialTwitter !== undefined) {
      const socialLinks: Record<string, string> = {};
      if (uiData.socialFacebook !== undefined) socialLinks.facebook = uiData.socialFacebook;
      if (uiData.socialInstagram !== undefined) socialLinks.instagram = uiData.socialInstagram;
      if (uiData.socialTwitter !== undefined) socialLinks.twitter = uiData.socialTwitter;
      apiData.social_links = socialLinks;
    }

    return apiData;
  }
}

export const settingsService = new SettingsService();
