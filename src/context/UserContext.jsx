import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../../Services/AuthService';
import ProfileServices from '../../Services/API/ProfileServices.jsx';
import { AppState } from 'react-native';
import { triggerGlobalLogout } from '../utils/globalLogoutHandler';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [userFeatures, setUserFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = React.useCallback(async (isBackground = false) => {
    try {
      // Only show loading if we don't have user details yet and it's not a background check
      if (!isBackground) {
        setLoading(true);
      }
      
      const authUserId = await AuthService.getUserId();

      if (authUserId) {
        const details = await ProfileServices.getUserDetailsData(authUserId);
        
        // Fetch secondary details
        try {
          if (details?.username) {
            const employee = await ProfileServices.getEmployeeDetailsData(details.username);
            if (employee?.id) {
              const fullDetails = await ProfileServices.getEmployeeFullDetails(employee.id);
              details.id = employee.id; // Explicitly assign the employee ID
              Object.assign(details, fullDetails);
            }
          }
        } catch (empError) {
          console.warn('DEBUG [UserContext]: Failed to fetch secondary employee details:', empError);
        }

        const features = details?.features?.map(f => f.name) || [];
        setUserFeatures(features);
        details._fetchTime = Date.now(); // Add cache buster for images
        setUserDetails(prev => ({ ...details })); // Functional update or spreading new object
        
        // console.log(`DEBUG [UserContext]: Data Sync Complete (${isBackground ? 'Background' : 'Initial'}). Features:`, features.length);
      }
    } catch (error) {
      console.error('Error fetching user data in UserContext:', error);
    } finally {
      setLoading(false);
    }
  }, []); // NO DEPENDENCIES here to prevent recreation

  useEffect(() => {
    // Initial fetch
    fetchUserData();

    let isPolling = true;
    let pollTimeout = null;

    // Single source of truth for session checking
    const checkSession = async () => {
      // STOP if polling is disabled, app is in background, or NO USER is logged in
      if (!isPolling || AppState.currentState !== 'active' || !userDetails) {
        if (isPolling) pollTimeout = setTimeout(checkSession, 30000); 
        return;
      }

      const startTime = Date.now();
      const cb = startTime.toString();
      
      try {
        // Hyper-lightweight check with CACHE BUSTER
        await Promise.race([
          ProfileServices.getUnreadNotifications(cb),
          new Promise((_, rej) => setTimeout(() => rej(new Error('POLL_TIMEOUT')), 5000))
        ]);
        
        const duration = Date.now() - startTime;
        // console.log(`[DEBUG] [SessionPoll] SUCCESS - ${duration}ms`); // Reduced log noise
      } catch (error) {
        const duration = Date.now() - startTime;
        if (error?.message === 'POLL_TIMEOUT') {
          console.warn(`[DEBUG] [SessionPoll] TIMEOUT - Request took longer than 5000ms`);
        } else if (error?.status === 401) {
          // console.log(`[DEBUG] [SessionPoll] 401 DETECTED - Logout triggered in ${duration}ms`);
          triggerGlobalLogout(); // Only trigger logout from session poll, not from every API call
          return; // Stop polling after logout
        }
      }

      // Schedule next check (1 second delay for stability)
      if (isPolling) {
        pollTimeout = setTimeout(checkSession, 30000);
      }
    };

    // Start the single loop
    checkSession();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        fetchUserData(true);
        // NO checkSession() here! The existing loop will resume due to AppState check.
      }
    });

    return () => {
      isPolling = false;
      if (pollTimeout) clearTimeout(pollTimeout);
      subscription.remove();
    };
  }, [fetchUserData, !!userDetails]); // Re-run effect if user logs in/out

  return (
    <UserContext.Provider value={{ userDetails, userFeatures, loading, refreshUserData: fetchUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
