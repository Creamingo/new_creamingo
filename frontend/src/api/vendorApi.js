import { apiRequest } from '../utils/apiClient';

/**
 * Submit a vendor application.
 * @param {Object} data - { name, email, phone, shop_name?, category_ids: number[] }
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function submitVendorApplication(data) {
  const payload = {
    name: data.name?.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    shop_name: data.shop_name?.trim() || undefined,
    category_ids: Array.isArray(data.category_ids) ? data.category_ids : [data.category_ids].filter(Boolean)
  };
  const response = await apiRequest('/vendor-applications', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || 'Failed to submit application');
  }
  return json;
}
