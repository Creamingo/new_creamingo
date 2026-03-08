import { apiRequest } from '../utils/apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Upload a document for vendor application (shop or ID). File: image or PDF.
 * @param {File} file
 * @returns {Promise<{ success: boolean, data?: { url: string } }>}
 */
export async function uploadVendorDocument(file) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('customer_token') : null;
  const formData = new FormData();
  formData.append('document', file);
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/vendor-applications/upload-document`, {
    method: 'POST',
    headers,
    body: formData
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || 'Upload failed');
  return json;
}

/**
 * Submit a vendor application.
 * @param {Object} data - { name, email, phone, shop_name?, category_ids (array), contact_preference?, city?, pincode?, gst_number?, shop_document_url?, id_document_url? }
 * @returns {Promise<{ success: boolean, message: string, application_id?: number }>}
 */
export async function submitVendorApplication(data) {
  const payload = {
    name: data.name?.trim(),
    email: data.email?.trim(),
    phone: data.phone?.trim(),
    shop_name: data.shop_name?.trim() || undefined,
    category_ids: Array.isArray(data.category_ids) ? data.category_ids : [data.category_ids].filter(Boolean),
    contact_preference: ['phone', 'whatsapp', 'email'].includes(data.contact_preference) ? data.contact_preference : 'phone',
    city: data.city?.trim() || undefined,
    pincode: data.pincode?.trim() || undefined,
    gst_number: data.gst_number?.trim() || undefined,
    shop_document_url: data.shop_document_url || undefined,
    id_document_url: data.id_document_url || undefined
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

/**
 * Get public status of a vendor application (no auth).
 * @param {number|string} applicationId
 * @returns {Promise<{ application_id: number, status: string, updated_at: string }>}
 */
export async function getApplicationStatus(applicationId) {
  const id = String(applicationId).replace(/\D/g, '');
  if (!id) throw new Error('Invalid application ID');
  const response = await fetch(`${API_BASE_URL}/vendor-applications/status/${id}`, { method: 'GET' });
  const json = await response.json();
  if (!response.ok) {
    if (response.status === 404) throw new Error('NOT_FOUND');
    throw new Error(json.message || 'Failed to fetch status');
  }
  return json;
}
