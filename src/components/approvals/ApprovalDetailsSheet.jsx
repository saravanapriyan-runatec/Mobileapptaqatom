import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Animated, PanResponder, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';

const { height } = Dimensions.get('window');

const StatusBadge = ({ status }) => {
  let backgroundColor, color;
  switch (status) {
    case 'Approved':
      backgroundColor = 'rgba(46, 204, 64, 0.1)';
      color = '#2ECC40';
      break;
    case 'Rejected':
      backgroundColor = 'rgba(231, 76, 60, 0.1)';
      color = '#E74C3C';
      break;
    case 'Pending':
      backgroundColor = 'rgba(243, 156, 18, 0.1)';
      color = '#F39C12';
      break;
    default:
      backgroundColor = '#EFF0F3';
      color = '#1E1F24';
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor }]}>
      <Text style={[styles.statusText, { color }]}>{status}</Text>
    </View>
  );
};

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const ApprovalDetailsSheet = ({ visible, onClose, request, onApprove, onReject }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      // Reset position to bottom before sliding up
      slideAnim.setValue(height);
      
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 80,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true
      }).start(() => {
        setShowModal(false);
      });
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => gestureState.dy > 5,
      onPanResponderGrant: () => {
        slideAnim.stopAnimation((value) => {
          slideAnim.setOffset(value);
          slideAnim.setValue(0);
        });
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        slideAnim.flattenOffset();
        if (gestureState.dy > height * 0.25 || gestureState.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!showModal || !request) return null;

  const Icon = request.icon;

  const renderWorkflowStep = (step, index, total) => {
    let iconName, iconColor, iconBg;
    if (step.status === 'completed') {
      iconName = 'checkmark-circle';
      iconColor = '#2ECC40';
      iconBg = '#FFFFFF';
    } else if (step.status === 'rejected') {
      iconName = 'close-circle';
      iconColor = '#E74C3C';
      iconBg = '#FFFFFF';
    } else {
      iconName = 'time'; // Using time icon for pending/awaiting
      iconColor = '#F39C12';
      iconBg = '#FFFFFF';
    }

    return (
      <View key={index} style={styles.workflowStep}>
        <View style={styles.workflowIconContainer}>
           {/* Line */}
           {index < total - 1 && <View style={styles.workflowConnector} />}
           {/* Icon */}
           <View style={{ backgroundColor: '#fff', zIndex: 1 }}>
              <Ionicons name={iconName} size={20} color={iconColor} />
           </View>
        </View>
        <View style={styles.workflowContent}>
          <Text style={styles.workflowTitle}>{step.title}</Text>
          {step.date && <Text style={styles.workflowDate}>{step.date}</Text>}
        </View>
      </View>
    );
  };

  return (
    <Modal transparent visible={showModal} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          <LinearGradient
            colors={['rgba(30, 31, 36, 0.47)', 'rgba(30, 31, 36, 0.10)']}
            locations={[0.37, 0.82]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              {Icon && <Icon width={24} height={24} color="#1E1F24" strokeWidth={1.5} />}
              <Text style={styles.headerTitle}>{request.type.replace('Work From Home', 'WFH')}</Text>
              <StatusBadge status={request.status} />
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
            {/* Summary Section */}
            <View style={styles.summarySection}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{request.typeCategory === 'Manual Log' ? t(tokens.common.time) : t(tokens.dashboard.totalDuration)}</Text>
                <Text style={styles.summaryValue}>{request.duration}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>{t(tokens.dashboard.createdDate)}</Text>
                <Text style={styles.summaryValue}>{request.submittedOn}</Text>
              </View>
            </View>

            {/* Request Details */}
            <Section title={t(tokens.dashboard.requestDetails)}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t(tokens.common.dateTime)}</Text>
                <Text style={styles.detailValue}>{request.date}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t(tokens.dashboard.requests)}</Text>
                <Text style={styles.detailValue}>{request.typeCategory || request.type}</Text>
              </View>
              <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                <Text style={styles.detailLabel}>{t(tokens.dashboard.description)}</Text>
                <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>{request.reason}</Text>
              </View>
            </Section>

            {/* Approval Workflow */}
            <Section title={t(tokens.dashboard.approvalWorkflow)}>
              <View style={styles.workflowContainer}>
                {request.workflow && request.workflow.map((step, index) =>
                  renderWorkflowStep(step, index, request.workflow.length)
                )}
              </View>
            </Section>

             {/* Rejection Reason (if rejected) */}
             {request.status === 'Rejected' && request.rejectionReason && (
                <View style={styles.rejectionBox}>
                  <View style={styles.rejectionIcon}>
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.rejectionContent}>
                    <Text style={styles.rejectionTitle}>{t(tokens.approvals.rejectionReason)}:</Text>
                    <Text style={styles.rejectionText}>{request.rejectionReason}</Text>
                  </View>
                </View>
             )}

             {/* Approved Reason (if approved with note - shown in screenshot 2) */}
             {request.status === 'Approved' && request.approvalNote && (
                <View style={styles.approvalBox}>
                  <View style={styles.approvalIcon}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.approvalContent}>
                    <Text style={styles.approvalTitle}>{t(tokens.approvals.approvalReason)}:</Text>
                    <Text style={styles.approvalText}>{request.approvalNote}</Text>
                  </View>
                </View>
             )}

          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            {request.status === 'Pending' ? (
              <View style={styles.pendingButtons}>
                <TouchableOpacity style={styles.closeButtonOutline} onPress={onClose}>
                  <Text style={styles.closeButtonTextOutline}>{t(tokens.common.close)}</Text>
                </TouchableOpacity>
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={styles.rejectButton} onPress={() => onReject(request)}>
                    <Ionicons name="close-circle-outline" size={24} color="#E74C3C" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveButton} onPress={() => onApprove(request)}>
                    <Text style={styles.approveButtonText}>{t(tokens.approvals.approveRequest)}</Text>
                    </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.closeButtonOutlineFull} onPress={onClose}>
                <Text style={styles.closeButtonTextOutline}>{t(tokens.common.close)}</Text>
              </TouchableOpacity>
            )}
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)', // Removed to allow underlying BlurView to show through
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 'auto',
    maxHeight: '90%',
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 24,
  },
  summarySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  summaryItem: {
    gap: 4,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#1E1F24',
    opacity: 0.47,
  },
  summaryValue: {
    fontSize: 13,
    color: '#1E1F24',
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EFF0F3',
    marginHorizontal: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFF0F3',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#1E1F24',
    opacity: 0.47,
  },
  detailValue: {
    fontSize: 13,
    color: '#1E1F24',
    fontWeight: '500',
  },
  workflowContainer: {
    gap: 0,
  },
  workflowStep: {
    flexDirection: 'row',
    minHeight: 60,
  },
  workflowIconContainer: {
    alignItems: 'center',
    marginRight: 12,
    width: 20,
    position: 'relative',
  },
  workflowConnector: {
    position: 'absolute',
    top: 20,
    bottom: -20, // Extend to next icon
    width: 1,
    backgroundColor: '#B9BBC6',
    borderStyle: 'dashed',
    borderWidth: 0.5,
    zIndex: 0,
  },
  workflowContent: {
    flex: 1,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  workflowTitle: {
    fontSize: 13,
    color: '#1E1F24',
    marginBottom: 4,
  },
  workflowDate: {
    fontSize: 13,
    color: '#1E1F24',
    opacity: 0.47,
  },
  footer: {
    padding: 16,
    paddingTop: 16,
  },
  pendingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButtonOutline: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B9BBC6',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  closeButtonOutlineFull: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B9BBC6',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  closeButtonTextOutline: {
    color: '#62636C',
    fontSize: 14,
    fontWeight: '500',
  },
  rejectButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#4169E1',
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
    padding: 12,
    borderRadius: 4,
    gap: 12,
  },
  rejectionIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectionContent: {
    flex: 1,
  },
  rejectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E74C3C',
  },
  rejectionText: {
    fontSize: 12,
    color: '#E74C3C',
  },
  approvalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F9F1',
    borderLeftWidth: 4,
    borderLeftColor: '#2ECC40',
    padding: 12,
    borderRadius: 4,
    gap: 12,
  },
  approvalIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2ECC40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalContent: {
    flex: 1,
  },
  approvalTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2ECC40',
  },
  approvalText: {
    fontSize: 12,
    color: '#2ECC40',
  },
});

export default ApprovalDetailsSheet;
