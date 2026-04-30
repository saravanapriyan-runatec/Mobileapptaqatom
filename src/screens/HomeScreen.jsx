import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Animated, PanResponder, Dimensions, ActivityIndicator, ScrollView, Platform, RefreshControl } from 'react-native'
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProfileHeader from '../components/home/ProfileHeader';
import SwipeDownIndicator from '../components/home/SwipeDownIndicator';
import AttendanceCard from '../components/home/AttendanceCard';
import BottomNavBar from '../components/home/BottomNavBar';
import QuickActions from '../components/home/QuickActions';
import RequestSection from '../components/home/RequestSection';
import TaskSection from '../components/home/TaskSection';
import UpcomingHolidays from '../components/home/UpcomingHolidays';
import AnnouncementSection from '../components/home/AnnouncementSection';

import AttendanceScreen from './AttendanceScreen';
import WeeklySummaryScreen from './WeeklySummaryScreen';
import MonthlySummaryScreen from './MonthlySummaryScreen';
import AttendanceHistoryScreen from './AttendanceHistoryScreen';
import RegularizationScreen from './RegularizationScreen';
import ShiftDetailsScreen from './ShiftDetailsScreen';
import TaskScreen from './TaskScreen';
import ReportScreen from './ReportScreen';
import RequestScreen from './RequestScreen';
import AnnouncementScreen from './AnnouncementScreen';
import ApprovalsScreen from './ApprovalsScreen';
import HolidayScreen from './HolidayScreen';
import LoanScreen from './LoanScreen';
import ApplyLoanScreen from './ApplyLoanScreen';
import PaySlipScreen from './PaySlipScreen';
import PaySlipDetailScreen from './PaySlipDetailScreen';
import ExpenseScreen from './ExpenseScreen';
import NewExpenseScreen from './NewExpenseScreen';
import SettingsScreen from './SettingsScreen';
import ProfileUpdateScreen from './ProfileUpdateScreen';
import ChangePasswordScreen from './ChangePasswordScreen';
import NotificationScreen from './NotificationScreen';
import RecentActivitiesSheet from '../components/home/RecentActivitiesSheet';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import { TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useRegularization } from '../context/RegularizationContext';
import { useTasks } from '../context/TaskContext';
const { height } = Dimensions.get('window');

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const paddingTop = insets.top;

  const [activeTab, setActiveTab] = useState('home');
  const [currentView, setCurrentView] = useState('main');
  const [previousView, setPreviousView] = useState('main');
  const [viewParams, setViewParams] = useState(null);
  const showActivitiesRef = useRef(false);
  const isScrollAtTop = useRef(true);
  const scrollRef = useRef(null);
  const dashboardAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Use a ref for showActivities to avoid re-renders during gesture if possible, but keep state for UI
  const [showActivities, _setShowActivities] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { fetchRequests } = useRegularization();
  const { fetchTasks } = useTasks();

  // Instant update when returning to main dashboard
  useEffect(() => {
    if (currentView === 'main' && activeTab === 'home') {
      // console.log('Refreshing dashboard data...');
      fetchRequests();
      fetchTasks();
    }
  }, [currentView, activeTab, i18n.language]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchRequests(), fetchTasks()]);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => {
    if (currentView === 'main' && activeTab === 'home') {
      scrollY.setValue(0);
      dashboardAnim.setValue(0);
      isScrollAtTop.current = true;
      _setShowActivities(false);
      showActivitiesRef.current = false;
    }
  }, [currentView, activeTab, scrollY, dashboardAnim]);

  // Unified Animation Helper for fluid, premium feel
  const animateDashboard = (toValue, velocity = 0, onFinish = null) => {
    Animated.spring(dashboardAnim, {
      toValue,
      velocity,
      useNativeDriver: true,
      tension: 55, // Snappier response
      friction: 12,
      restSpeedThreshold: 0.1,
      restDisplacementThreshold: 0.1,
    }).start(({ finished }) => {
      if (finished && onFinish) onFinish();
    });
  };

  const setShowActivities = (val, velocity = 0) => {
    const windowHeight=Dimensions.get("window").height;
    if (val) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      showActivitiesRef.current = true;
      _setShowActivities(true);
      animateDashboard(windowHeight * 0.70, velocity);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Keep ref true during close so interactions stay consistent
      animateDashboard(0, velocity, () => {
        showActivitiesRef.current = false;
        _setShowActivities(false);
      });
    }
  };

  const handleNavigate = (view, params = null) => {
    setPreviousView(currentView);
    setCurrentView(view);
    setViewParams(params);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        const { dy, dx, vy, y0 } = gestureState;
        const currentShow = showActivitiesRef.current;
        
        if (!currentShow) {
          // REVEAL: Only capture if swiping DOWN from the top strip
          // Since we'll move this to the Animated.View, it naturally only triggers on the dashboard area.
          const isReveal = isScrollAtTop.current && dy > 5 && Math.abs(dy) > Math.abs(dx);
          return isReveal;
        } else {
          // HIDE: Ultimate Ultra-Greedy 2000% separation
          // 1. Fast flick UP anywhere on the dashboard closes it
          if (vy < -0.3) return true;
          
          // 2. ULTRA-GREEDY CLOSE ZONE: 
          // If dashboard is open, ANY touch starting from below the activities (25% height) captures for close.
          if (dy < -2 && y0 > Dimensions.get('window').height * 0.25) return true;
          
          return false;
        }
      },
      onPanResponderGrant: () => {
        dashboardAnim.stopAnimation();
      },
    onPanResponderMove: (_, gestureState) => {
        const currentShow = showActivitiesRef.current;
        const windowHeight = Dimensions.get('window').height;
        let newValue = currentShow ? windowHeight * 0.70 + gestureState.dy : gestureState.dy;
        if (newValue < 0) newValue = 0;
        if (newValue > windowHeight * 0.70) newValue = windowHeight * 0.70;
        dashboardAnim.setValue(newValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentShow = showActivitiesRef.current;
        const windowHeight = Dimensions.get('window').height;
        const isShortTap = Math.abs(gestureState.dy) < 15 && Math.abs(gestureState.dx) < 15;
 
        // Click Detection
        if (isShortTap) {
          const isTapOnIndicator = !currentShow && gestureState.y0 < 150;
          const isTapOnDashboardArea = currentShow && evt.nativeEvent.pageY > windowHeight * 0.45;
          if (isTapOnIndicator || isTapOnDashboardArea) {
            setShowActivities(!currentShow);
            return;
          }
        }
 
        // Swipe & Snap Logic
        const dragThreshold = windowHeight * 0.1;
        const shouldOpen = !currentShow && (gestureState.dy > dragThreshold || gestureState.vy > 0.02);
        const shouldClose = currentShow && (gestureState.dy < -dragThreshold || gestureState.vy < -0.02);
 
        if (shouldOpen) {
          setShowActivities(true, gestureState.vy);
        } else if (shouldClose) {
          setShowActivities(false, gestureState.vy);
        } else {
          animateDashboard(currentShow ? windowHeight * 0.70 : 0, gestureState.vy);
        }
      },
      onResponderTerminationRequest: () => false,
    })
  ).current;
 
  // Removed useEffect spring to avoid conflict with manual gesture animation

  if (currentView === 'weeklySummary') {
    return <WeeklySummaryScreen onBack={() => handleNavigate('main')} />;
  }

  if (currentView === 'monthlySummary') {
    return <MonthlySummaryScreen onBack={() => handleNavigate('main')} />;
  }

  if (currentView === 'attendanceHistory') {
    return <AttendanceHistoryScreen onBack={() => handleNavigate('main')} />;
  }

  if (currentView === 'regularization') {
    return <RegularizationScreen onBack={() => handleNavigate('main')} />;
  }

  if (currentView === 'shiftDetails') {
    return <ShiftDetailsScreen onBack={() => handleNavigate('main')} />;
  }

  if (currentView === 'request') {
    return <RequestScreen onBack={() => handleNavigate('main')} routeParams={viewParams} />;
  }

  if (currentView === 'announcement') {
    return <AnnouncementScreen onBack={() => handleNavigate('main')} />;
  }

  if (currentView === 'approvals') {
    return <ApprovalsScreen onBack={() => handleNavigate('main')} />;
  }

  if (currentView === 'holiday') {
    return <HolidayScreen onBack={() => handleNavigate('main')} />;
  }

  if (currentView === 'loan') {
    return <LoanScreen onBack={() => handleNavigate('main')} onApplyLoan={() => handleNavigate('apply_loan')} />;
  }

  if (currentView === 'apply_loan') {
    return <ApplyLoanScreen onBack={() => handleNavigate('loan')} />;
  }

  if (currentView === 'payslip') {
    return <PaySlipScreen onBack={() => handleNavigate('main')} onNavigate={handleNavigate} />;
  }

  if (currentView === 'payslipDetail') {
    return <PaySlipDetailScreen onBack={() => handleNavigate('payslip')} routeParams={viewParams} />;
  }

  if (currentView === 'expense') {
    return <ExpenseScreen onBack={() => handleNavigate('main')} onNavigate={handleNavigate} />;
  }

  if (currentView === 'newExpense') {
    return <NewExpenseScreen onBack={() => handleNavigate('expense')} onNavigate={handleNavigate} />;
  }

  // if (currentView === 'settings') {
  //   return <SettingsScreen onBack={() => handleNavigate('main')} onNavigate={handleNavigate} />;
  // }

  if (currentView === 'profileUpdate') {
    return <ProfileUpdateScreen onBack={() => handleNavigate(previousView)} />;
  }

  if (currentView === 'password') {
    return <ChangePasswordScreen onBack={() => handleNavigate('settings')} />;
  }

  if (currentView === 'notifications') {
    return <NotificationScreen onBack={() => handleNavigate(previousView === 'notifications' ? 'main' : previousView)} onNavigate={handleNavigate} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <View style={{ flex: 1 }}>
            {/* Background Layer: Recent Activities (Hidden behind dashboard) */}
            <RecentActivitiesSheet
              visible={showActivities}
              animatedValue={dashboardAnim}
              onClose={() => setShowActivities(false)}
            />
            {/* Foreground Layer: Main Dashboard Sheet */}
            <View style={styles.foreground} pointerEvents="box-none">
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    opacity: dashboardAnim.interpolate({
                      inputRange: [0, Dimensions.get('window').height * 0.3], // Fade out smoothly as it swipes down
                      outputRange: [1, 0],
                      extrapolate: 'clamp'
                    }),
                    transform: [{
                      translateY: scrollY.interpolate({
                        inputRange: [0, 1000],
                        outputRange: [0, -1000],
                        extrapolate: 'clamp'
                      })
                    }]
                  }
                ]}
                pointerEvents="none"
              >
                <LinearGradient
                  colors={['#8EA3E3', '#F0F4FF', '#FFFFFF']}
                  locations={[0, 0.15, 0.4]} 
                  style={[StyleSheet.absoluteFill, { height: Dimensions.get('window').height * 2 }]} 
                />
              </Animated.View>
 
              <Animated.View
                style={{
                  flex: 1,
                  transform: [{ translateY: dashboardAnim }]
                }}
                pointerEvents="box-none" // Let children handle their own clicks
                {...panResponder.panHandlers} // MOVE HERE for naturally separated hit-testing
              >
                <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                  {/* Main Content Card (White Rounded Section) */}
                  <View style={[styles.mainContentCard, { marginTop: paddingTop + 16 }]}>

                    {/* Floating Header Items Layer (Syncs with ScrollView) */}
                    <Animated.View
                      pointerEvents="box-none"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        paddingHorizontal: 16,
                        transform: [{
                          translateY: scrollY.interpolate({
                            inputRange: [0, 1000],
                            outputRange: [0, -1000],
                            extrapolate: 'clamp'
                          })
                        }]
                      }}
                    >
                      {/* Part 1: Profile Header (Moves UP and Fades Out) */}
                      <Animated.View
                        style={{
                          opacity: dashboardAnim.interpolate({
                            inputRange: [0, 150], // More gradual fade
                            outputRange: [1, 0],
                            extrapolate: 'clamp'
                          }),
                           transform: [{
                            translateY: dashboardAnim.interpolate({
                              inputRange: [0, Dimensions.get('window').height * 0.70],
                              // Net movement (relative to screen) = dashboardAnim + outputValue
                              // We want net movement to be -300 (sharp move up) at max reveal.
                              // So: -300 = (height * 0.70) + outputValue => outputValue = -(height * 0.70 + 300)
                              outputRange: [0, -(Dimensions.get('window').height * 0.70 + 300)],
                              extrapolate: 'clamp'
                            })
                          }]
                        }}
                      >
                        <ProfileHeader
                          onNavigate={handleNavigate}
                          onToggleActivities={() => setShowActivities(!showActivities)}
                        />
                      </Animated.View>

                      {/* Part 2: Indicator & Card (Stay relative to dashboard, so they move DOWN) */}
                      <View style={[styles.indicatorWrapper, { paddingVertical: 10 }]}>
                        <SwipeDownIndicator
                          onPress={() => setShowActivities(!showActivities)}
                          animatedValue={dashboardAnim}
                          isOpen={showActivities}
                        />
                      </View>

                      <AttendanceCard onNavigate={(view) => {
                        if (view === 'attendance') setActiveTab('attendance');
                        else handleNavigate(view);
                      }} />
                    </Animated.View>

                    <Animated.ScrollView
                      ref={scrollRef}
                      style={{ flex: 1 }}
                      contentContainerStyle={[styles.scrollContent, { paddingTop: 490,flexGrow:1}]} // Final synchronized spacing
                      showsVerticalScrollIndicator={false}
                      bounces={true}
                      scrollEnabled={!showActivities}
                        refreshControl={
                        <RefreshControl
                          refreshing={refreshing}
                          onRefresh={handleRefresh}
                          tintColor="#4169E1"
                          progressViewOffset={490} // Important to offset the loading spinner to be visible
                        />
                      }
                      onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        {
                          useNativeDriver: true,
                          listener: (e) => {
                            const offset = e.nativeEvent.contentOffset.y;
                            isScrollAtTop.current = offset <= 5;
                          }
                        }
                      )}
                      scrollEventThrottle={1}
                      decelerationRate="fast"
                      overScrollMode="never"
                    >
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'transparent' }} />
                      <View style={{ minHeight: height }}>
                      <QuickActions onNavigate={handleNavigate} />
