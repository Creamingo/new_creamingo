const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('customer_token');
  }
  return null;
}

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `HTTP error! status: ${response.status}`
    }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Create a new midnight wish (authenticated)
 * @param {{ message?: string, occasion?: string, delivery_pincode?: string, delivery_address?: object, items: Array<{ product_id: number, variant_id?: number, quantity?: number }> }} payload
 */
export async function createWish(payload) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/midnight-wish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(response);
}

/**
 * Get current customer's wishes (authenticated)
 */
export async function getMyWishes() {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/midnight-wish`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
}

/**
 * Delete a wish (authenticated, own wish only)
 * @param {number} wishId
 */
export async function deleteWish(wishId) {
  const token = getAuthToken();
  if (!token) throw new Error('Authentication required');

  const response = await fetch(`${API_BASE_URL}/midnight-wish/${wishId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  return handleResponse(response);
}

/**
 * Get wish by public ID (no auth - for share link / fulfill page)
 * @param {string} publicId
 */
export async function getWishByPublicId(publicId) {
  const response = await fetch(`${API_BASE_URL}/midnight-wish/${publicId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  return handleResponse(response);
}
