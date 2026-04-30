import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';
import * as Haptics from 'expo-haptics';
import {
  HomeOutline, HomeSolid,
  AttendanceOutline, AttendanceSolid,
  TaskOutline, TaskSolid,
  ReportOutline, ReportSolid, SettingsOutline, SettingsSolid
} from './BottomNavIcons';

const { width } = Dimensions.get('window');

// Configuring tabs based on the Figma design
const TABS = (t) => [
  { id: 'home', icon: 'home', label: t(tokens.nav.home), active: true, type: 'standard' },
  { id: 'attendance', icon: 'clipboard-outline', label: t(tokens.nav.attendance), active: false, type: 'standard' },
  { id: 'task', icon: 'document-text-outline', label: t(tokens.nav.task), active: false, type: 'standard' },
  { id: 'report', icon: 'pie-chart-outline', label: t(tokens.nav.report), active: false, type: 'standard' },
  { id: 'settings', icon: 'settings-outline', label: t(tokens.profile.settings), active: false, type: 'standard' },
];

export default function BottomNavBar({ activeTab = 'home', onTabPress, style }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const localizedTabs = TABS(t);

  const handlePress = (tabId) => {
    Haptics.selectionAsync(); // Selection is subtle and perfect for tabs
    if (onTabPress) onTabPress(tabId);
  };

  const renderIcon = (tab) => {
    const isActive = activeTab === tab.id;
    const color = isActive ? '#1E1F24' : '#62636C';

    switch (tab.id) {
      case 'home':
        return isActive ? <HomeSolid color={color} /> : <HomeOutline color={color} />;
      case 'attendance':
        return isActive ? <AttendanceSolid color={color} /> : <AttendanceOutline color={color} />;
      case 'task':
        return isActive ? <TaskSolid color={color} /> : <TaskOutline color={color} />;
      case 'report':
        return isActive ? <ReportSolid color={color} /> : <ReportOutline color={color} />;
        case 'settings':
        return isActive ? <SettingsSolid color={color} /> : <SettingsOutline color={color} />;
      default:
        return <Ionicons name={tab.icon} size={24} color={color} />;
    }
  };

  return (
    <View style={[styles.container, { bottom: Math.max(insets.bottom, 16) }, style]}>
      {/* Top Blue Shade Gradient Line */}
      <LinearGradient
        colors={['rgba(57, 92, 198, 0)', '#395CC6', 'rgba(57, 92, 198, 0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topGradientLine}
      />
      <View style={styles.contentContainer}>
        <View style={styles.tabBar}>
          {localizedTabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                activeOpacity={0.7}
                onPress={() => handlePress(tab.id)}
              >
                {renderIcon(tab)}
                {isActive && (
                  <Text 
                    style={[styles.label, styles.activeLabel]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {tab.label.length > 8 ? `${tab.label.substring(0, 8)}...` : tab.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    shadowColor: '#395CC6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  topGradientLine: {
    height: 2,
    width: 150,
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    zIndex: 11,
  },
  contentContainer: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 70 : 64,
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12, // Figma says 13px but 12 often fits better on mobile, stick to 12-13
    color: '#62636C', // Grey-4
    fontFamily: 'System',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#1E1F24', // Grey-5
    fontWeight: '600',
  },
});
