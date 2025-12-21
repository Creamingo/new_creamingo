// Debug utility to help troubleshoot authentication issues
import { User } from '../types/auth';

export const debugAuth = () => {
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('user');
  
  console.log('=== AUTH DEBUG INFO ===');
  console.log('Token exists:', !!token);
  console.log('Token length:', token?.length || 0);
  console.log('User data exists:', !!userStr);
  
  if (userStr) {
    try {
      const user: User = JSON.parse(userStr);
      console.log('User role:', user.role);
      console.log('User email:', user.email);
      console.log('User name:', user.name);
      console.log('User ID:', user.id);
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  
  console.log('========================');
};

// Call this function in browser console to debug auth issues
(window as any).debugAuth = debugAuth;
