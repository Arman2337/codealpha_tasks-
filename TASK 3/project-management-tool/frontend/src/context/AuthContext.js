import React, { createContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Start with loading true

  // Using useCallback to memoize the function
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // FIX: The API endpoint was incorrect. Changed from /api/users/me to /api/auth/me
        const res = await axiosInstance.get('/api/auth/me');
        const userData = res.data;
        
        // The user object from /me might not have the 'id' field in the root
        // Let's ensure our user state has a consistent shape.
        const formattedUser = {
            id: userData._id,
            username: userData.username,
            email: userData.email,
            role: userData.role
        };

        setUser(formattedUser);
        // Storing the consistent user object
        localStorage.setItem('user', JSON.stringify(formattedUser));
        setIsAuthenticated(true);
      }
    } catch (err) {
      // If token is invalid or expired, this catch block will run
      console.error("Authentication check failed:", err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      // Set loading to false after the check is complete
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      const res = await axiosInstance.post('/api/auth/login', { email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axiosInstance.post('/api/auth/register', {
        username,
        email,
        password
      });
      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Show a loading indicator while we check for authentication
  if (loading) {
    // You can replace this with a more sophisticated loading spinner component
    return <div>Loading Application...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
