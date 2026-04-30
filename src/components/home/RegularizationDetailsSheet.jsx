import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';
import SwipeableBottomSheet from '../common/SwipeableBottomSheet';
import moment from 'moment';

const { height } = Dimensions.get('window');

const RegularizationDetailsSheet = ({ visible, onClose, data, onManage }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [localData, setLocalData] = useState(null);
  
  useEffect(() => {
    if (visible && data) {
      setLocalData(data);
    }
  }, [visible, data]);

  const displayData = data || localData;

  if (!displayData && !visible) return null;

  const handleDelete = () => {
    // Logic to delete the request would go here
    // console.log('Deleting request:', displayData.id);
    setShowDeleteModal(false);
    onClose();
  };

  // Normalized data for display
  const submittedOn = displayData.submittedOn || (displayData.created_at ? moment(displayData.created_at).format('DD MMM YYYY, hh:mm A') : 'N/A');
  const status = displayData.status || 'Pending';
  const dateStr = displayData.date ? moment(displayData.date).format('DD MMM YYYY') : 'N/A';
  const shiftName = displayData.shift || displayData.shift_name || '--';
  const typeId = displayData.typeId || 'manual_log';
  const typeLabel = displayData.type || displayData.tag || 'Request';
  
  // Type-specific field mapping
  const DetailRow = ({ label, value }) => {
    if (!value || value === '--' || value === '--:--' || value === 'N/A' || value === 'undefined' || value === '-- Hours') return null;
    return (
      <>
        <View style={styles.detailRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
        <View style={styles.separator} />
      </>
    );
  };

  const renderDetails = () => {
    switch (String(typeId).toLowerCase()) {
      case 'leave':
        return (
          <>
            <DetailRow label={t(tokens.regularization.leaveType || 'Leave Type')} value={displayData.leave_type_name || displayData.leave_type || displayData.type} />
            <DetailRow label={t(tokens.regularization.dateRange || 'Date Range')} value={displayData.from_date && displayData.to_date ? `${displayData.from_date} to ${displayData.to_date}` : null} />
            <DetailRow label={t(tokens.regularization.leaveDays || 'Leave Days')} value={displayData.leave_days ? `${displayData.leave_days} Days` : null} />
            <DetailRow label={t(tokens.dashboard.shift)} value={shiftName} />
            <DetailRow label={t(tokens.dashboard.totalBreakTime || 'Total Break Time')} value={displayData.total_break_time} />
          </>
        );
      case 'overtime':
        const otStart = displayData.start_time ? moment(displayData.start_time).format('hh:mm A') : '--:--';
        const otEnd = displayData.end_time ? moment(displayData.end_time).format('hh:mm A') : '--:--';
        return (
          <>
            <DetailRow label={t(tokens.regularization.overtimeType || 'OT Type')} value={displayData.ot_type} />
            <DetailRow label={t(tokens.regularization.overtimeHours || 'OT Hours')} value={displayData.ot_hours ? `${displayData.ot_hours} Hours` : null} />
            <DetailRow label={t(tokens.dashboard.duration)} value={otStart !== '--:--' && otEnd !== '--:--' ? `${otStart} - ${otEnd}` : null} />
            <DetailRow label={t(tokens.dashboard.shift)} value={shiftName} />
            <DetailRow label={t(tokens.dashboard.totalBreakTime || 'Total Break Time')} value={displayData.total_break_time} />
          </>
        );
      case 'training':
        const trainStart = displayData.start_time ? moment(displayData.start_time).format('DD MMM, hh:mm A') : '--:--';
        const trainEnd = displayData.end_time ? moment(displayData.end_time).format('DD MMM, hh:mm A') : '--:--';
        return (
          <>
            <DetailRow label={t(tokens.regularization.trainingName || 'Training Name')} value={displayData.training_name || (displayData.typeId === 'training' ? displayData.type : null)} />
            <DetailRow label={t(tokens.regularization.trainingStart || 'Training Start')} value={trainStart} />
            <DetailRow label={t(tokens.regularization.trainingEnd || 'Training End')} value={trainEnd} />
            <DetailRow label={t(tokens.dashboard.shift)} value={shiftName} />
            <DetailRow label={t(tokens.dashboard.totalBreakTime || 'Total Break Time')} value={displayData.total_break_time} />
          </>
        );
      case 'permission':
        const permStart = displayData.start_time ? moment(displayData.start_time).format('hh:mm A') : '--:--';
        const permEnd = displayData.end_time ? moment(displayData.end_time).format('hh:mm A') : '--:--';
        return (
          <>
            <DetailRow label={t(tokens.regularization.permissionHours || 'Permission Hours')} value={displayData.permission_hours ? `${displayData.permission_hours} Hours` : null} />
            <DetailRow label={t(tokens.regularization.duration || 'Duration')} value={permStart !== '--:--' && permEnd !== '--:--' ? `${permStart} - ${permEnd}` : null} />
            <DetailRow label={t(tokens.dashboard.totalBreakTime || 'Total Break Time')} value={displayData.total_break_time} />
          </>
        );
      case 'wfh':
        const wfhStart = displayData.start_time ? moment(displayData.start_time).format('DD MMM YYYY') : null;
        const wfhEnd = displayData.end_time ? moment(displayData.end_time).format('DD MMM YYYY') : null;
        return (
          <>
            <DetailRow label={t(tokens.regularization.wfhType || 'WFH Type')} value={displayData.wfh_type} />
            <DetailRow label={t(tokens.regularization.wfhDays || 'WFH Days')} value={displayData.wfh_days ? `${displayData.wfh_days} Days` : null} />
            <DetailRow label={t(tokens.regularization.duration || 'Duration')} value={wfhStart && wfhEnd ? `${wfhStart} - ${wfhEnd}` : null} />
            <DetailRow label={t(tokens.dashboard.totalBreakTime || 'Total Break Time')} value={displayData.total_break_time} />
          </>
        );
      default: // manual_log, etc.
        const reqIn = displayData.requestedIn || (() => {
          const time = displayData.punch_time || displayData.start_time || 
                       (displayData.manual_log_details?.[0]?.actual_check_in) || 
                       (displayData.manual_log_details?.[0]?.punch_time);
          return time ? moment(time).format('hh:mm A') : '--:--';
        })();
        const reqOut = displayData.requestedOut || (() => {
          const time = displayData.end_time || 
                       (displayData.manual_log_details?.[0]?.actual_check_out);
          return time ? moment(time).format('hh:mm A') : '--:--';
        })();
        return (
          <>
            <DetailRow label={t(tokens.dashboard.shift)} value={shiftName} />
            <DetailRow label={t(tokens.dashboard.requestedCheckIn)} value={reqIn} />
            <DetailRow label={t(tokens.dashboard.requestedCheckOut)} value={reqOut} />
            <DetailRow label={t(tokens.dashboard.totalBreakTime || 'Total Break Time')} value={displayData.total_break_time} />
          </>
        );
    }
  };

  const reason = displayData.reason || 'No reason provided';
  
  const handleManage = () => {
    onClose();
    if (onManage) onManage();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return '#2ECC40';
      case 'rejected': return '#E74C3C';
      case 'pending': return '#F39C12';
      default: return '#62636C';
    }
  };

  const getStatusBg = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'rgba(46, 204, 64, 0.1)';
      case 'rejected': return 'rgba(231, 76, 60, 0.1)';
      case 'pending': return 'rgba(243, 156, 18, 0.1)';
      default: return 'rgba(98, 99, 108, 0.1)';
    }
  };

  return (
    <>
      <SwipeableBottomSheet
        visible={visible}
        onClose={onClose}
        contentStyle={styles.sheetContent}
      >
        <View style={styles.modalHandle} />
        
        {!displayData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4169E1" />
          </View>
        ) : (
          <View style={styles.sheetContainer}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.headerTitle}>{typeLabel}</Text>
                <Text style={styles.headerSubtitle}>{submittedOn}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBg(status) }]}>
                <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                  {status}
                </Text>
              </View>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              style={styles.scrollStyle}
            >
              {/* Details Card */}
              <View style={styles.card}>
                <DetailRow label={t(tokens.dashboard.dateTime)} value={dateStr} />
                
                {renderDetails()}

                <View style={styles.separator} />
                <View style={styles.detailRowVertical}>
                  <Text style={styles.label}>{t(tokens.common.reason)}</Text>
                  <Text style={[styles.value, styles.reasonText]}>"{reason}"</Text>
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={[styles.actionRow, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>{t(tokens.common.close)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.manageButton} onPress={handleManage}>
                <Text style={styles.manageButtonText}>{t(tokens.dashboard.viewAll)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SwipeableBottomSheet>

      <DeleteConfirmationModal 
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
      />
    </>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    backgroundColor: '#F7F8F9',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    padding: 24,
    paddingBottom: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DEDFE4',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  sheetContainer: {
    maxHeight: height * 0.82,
  },
  scrollStyle: {
    flexShrink: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1F24',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#62636C',
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFF0F3',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailRowVertical: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: '#62636C',
    opacity: 0.7,
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E1F24',
  },
  reasonText: {
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F2F5',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEDFE4',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
  },
  manageButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#4169E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RegularizationDetailsSheet;
