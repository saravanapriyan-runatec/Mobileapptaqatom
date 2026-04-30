import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MegaPhoneIcon } from '../icons/MegaPhoneIcon';
import { announcementsAPI } from '../../utils/api';
import { get } from 'lodash';
import AnnouncementDetailSheet from './AnnouncementDetailSheet';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';
import SkeletonLoader from './SkeletonLoader';

export default React.memo(function AnnouncementSection({ onNavigate }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchAnnouncements();
  }, [i18n.language]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementsAPI.getAll();
      console.log('DEBUG: AnnouncementSection Response:', JSON.stringify(response, null, 2));
      const data = get(response, 'results') || (Array.isArray(response) ? response : []);
      setAnnouncements(data.slice(0, 5));
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const p = String(priority).toLowerCase();
    if (p.includes('high')) return '#E74C3C';
    if (p.includes('low')) return '#2ECC71';
    return '#F39C12';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Dec 22 2024';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Dec 22 2024';
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleCardPress = (item) => {
    setSelectedAnnouncement(item);
    setDetailVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t(tokens.dashboard.announcements)}</Text>
        </View>
        <View style={styles.listContainer}>
          {[1, 2].map(i => (
            <View key={i} style={styles.card}>
              <SkeletonLoader width={78} height={83} borderRadius={8} style={{ marginRight: 12 }} />
              <View style={styles.contentContainer}>
                <SkeletonLoader width={150} height={18} borderRadius={4} style={{ marginBottom: 8 }} />
                <SkeletonLoader width={200} height={12} borderRadius={4} style={{ marginBottom: 4 }} />
                <SkeletonLoader width={180} height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error && announcements.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchAnnouncements} style={styles.retryButton}>
          <Text style={styles.retryText}>{t(tokens.common.retry)}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t(tokens.dashboard.announcements)}</Text>
        <TouchableOpacity onPress={() => onNavigate && onNavigate('announcement')}>
          <Text style={styles.viewAll}>{t(tokens.dashboard.viewAll)}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {announcements.length === 0 ? (
          <Text style={styles.emptyText}>{t(tokens.dashboard.noAnnouncements)}</Text>
        ) : (
          announcements.map((announcement, index) => (
            <TouchableOpacity
              key={`announcement-${announcement.id || index}-${index}`}
              style={styles.card}
              onPress={() => handleCardPress(announcement)}
            >
              {/* Left Icon / Image */}
              <View style={styles.iconContainer}>
                {announcement?.Announcement_type === 1 && 
                  <Image source={require("../../../assets/birthday.jpg")} style={styles.images} />
                }
                {announcement?.Announcement_type === 2 && 
                  <Image source={require("../../../assets/custom.jpg")} style={styles.images} />
                }
                {announcement?.Announcement_type === 3 && 
                  <Image source={require("../../../assets/holidays.jpg")} style={styles.images} />
                }
                {announcement?.Announcement_type === 4 && 
                  <Image source={require("../../../assets/microphone.jpg")} style={styles.images} />
                }
                {!announcement?.Announcement_type && 
                  <Ionicons name="megaphone-outline" size={24} color="#B0B0B0" />
                }
              </View>

              {/* Right Content */}
              <View style={styles.contentContainer}>
                <View style={styles.titleRow}>
                  <View style={{ marginRight: 4 }}>
                    <MegaPhoneIcon width={14} height={14} />
                  </View>
                  <Text style={styles.announcementTitle} numberOfLines={1}>
                    {announcement.title || t(tokens.dashboard.noTitle)}
                  </Text>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                  {announcement.content || announcement.description || t(tokens.common.na)}
                </Text>

                <View style={styles.metaRow}>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={12} color="#80828D" />
                    <Text style={styles.dateText}>
                      {formatDate(announcement.updated_at || announcement.created_at || announcement.date)}
                    </Text>
                  </View>
                  {(announcement.priority || announcement.priority_level) && (
                    <>
                      <View style={styles.divider} />
                      <Text style={[styles.priorityText, { color: getPriorityColor(announcement.priority || announcement.priority_level) }]}>
                        {announcement.priority || announcement.priority_level}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#C4C4C4" />
            </TouchableOpacity>
          ))
        )}
      </View>

      <AnnouncementDetailSheet
        visible={detailVisible}
        announcement={selectedAnnouncement}
        onClose={() => setDetailVisible(false)}
        onAcknowledge={() => setDetailVisible(false)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    // marginBottom: 0,
    paddingRight: 0,
    minHeight: 100,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#395CC6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryText: {
    color: '#FFF',
    fontSize: 12,
  },
  emptyText: {
    color: '#80828D',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
  },
  viewAll: {
    fontSize: 12,
    color: '#395CC6',
    fontWeight: '500',
  },
  listContainer: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFF0F3',
    padding: 12,
    borderRadius: 8,
    marginBottom:5
  },
  iconContainer: {
    width: 78,
    height: 83,
    borderRadius: 8,
    backgroundColor: '#EFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  images: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
    flex: 1, // Allow title to take space
  },
  description: {
    fontSize: 11,
    color: '#80828D',
    lineHeight: 16,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#80828D',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#B9BBC6',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
