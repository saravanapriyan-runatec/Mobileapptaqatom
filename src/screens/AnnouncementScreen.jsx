import { ActivityIndicator, Image, FlatList, StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform, TextInput, RefreshControl, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/FontAwesome';
import { announcementsAPI } from '../utils/api';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import moment from 'moment';
import 'moment/locale/ar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MegaPhoneIcon } from '../components/icons/MegaPhoneIcon';
import AnnouncementDetailSheet from '../components/home/AnnouncementDetailSheet';
import EmptyState from '../components/common/EmptyState';
import { get } from 'lodash';
import SkeletonLoader from '../components/home/SkeletonLoader';
import React, { useState, useEffect, useRef } from 'react';
const { height, width } = Dimensions.get('window');

const AnnouncementScreen = ({ onBack }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const PAGE_SIZE = 10;
   
  const { t, i18n } = useTranslation();

  useEffect(() => {
    moment.locale(i18n.language);
  }, [i18n.language]);
  const insets = useSafeAreaInsets();
  const isRTL = i18n.language === 'ar';

  async function fetchAnnouncements(pageNum = 1, isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setIsFetchingNextPage(true);
      }

      setError(null);

      // Use the API utility function from utils/api.js
      const data = await announcementsAPI.getAll(pageNum, PAGE_SIZE);
      // console.log('DEBUG: Announcement Response:', JSON.stringify(data, null, 2));

      const newResults = data.results || [];
      if (pageNum === 1) {
        setAnnouncements(newResults);
      } else {
        setAnnouncements(prev => [...prev, ...newResults]);
      }
      
      setTotalCount(data.count || 0);
      setTotalPages(Math.ceil((data.count || 0) / PAGE_SIZE));
    } catch (err) {
      setError(err.message || "Failed to load announcements");
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsFetchingNextPage(false);
    }
  }


  useEffect(() => {
    fetchAnnouncements(page);
  }, [page]);

  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages && pageNum !== page) {
      setPage(pageNum);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !isFetchingNextPage && page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      // fetchAnnouncements(nextPage); // useEffect will trigger this
    }
  };

  const formatDateToIST = (dateString) => {
    if (!dateString) return t(tokens.common.na);
    return moment(dateString).format('DD MMM YYYY, hh:mm A');
  };

  const handleCardPress = (item) => {
    setSelectedAnnouncement(item);
    setDetailVisible(true);
  };

  const getPriorityColor = (priority) => {
    const p = String(priority || '').toLowerCase();
    if (p.includes('high')) return '#E74C3C';
    if (p.includes('low')) return '#2ECC71';
    return '#F39C12';
  };

  const AnimatedListItem = ({ children, index }) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 500,
        delay: index * 100, // Staggered delay
        useNativeDriver: true,
      }).start();
    }, [index]);

    const translateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    return (
      <Animated.View style={{ opacity: animatedValue, transform: [{ translateY }] }}>
        {children}
      </Animated.View>
    );
  };

  const filteredAnnouncements = announcements.filter(item => {
    const matchesSearch = (item.title || item.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.description || item.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    // For now, "unread" is just a placeholder as the API doesn't provide it
    // If the user selects "unread", we'll just show nothing or everything for now to avoid confusion
    if (activeTab === 'unread') return false; 
    
    return matchesSearch;
  });

  const renderItem = ({ item, index }) => (
    <AnimatedListItem index={index}>
      <TouchableOpacity 
        key={item.id || index} 
        style={styles.card}
        onPress={() => handleCardPress(item)}
      >
        {/* Left Image Section */}
        <View style={styles.cardLeft}>
          <View style={styles.imageWrapper}>
            {item?.Announcement_type === 1 && 
              <Image source={require("../../assets/birthday.jpg")} style={styles.images} />
            }
            {item?.Announcement_type === 2 && 
              <Image source={require("../../assets/custom.jpg")} style={styles.images} />
            }
            {item?.Announcement_type === 3 && 
              <Image source={require("../../assets/holidays.jpg")} style={styles.images} />
            }
            {item?.Announcement_type === 4 && 
              <Image source={require("../../assets/microphone.jpg")} style={styles.images} />
            }
            {!item?.Announcement_type && 
              <View style={[styles.images, { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={32} color="#CBD5E0" />
              </View>
            }
          </View>
        </View>
  
        {/* Right Content Section */}
        <View style={styles.cardRight}>
          <View style={styles.titleRow}>
            <Ionicons name="megaphone" size={16} color="#E74C3C" style={{ marginRight: 6 }} />
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title || t(tokens.common.untitled)}
            </Text>
          </View>
  
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description || t(tokens.messages.noDescription)}
          </Text>
  
          <View style={styles.footerRow}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
              <Text style={styles.dates}>
                {formatDateToIST(item.created_at || item.date || item.updated_at)}
              </Text>
            </View>
            {(item.priority || item.priority_level) && (
              <View style={styles.priorityContainer}>
                <View style={styles.divider} />
                <Text style={[styles.priorityText, { color: getPriorityColor(item.priority || item.priority_level) }]}>
                  {item.priority || item.priority_level}
                </Text>
              </View>
            )}
          </View>
        </View>
  
        <Ionicons name="chevron-forward" size={20} color="#CBD5E0" style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </AnimatedListItem>
  );

  const Header = () => (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
       <TouchableOpacity onPress={onBack} style={styles.backButton}>
         <Ionicons name="arrow-back" size={24} color="#1E1F24" />
       </TouchableOpacity>
       <Text style={styles.headerTitle}>{t(tokens.dashboard.announcements)}</Text>
       <View style={{ width: 40 }} />
     </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8EA3E3', '#FFFFFF']}
        locations={[0, 0.3]}
        style={styles.background}
      />
      
      <Header />

      {/* Tabs Section */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            {t(tokens.notifications.all)} {totalCount > 0 ? `(${totalCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            {t(tokens.notifications.unread)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter Row */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder={t(tokens.common.search)}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
          <Ionicons name="search-outline" size={22} color="#94A3B8" />
        </View>
        <TouchableOpacity style={styles.filterDropdown}>
          <Text style={styles.filterText}>{t(tokens.common.filter)}: <Text style={{fontWeight: '500'}}>{t(tokens.common.all)}</Text></Text>
          <Ionicons name="chevron-down" size={18} color="#475569" />
        </TouchableOpacity>
      </View>

      {loading && announcements.length === 0 ? (
        <View style={styles.listContainer}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardLeft}>
                <SkeletonLoader width={86} height={86} borderRadius={12} />
              </View>
              <View style={styles.cardRight}>
                <SkeletonLoader width={150} height={18} borderRadius={4} style={{ marginBottom: 8 }} />
                <SkeletonLoader width={width * 0.5} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
                <SkeletonLoader width={width * 0.4} height={14} borderRadius={4} style={{ marginBottom: 12 }} />
                <View style={styles.footerRow}>
                  <SkeletonLoader width={80} height={12} borderRadius={4} />
                  <View style={styles.divider} />
                  <SkeletonLoader width={50} height={12} borderRadius={4} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAnnouncements}>
            <Text style={styles.retryText}>{t(tokens.messages.retry)}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {loading && announcements.length > 0 && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#3B5998" />
            </View>
          )}

          <FlatList
            data={filteredAnnouncements}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState 
                title={activeTab === 'unread' ? t(tokens.dashboard.noUnreadAnnouncements) : t(tokens.dashboard.noAnnouncements)}
                description={t(tokens.common.allCaughtUp)}
                containerStyle={{ marginTop: height * 0.05 }}
              />
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => fetchAnnouncements(1, true)} tintColor="#3B5998" />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => (
              isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#3B5998" />
                </View>
              ) : null
            )}
          />
        </>
      )}

      {/* Detail Sheet */}
      <AnnouncementDetailSheet
        visible={detailVisible}
        announcement={selectedAnnouncement}
        onClose={() => setDetailVisible(false)}
        onAcknowledge={() => setDetailVisible(false)}
      />
    </View>
  );
};

export default AnnouncementScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  background: { position: 'absolute', left: 0, right: 0, top: 0, height: height },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    paddingHorizontal: 16, 
    paddingBottom: 10 
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E1F24' },
  backButton: { padding: 8, marginLeft: -8 },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#4A69FF',
    shadowColor: '#4A69FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  // Search & Filter
  searchFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E1F24',
    paddingVertical: 8,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#475569',
  },
  
  // Cards
  card: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  cardLeft: {
    marginRight: 14,
  },
  imageWrapper: {
    width: 86,
    height: 86,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  images: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardRight: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titles: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E1F24",
    flex: 1,
  },
  content: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 8,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dates: {
    fontSize: 11,
    color: "#94A3B8",
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Others
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#3B5998",
  },
  loadingOverlay: {
    position: "absolute",
    top: 10,
    right: 16,
    zIndex: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 14,
    color: "#E74C3C",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#3B5998",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  noData: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  noDataText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: '600'
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
    marginBottom: 16,
  },
  pageNumbersWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  navButtonDisabled: {
    backgroundColor: "#F9FAFB",
    borderColor: '#F3F4F6',
  },
  navButtonText: {
    fontSize: 12,
    color: "#3B5998",
    fontWeight: "600",
  },
  navButtonTextDisabled: {
    color: "#9CA3AF",
  },
  pageButton: {
    minWidth: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  activePageButton: {
    backgroundColor: "#3B5998",
    borderColor: '#3B5998',
  },
  pageButtonText: {
    fontSize: 12,
    color: "#1E1F24",
    fontWeight: "500",
  },
  activePageButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  ellipsis: {
    fontSize: 14,
    color: "#94A3B8",
    marginHorizontal: 4,
  },
});
