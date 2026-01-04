import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import api, { setAuthToken } from '../config/api';
import { User, SignUpData, LoginData } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: LoginData) => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setAuthToken(token);
          
          // Get user profile from backend
          const response = await api.get('/users/me');
          setUser(response.data);
        } catch (error: any) {
          console.error('Error loading user profile:', error);
          console.error('Profile loading error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
          });
          
          // User is authenticated in Firebase but backend has issues
          // Don't set user to null - let them retry or sign out manually
          if (error.response?.status !== 500) {
            setUser(null);
          }
        }
      } else {
        setAuthToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (data: SignUpData) => {
    try {
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const token = await userCredential.user.getIdToken();
      setAuthToken(token);

      // Create user profile in backend
      const response = await api.post('/users', {
        uid: userCredential.user.uid,
        email: data.email,
        name: data.name,
        role: data.role,
        district: data.district,
      });

      setUser(response.data);
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to sign up');
    }
  };

  const signIn = async (data: LoginData) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const token = await userCredential.user.getIdToken();
      setAuthToken(token);

      // Get user profile from backend
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error: any) {
      console.error('Sign in error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url,
      });
      
      // Provide more helpful error messages
      if (error.response?.status === 500) {
        throw new Error('Backend server error - check network connection and ensure backend is running');
      } else if (error.response?.status === 404) {
        throw new Error('User profile not found - please complete registration');
      } else if (error.code === 'auth/invalid-email' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      }
      
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setAuthToken(null);
      setUser(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const reloadUser = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error: any) {
      console.error('Reload user error:', error);
      throw new Error(error.message || 'Failed to reload user data');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
