import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, Dimensions, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RegularizationDetailsSheet from '../components/home/RegularizationDetailsSheet';
import RegularizeModal from '../components/home/RegularizeModal';
import { useRegularization } from '../context/RegularizationContext';

import DeleteConfirmationModal from '../components/home/DeleteConfirmationModal';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';

const { height } = Dimensions.get('window');

export default function RegularizationScreen({ onBack }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { requests, attendanceStatus, deleteRequest, fetchRequests, fetchAttendanceStatus } = useRegularization();

  useEffect(() => {
    // console.log('🚀 [SCREEN] RegularizationScreen Mounted - Triggering Data Fetch');
    fetchRequests();
    fetchAttendanceStatus();
  }, []);
  const paddingTop = insets.top;

  // Use raw english strings for internal state/filtering, translating only for display
  const [activeTab, setActiveTab] = useState('Pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isRegularizeModalVisible, setIsRegularizeModalVisible] = useState(false);
  const [regularizeDate, setRegularizeDate] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const filteredData = requests.filter(item => 
    item.status === activeTab && 
    (item.typeId === 'manual_log')
  );

  const handleCardPress = (item) => {
    setSelectedRequest(item);
    setIsSheetVisible(true);
  };

  const handleDeletePress = (item) => {
    setItemToDelete(item);
    setIsDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteRequest(itemToDelete.id);
    }
    setIsDeleteModalVisible(false);
    setItemToDelete(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return '#2ECC40';
      case 'Rejected': return '#E74C3C';
      case 'Pending': return '#F39C12';
      default: return '#62636C';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'Approved': return 'rgba(46, 204, 64, 0.1)';
      case 'Rejected': return 'rgba(231, 76, 60, 0.1)';
      case 'Pending': return 'rgba(243, 156, 18, 0.1)';
      default: return 'rgba(98, 99, 108, 0.1)';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#8EA3E3', '#FFFFFF']}
        locations={[0, 0.3]} 
        style={styles.background}
      />

      {/* Fixed Header and Tabs Area */}
      <View style={{ paddingTop: paddingTop + 12, paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t(tokens.dashboard.regularize)}</Text>
          <View style={{ width: 40 }} /> 
        </View>

        {/* My Requests & Tabs */}
        <View style={styles.tabsContainer}>
          <Text style={styles.sectionTitle}>{t(tokens.dashboard.requests)}</Text>
          <View style={styles.tabBar}>
            {['Pending', 'Approved', 'Rejected'].map((tab) => (
              <TouchableOpacity 
                key={tab} 
                style={[
                  styles.tabItem, 
                  activeTab === tab && styles.activeTabItem,
                  activeTab === tab && { backgroundColor: '#4169E1' }
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[
                  styles.tabText, 
                  activeTab === tab && styles.activeTabText
                ]}>
                  {tab === 'Pending' ? t(tokens.actions.pending) : 
                   tab === 'Approved' ? t(tokens.actions.approved) : 
                   t(tokens.actions.rejected)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Scrollable List container */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContainer, { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4 }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t(tokens.dashboard.noRequests)}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => handleCardPress(item)}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.dateText}>{item.date}</Text>
                  <Text style={styles.submittedText}>{item.submittedOn}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status === 'Pending' ? t(tokens.regularization.pending) : item.status === 'Approved' ? t(tokens.regularization.approved) : item.status === 'Rejected' ? t(tokens.regularization.rejected) : item.status}
                  </Text>
                </View>
              </View>
              
              <View style={styles.separator} />
              
              <View style={styles.cardBody}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>{t(tokens.regularization.requestedIn)}</Text>
                  <Text style={styles.timeValue}>{item.requestedIn}</Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>{t(tokens.regularization.requestedOut)}</Text>
                  <Text style={styles.timeValue}>{item.requestedOut}</Text>
                </View>
                
                {item.status === 'Pending' && (
                  <TouchableOpacity 
                    style={styles.deleteIcon}
                    onPress={() => handleDeletePress(item)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <RegularizationDetailsSheet 
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        data={selectedRequest}
      />

      <DeleteConfirmationModal 
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onDelete={handleConfirmDelete}
      />

      <RegularizeModal
        visible={isRegularizeModalVisible}
        onClose={() => setIsRegularizeModalVisible(false)}
        date={regularizeDate}
        onSubmit={(payload) => {
          // You might have addRequest here, depending on your RegularizeModal logic
          // Make sure RegularizeModal calls your addRequest or ProfileServices directly.
          setIsRegularizeModalVisible(false);
          fetchAttendanceStatus();
        }}
      />
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
    height: height,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 24,
  },
  backButton: {
    padding: 12,
    marginLeft: -12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1F24',
  },
  tabsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1F24',
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    padding: 4,
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeTabItem: {
    backgroundColor: '#4169E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    color: '#62636C',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFF0F3',
    overflow: 'hidden', // Required for absolute badge positioning
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    position: 'relative', // Context for absolute badge
  },
  dateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E1F24',
    marginBottom: 6,
  },
  submittedText: {
    fontSize: 12,
    color: '#1E1F24',
    opacity: 0.47,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 0, // content is clipped by card radius anyway, but usually 0 here if flush
    position: 'absolute',
    top: -16,
    right: -16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#EFF0F3',
    marginBottom: 16,
    marginTop: 4,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 4, // Add some breathing room if needed
  },
  timeCol: {
    flex: 1,
    gap: 6,
  },
  verticalLine: {
    width: 1,
    height: 32,
    backgroundColor: '#EFF0F3',
    marginHorizontal: 16,
  },
  timeLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    color: '#1E1F24',
    fontWeight: '500',
  },
  deleteIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#FEE2E2', // Light red background matching image
    borderTopLeftRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: -16,
    right: -16,
    zIndex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9E9E9E',
    fontSize: 14,
  }
});
