import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthState, AuthContextType, User, LoginCredentials } from '../types/auth';
import { hasPermission } from '../utils/permissions';
import authService from '../services/authService';

// Mock user data - in real app, this would come from API
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockSuperAdmin: User = {
  id: '1',
  name: 'Super Admin',
  email: 'admin@creamingo.com',
  role: 'super_admin',
  avatar: undefined,
  is_active: true,
  lastLogin: new Date().toISOString()
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockAdmin: User = {
  id: '2',
  name: 'Admin User',
  email: 'admin@creamingo.com',
  role: 'admin',
  avatar: undefined,
  is_active: true,
  lastLogin: new Date().toISOString()
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockStaff: User = {
  id: '3',
  name: 'Staff User',
  email: 'staff@creamingo.com',
  role: 'staff',
  avatar: undefined,
  is_active: true,
  lastLogin: new Date().toISOString()
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockBakeryProduction: User = {
  id: '4',
  name: 'Bakery Production User',
  email: 'bakery@creamingo.com',
  role: 'bakery_production',
  avatar: undefined,
  is_active: true,
  lastLogin: new Date().toISOString()
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockDeliveryBoy: User = {
  id: '5',
  name: 'Delivery Boy User',
  email: 'delivery@creamingo.com',
  role: 'delivery_boy',
  avatar: undefined,
  is_active: true,
  lastLogin: new Date().toISOString()
};

// Auth actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

const hydrateUserFromStorage = (): User | null => {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    const storedUser = authService.getStoredUser();
    if (!storedUser) {
      return null;
    }
    return {
      id: storedUser.id.toString(),
      name: storedUser.name,
      email: storedUser.email,
      role: storedUser.role,
      avatar: storedUser.avatar,
      is_active: storedUser.is_active,
      lastLogin: storedUser.last_login || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error hydrating user from storage:', error);
    return null;
  }
};

const getInitialState = (): AuthState => {
  if (typeof window === 'undefined') {
    return initialState;
  }
  const token = localStorage.getItem('auth_token');
  const hydratedUser = hydrateUserFromStorage();
  if (token && hydratedUser) {
    return {
      user: hydratedUser,
      isAuthenticated: true,
      isLoading: false,
      error: null
    };
  }
  return initialState;
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState, getInitialState);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          // Validate token with server and get current user
          const apiUser = await authService.getCurrentUser();
          
          // Convert API user format to our User type
          const user: User = {
            id: apiUser.id.toString(),
            name: apiUser.name,
            email: apiUser.email,
            role: apiUser.role,
            avatar: apiUser.avatar,
            is_active: apiUser.is_active,
            lastLogin: apiUser.last_login || new Date().toISOString()
          };
          
          dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
        // Clear invalid data
        authService.clearToken();
        localStorage.removeItem('user_data');
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Real API call to backend
      const response = await authService.login(credentials);
      
      // Convert API user format to our User type
      const user: User = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
        avatar: response.user.avatar,
        is_active: response.user.is_active,
        lastLogin: response.user.last_login || new Date().toISOString()
      };
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      // Preserve the exact error message from the backend
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call API logout endpoint
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if API call fails
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Permission helper functions
  const hasPermissionHelper = (permission: string): boolean => {
    return hasPermission(state.user, permission);
  };

  const hasRole = (role: string): boolean => {
    return state.user?.role === role;
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    hasPermission: hasPermissionHelper,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
