import './locales/i18n';
import * as SplashScreenAsync from 'expo-splash-screen';
import { Animated, View, StyleSheet, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AttendanceProvider } from './src/context/AttendanceContext';
import { RegularizationProvider } from './src/context/RegularizationContext';
import { TaskProvider } from './src/context/TaskContext';
import LoginScreen from './src/screens/LoginScreen';
import { useState,useRef,useEffect } from 'react';
import HomeScreen from './src/screens/HomeScreen';
import SplashScreen from './src/screens/SplashScreen';
import OrganizationScreen from './src/screens/OrganizationScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import AuthService from './Services/AuthService';
import { Provider as PaperProvider } from 'react-native-paper';
import { en, registerTranslation } from 'react-native-paper-dates';

// Register locale for react-native-paper-dates
registerTranslation('en', en);
import { UserProvider, useUser } from './src/context/UserContext';
import { setLogoutFunction } from './src/utils/globalLogoutHandler';
import Toast from 'react-native-toast-message';

// Keep the native splash screen visible while we fetch resources
SplashScreenAsync.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appState, setAppState] = useState('splash');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transitionTo = (newState) => {
    if (appState === newState) return; // Already in this state
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setAppState(newState);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  const checkInitialState = async () => {
    const domain = await AuthService.getDomainName();
    const isLoggedIn = await AuthService.isLoggedIn();

    if (isLoggedIn) {
      transitionTo('authenticated');
    } else if (domain) {
      setSelectedDomain(domain);
      transitionTo('login');
    } else {
      transitionTo('organization');
    }
  };

  useEffect(() => {
    // Hide native splash once React logo is ready to animate
    SplashScreenAsync.hideAsync().catch(() => {});

    setLogoutFunction(async () => {
      // console.log('DEBUG [App]: Global Logout Execution Started. Current state:', appState);
      
      await AuthService.logout();
      const domain = await AuthService.getDomainName();
      if (domain) {
        setSelectedDomain(domain);
        transitionTo('login');
      } else {
        transitionTo('organization');
      }
    });

    // Handle AppState changes to validate session on foreground
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('DEBUG [App]: App came to foreground, validating session...');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [appState]); // Add appState dependency to avoid stale closures


  const handleSplashFinish = () => {
    if (appState === 'splash') {
      checkInitialState();
    }
  };

  // Wrapper to handle provider keying based on userDetails
  const AuthenticatedApp = ({ onLogout }) => {
    const { userDetails } = useUser();
    const userId = userDetails?.id || 'anonymous';
    
    return (
      <AttendanceProvider key={`attendance_${userId}`}>
        <RegularizationProvider key={`reg_${userId}`}>
          <TaskProvider key={`task_${userId}`}>
            <HomeScreen onLogout={onLogout} />
          </TaskProvider>
        </RegularizationProvider>
      </AttendanceProvider>
    );
  };

  const renderContent = () => {
    switch (appState) {
      case 'splash':
        return <SplashScreen onFinish={handleSplashFinish} />;
      case 'organization':
        return (
          <OrganizationScreen
            onDomainSelected={(domain) => {
              setSelectedDomain(domain);
              transitionTo('login');
            }}
          />
        );
      case 'login':
        return (
          <LoginScreen
            domain={selectedDomain}
            onLoginSuccess={() => transitionTo('authenticated')}
            onSwitchOrg={() => transitionTo('organization')}
            onForgotPassword={() => transitionTo('forgot_password')}
          />
        );
      case 'forgot_password':
        return <ForgotPasswordScreen onBack={() => transitionTo('login')} />;
      case 'authenticated':
        return (
          <UserProvider>
            <AuthenticatedApp onLogout={() => transitionTo('organization')} />
          </UserProvider>
        );
      default:
        return <SplashScreen onFinish={handleSplashFinish} />;
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {renderContent()}
        </Animated.View>
        <Toast />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
