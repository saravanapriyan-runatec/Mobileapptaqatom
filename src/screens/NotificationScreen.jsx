import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileServices from '../../Services/API/ProfileServices';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import moment from 'moment';
import 'moment/locale/ar';

const { width } = Dimensions.get('window');

export default function NotificationScreen({ onBack, onNavigate }) {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    moment.locale(i18n.language);
  }, [i18n.language]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [counts, setCounts] = useState({ all: 0, unread: 0 });

  const fetchNotifications = useCallback(async (isRefresh = false, isLoadMore = false) => {
    if (isLoadMore && (loadingMore || !hasMore)) return;
    
    if (isRefresh) setRefreshing(true);
    else if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    const targetPage = isLoadMore ? page + 1 : 1;
    
    try {
      // Always fetch both for counts, but only paginate the active tab
      const [allData, unreadData] = await Promise.all([
        ProfileServices.getNotifications(targetPage),
        ProfileServices.getUnreadNotifications(targetPage)
      ]);
      
      const allList = allData?.results || (Array.isArray(allData) ? allData : []);
      const unreadList = unreadData?.results || (Array.isArray(unreadData) ? unreadData : []);
      
      setCounts({
        all: allData?.count || allList.length,
        unread: unreadData?.count || unreadList.length
      });

      const currentList = activeTab === 'unread' ? unreadList : allList;
      const nextLink = activeTab === 'unread' ? unreadData?.next : allData?.next;

      if (isLoadMore) {
        setNotifications(prev => [...prev, ...currentList]);
      } else {
        setNotifications(currentList);
      }
      
      setPage(targetPage);
      setHasMore(!!nextLink);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [activeTab, page, loadingMore, hasMore]);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]); // Fetch fresh list on tab change

  const onRefresh = () => {
    fetchNotifications(true);
  };

  const handleLoadMore = () => {
    fetchNotifications(false, true);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await ProfileServices.markNotifyAsRead({ notification_ids: [id] });
      // Refresh list after marking as read
      fetchNotifications(true);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleNotificationPress = async (item) => {
    try {
      // 1. Mark as read
      await ProfileServices.markNotifyAsRead({ notification_ids: [item.id] });
      
      // 2. Refresh list
      fetchNotifications(true);

      // 3. Dynamic Navigation
      const link = item.link;
      const sender = item.system_sender?.toLowerCase() || '';
      const content = item.content?.toLowerCase() || '';

      // Helper to handle back and navigate with delay for smooth UI
      const navigateTo = (view, params = null) => {
        onBack && onBack();
        setTimeout(() => onNavigate && onNavigate(view, params), 100);
      };

      if (link) {
        const paths = link.split('/').filter(Boolean);
        
        // Logical mapping based on legacy app patterns
        if (paths.includes('employeeApproval') || paths.includes('request')) {
          if (paths.includes('manualLog')) {
            navigateTo('request', { activeType: 'manual_log' });
          } else if (paths.includes('leave')) {
            navigateTo('request', { activeType: 'leave' });
          } else if (paths.includes('overtime')) {
            navigateTo('request', { activeType: 'overtime' });
          } else if (paths.includes('training')) {
            navigateTo('request', { activeType: 'training' });
          } else if (paths.includes('permission')) {
            navigateTo('request', { activeType: 'permission' });
          } else if (paths.includes('wfh')) {
            navigateTo('request', { activeType: 'wfh' });
          } else if (paths.includes('resign')) {
            // Placeholder for resignation if applicable, otherwise default to request
            navigateTo('request');
          }
        } else if (paths.includes('payroll') && paths.includes('payslips')) {
          navigateTo('payslip');
        } else if (paths.includes('employeeShift')) {
          navigateTo('shiftDetails');
        } else if (paths.includes('orgStructure')) {
          navigateTo('profileUpdate');
        } else if (paths.includes('loan')) {
          navigateTo('loan');
        } else if (paths.includes('expense')) {
          navigateTo('expense');
        }
      } else {
        // Fallback to text matching if link is missing
        if (sender.includes('leave') || content.includes('leave')) {
          navigateTo('request', { activeType: 'leave' });
        } else if (sender.includes('manual') || sender.includes('attendance') || content.includes('manual log')) {
          navigateTo('request', { activeType: 'manual_log' });
        } else if (sender.includes('loan') || content.includes('loan')) {
          navigateTo('loan');
        } else if (sender.includes('expense')) {
          navigateTo('expense');
        } else if (sender.includes('overtime')) {
          navigateTo('request', { activeType: 'overtime' });
        } else if (sender.includes('training')) {
          navigateTo('request', { activeType: 'training' });
        } else if (sender.includes('permission')) {
          navigateTo('request', { activeType: 'permission' });
        } else if (sender.includes('work from home') || sender.includes('wfh')) {
          navigateTo('request', { activeType: 'wfh' });
        }
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const renderNotificationItem = ({ item }) => {
    // Mapping API fields to our UI
    const title = item.system_sender || t(tokens.nav.notification);
    const message = item.content || t(tokens.messages.noDescription);
    const time = item.notification_time;

    // Format date - "Mar 18 2026, 16:00"
    const date = time ? moment(time).format('MMM DD YYYY, HH:mm') : t(tokens.common.na);

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="notifications-outline" size={18} color="#666" />
        </View>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
        <Text style={styles.cardDescription} numberOfLines={3}>
          {message}
        </Text>
        <Text style={styles.cardDate}>{date}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#8EA3E3', '#FFFFFF']}
        locations={[0, 0.3]}
        style={styles.background}
      />

      {/* Fixed Header and Tabs Section */}
      <View style={{ paddingTop: insets.top + 12 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t(tokens.notifications.title)}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.activeTab]} 
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
              {t(tokens.notifications.all)} ({counts.all})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'unread' && styles.activeTab]} 
            onPress={() => setActiveTab('unread')}
          >
            <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
              {t(tokens.notifications.unread)} ({counts.unread})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content (Scrollable List) */}
      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-off-outline" size={48} color="#BDC3C7" />
            </View>
            <Text style={styles.emptyTitle}>{t(tokens.notifications.noNotificationsTitle)}</Text>
            <Text style={styles.emptyDescription}>
              {t(tokens.notifications.noNotificationsDesc)}
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />
            }
            ListFooterComponent={() => 
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#4A90E2" />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
  },
  tabContainer: {
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
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFF2F5',
    ...Platform.select({
      ios: {
        shadowColor: '#1E1F24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E1F24',
    flex: 1,
    marginRight: 40, // Space for the absolute icon
    marginTop: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: '#F0F3F7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  cardDescription: {
    fontSize: 13,
    color: '#8E949A',
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: '400',
  },
  cardDate: {
    fontSize: 11,
    color: '#8E949A',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#95A5A6',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F3F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1F24',
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#8E949A',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
