import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from '../../../Services/AuthService';
import ProfileServices from '../../../Services/API/ProfileServices';
import { useUser } from '../../context/UserContext';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';
import SkeletonLoader from './SkeletonLoader';
import { getAbsoluteProfileUrl } from '../../utils/imageUtils';

export default function ProfileHeader({ onNavigate, onToggleActivities }) {
  const { t, i18n } = useTranslation();
  const { userDetails, loading: userLoading } = useUser();
  const isArabic = i18n.language === 'ar';
  const [userName, setUserName] = useState('Employee');
  const [greeting, setGreeting] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [gender, setGender] = useState('M'); // Default to M
  const [unreadCount, setUnreadCount] = useState(0);

  // Update UI when user details change
  useEffect(() => {
    if (userDetails) {
      // console.log('DEBUG [ProfileHeader]: Updating UI with User Details from Context');
      
      let displayName = userDetails.employee_name || '';
      if (!displayName) {
        const firstName = userDetails.first_name || userDetails.firstName || '';
        const lastName = userDetails.last_name || userDetails.lastName || '';
        displayName = `${firstName} ${lastName}`.trim();
      }

      if (!displayName && (userDetails.nickname || userDetails.name)) {
        displayName = userDetails.nickname || userDetails.name;
      }

      const finalName = displayName || userDetails.username || userDetails.email || 'Employee';
      const truncatedName = finalName.length > 12 ? finalName.substring(0, 12) + '...' : finalName;
      setUserName(truncatedName);

      if (userDetails.gender) {
        setGender(userDetails.gender);
      }

      if (userDetails.profile_url && userDetails.profile_url !== 'null' && userDetails.profile_url.trim() !== '') {
        setProfileImage(getAbsoluteProfileUrl(userDetails.profile_url, userDetails._fetchTime));
      } else {
        setProfileImage(null);
      }
    }

    const hours = new Date().getHours();
    if (hours < 12) setGreeting(t(tokens.common.goodMorning));
    else if (hours < 17) setGreeting(t(tokens.common.goodafternoon));
    else if (hours < 21) setGreeting(t(tokens.common.goodevening));
    else setGreeting(t(tokens.common.goodNight));
  }, [userDetails?.id, userDetails?.employee_name, userDetails?.profile_url, userDetails?._fetchTime, t]);

  // Handle unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const data = await ProfileServices.getUnreadNotifications();
        // console.log('API RESPONSE [Dashboard Unread Count]:', JSON.stringify(data, null, 2));
        const count = (data?.count !== undefined) ? data.count : (Array.isArray(data) ? data.length : (data?.results?.length || 0));
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []); // Only on mount

  // Helper to get image source with local fallbacks
  const getProfileImage = () => {
    console.log('DEBUG [ProfileHeader] raw profileImage state:', profileImage);
    if (profileImage && profileImage !== 'null' && profileImage.trim() !== '') {
      if (profileImage.startsWith('http')) {
        console.log('DEBUG [ProfileHeader] returning network source for:', profileImage);
        return { 
          uri: profileImage,
          headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache', 'CacheBust': userDetails?._fetchTime?.toString() || Date.now().toString() }
        };
      }
      console.log('DEBUG [ProfileHeader] returning local uri source for:', profileImage);
      return { uri: profileImage };
    }

    // Dynamic gender-based fallback
    const isFemale = gender?.toUpperCase() === 'F' || gender?.toLowerCase() === 'female';
    
    try {
      console.log('DEBUG [ProfileHeader] returning local fallback asset');
      return isFemale 
        ? require('../../../assets/female-profile-image.png') 
        : require('../../../assets/male-profile-image.png');
    } catch (err) {
      console.warn('Local profile assets not found, falling back to remote placeholders');
      return { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&color=fff` };
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.leftSection} onPress={() => onNavigate('profileUpdate')}>
        {/* Avatar */}
        {userLoading ? (
          <SkeletonLoader width={36} height={36} borderRadius={18} />
        ) : (
          <Image
            source={getProfileImage()}
            style={[styles.avatar, { backgroundColor: '#F0F0F0' }]} // Fallback background for visibility
            key={`${profileImage}-${gender}`} // Include gender in key to force re-render
            onError={(e) => console.log('DEBUG [ProfileHeader] Image Load ERROR:', e.nativeEvent.error)}
          />
        )}

        {/* Text Info */}
        <View style={styles.textContainer}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <View style={styles.nameRow}>
            {userLoading ? (
              <SkeletonLoader width={100} height={18} borderRadius={4} />
            ) : (
              <>
                <Text 
                  style={styles.nameText} 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {userName}
                </Text>
                {/* Smile Icon */}
                <Ionicons name="happy" size={16} color="#FFC107" style={styles.smileIcon} />
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Right Actions */}
      <View style={styles.actionsContainer}>
        {/* Notification Button */}
        <TouchableOpacity style={styles.iconButton} onPress={() => onNavigate('notifications')}>
          <View style={styles.blurBackground} />
          <Ionicons name="notifications-outline" size={20} color="#1E1F24" />
          {unreadCount > 0 && (
            <View style={styles.notificationDot}>
              <Text style={styles.notificationCountText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Language Toggle Button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            const newLang = isArabic ? 'en' : 'ar';
            i18n.changeLanguage(newLang);
            AsyncStorage.setItem('appLanguage', newLang);
          }}
        >
          <View style={styles.blurBackground} />
          <Text style={styles.langText}>{isArabic ? 'EN' : 'ع'}</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingVertical: 12, // Increased spacing slightly
    // The width will be handled by the parent padding
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  textContainer: {
    justifyContent: 'center',
    gap: 2,
  },
  greetingText: {
    fontSize: 12,
    color: '#1E1F24',
    fontFamily: 'System',
    opacity: 0.8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1F24',
  },
  smileIcon: {
    marginLeft: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
    overflow: 'hidden',
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    opacity: 0.5,
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
  notificationCountText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
  langText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1F24',
  },
});
