import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';

import { useRegularization } from '../../context/RegularizationContext';
import RegularizationDetailsSheet from './RegularizationDetailsSheet';
import moment from 'moment';

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

export default React.memo(function RequestSection({ onViewAll }) {
  const { t } = useTranslation();
  const { requests, loading } = useRegularization();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  const pendingRequests = (requests || []).filter(req => {
    const status = (req.status || '').trim().toLowerCase();
    const isPending = status === 'pending' || status === ''; // missing status defaults to pending
    return isPending;
  });

  // console.log('DEBUG: Pending Requests for Dashboard:', JSON.stringify(pendingRequests, null, 2));

  const handleCardPress = (item) => {
    setSelectedRequest(item);
    setIsSheetVisible(true);
  };

  const localizedRequests = pendingRequests.slice(0, 5).map((item, index) => {
    let typeLabel = '';
    let tagLabel = '';

    switch (item.typeId) {
      case 'leave':
        typeLabel = item.leave_name || item.leave_type_name || t(tokens.nav.leave);
        tagLabel = t(tokens.nav.leave);
        break;
      case 'manual_log':
        typeLabel = t(tokens.dashboard.manualLog);
        tagLabel = item.punch_state_display || t(tokens.nav.attendance);
        break;
      case 'overtime':
        typeLabel = t(tokens.requests.overtime);
        tagLabel = t(tokens.nav.attendance);
        break;
      case 'training':
        typeLabel = t(tokens.requests.training);
        tagLabel = t(tokens.requests.training);
        break;
      case 'wfh':
        typeLabel = t(tokens.requests.wfh);
        tagLabel = t(tokens.requests.workFromHome);
        break;
      case 'permission':
        typeLabel = t(tokens.requests.permission);
        tagLabel = t(tokens.requests.permission);
        break;
      default:
        typeLabel = item.type || item.typeId || t(tokens.common.request);
        tagLabel = t(tokens.nav.attendance);
    }
    
    // Safety check for empty labels
    if (!typeLabel || typeLabel === 'undefined') typeLabel = t(tokens.common.request);

    return {
      id: `req-${item.typeId || 'gen'}-${item.id || index}-${index}`,
      type: typeLabel,
      tag: tagLabel,
      punchTime: (() => {
        if (item.typeId === 'leave') {
          return item.date || item.requested_date || (item.created_at ? moment(item.created_at).format('DD MMM YYYY') : 'N/A');
        }
        if (item.typeId === 'wfh') {
          return item.wfh_days ? `${item.wfh_days} ${t(tokens.common.days || 'Days')}` : (item.date || 'N/A');
        }
        const time = item.punch_time || item.start_time || item.actual_check_in || 
                     (item.manual_log_details?.[0]?.actual_check_in) || 
                     (item.manual_log_details?.[0]?.punch_time);
        if (time) return moment(time).format('hh:mm A');
        return item.date || item.requested_date || (item.created_at ? moment(item.created_at).format('DD MMM YYYY') : 'N/A');
      })(),
      reason: item.reason || t(tokens.common.noReason),
      status: item.status || t(tokens.actions.pending),
      statusColor: getStatusColor(item.status),
      statusBg: getStatusBg(item.status),
      rawItem: item,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t(tokens.dashboard.requests)}</Text>
        {pendingRequests.length > 0 && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAll}>{t(tokens.dashboard.viewAll)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {pendingRequests.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t(tokens.messages.noRequests)}</Text>
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {localizedRequests.map((req) => (
            <TouchableOpacity 
              key={req.id} 
              style={styles.card}
              onPress={() => handleCardPress(req.rawItem)}
              activeOpacity={0.7}
            >
              {/* Top Row: Title, Tag, and Status Badge */}
              <View style={styles.topRow}>
                <View style={styles.titleTagContainer}>
                  <Text style={styles.cardType}>{req.type}</Text>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{req.tag}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: req.statusBg }]}>
                  <Text style={[styles.statusText, { color: req.statusColor }]}>
                    {req.status === 'Approved' ? t(tokens.actions.approved) : 
                     req.status === 'Rejected' ? t(tokens.actions.rejected) : 
                     req.status === 'Pending' ? t(tokens.actions.pending) : 
                     req.status}
                  </Text>
                </View>
              </View>

              {/* Details Row */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>
                    {req.tag === t(tokens.nav.leave) ? t(tokens.dashboard.leaveDate) : t(tokens.common.punchTime)}
                  </Text>
                  <Text style={styles.detailValue}>{req.punchTime}</Text>
                </View>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>{t(tokens.common.reason)}</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{req.reason}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <RegularizationDetailsSheet 
        visible={isSheetVisible}
        onClose={() => setIsSheetVisible(false)}
        data={selectedRequest}
        onManage={onViewAll}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    // marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 0, 
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
  scrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  card: {
    width: 290, // Slightly wider to fit content comfortably
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFF0F3',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.03,
    // shadowRadius: 8,
    // elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
  },
  tagBadge: {
    backgroundColor: '#F5F7FA', // Or #EFF0F378 from SCSS
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#80828D',
  },
  statusBadge: {
    position: 'absolute',
    top: -12, // Pull it up to the corner
    right: -12, // Pull it right to the corner
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 8, // Match card radius
    borderBottomLeftRadius: 8,
    // The SCSS uses a specific background color for the badge container, usually defined in data
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  detailColumn: {
    flex: 1,
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: '#80828D', // Grey-5 for label based on SCSS? Actually SCSS says Grey-5 for values usually, label might be lighter? 
    // SCSS: punchTime (label?) -> Grey-5, 11px, weight 300.
    fontWeight: '400',
  },
  detailValue: {
    fontSize: 12,
    color: '#1E1F24', // Grey-5
    fontWeight: '400', // Regular weight for value based on visual hierarchy or SCSS if clearer
    // SCSS: a12Jan... -> Grey-5, 12px.
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9F9',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D7DBDD',
    marginBottom: 16,
  },
  emptyText: {
    color: '#7F8C8D',
    fontSize: 14,
  },
});