<View style={{height:32}}/>
                      <RequestSection onViewAll={() => setCurrentView('request')} />
<View style={{height:32}}/>

                      <TaskSection onNavigate={(view) => {
                        if (view === 'task') setActiveTab('task');
                        else handleNavigate(view);
                      }} />
<View style={{height:32}}/>

                      <UpcomingHolidays onNavigate={handleNavigate} />
<View style={{height:32}}/>

                      <AnnouncementSection onNavigate={handleNavigate} />
<View style={{height:100}}/>
</View>
                      <View style={{ height: 120 }} />
                    </Animated.ScrollView>
                  </View>
                </View>

                {/* Blue Gloss Overlay - Visual only */}
      <Animated.View 
        style={[
          StyleSheet.absoluteFill, 
          { 
            opacity: dashboardAnim.interpolate({
              inputRange: [0, height * 0.1, height * 0.7],
              outputRange: [0, 1, 1],
              extrapolate: 'clamp'
            })
          }
        ]} 
        pointerEvents="none"
      >
        <BlurView
          intensity={40}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
              </Animated.View>
            </View>
          </View>
        );
      case 'attendance':
        return <AttendanceScreen onNavigate={handleNavigate} />;
      case 'task':
        return <TaskScreen onBack={() => setActiveTab('home')} />;
      case 'report':
        return <ReportScreen />;
        case "settings":
          return <SettingsScreen onBack={()=>setActiveTab('home')} onNavigate={handleNavigate} />;
      default:
        return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <LinearGradient
              colors={['#8EA3E3', '#FFFFFF']}
              locations={[0, 0.4]}
              style={styles.background}
            />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      
      {renderContent()}

      <BottomNavBar
        activeTab={activeTab}
       onTabPress={setActiveTab}
        style={{ zIndex: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContentCard: {
    flex: 1,
    backgroundColor: 'transparent', // User preference restored
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
  },
  indicatorWrapper: {
    paddingVertical: 14,
    backgroundColor: 'transparent', // User preference restored
    alignItems: 'center',
  },
  foreground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingHorizontal: 16,
    gap: 24,
  },
});
