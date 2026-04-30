import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import ProfileServices from '../../../Services/API/ProfileServices';
import Toast from 'react-native-toast-message';
import { formatErrorsToToastMessages } from '../../utils/error-format';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';
import SwipeableBottomSheet from '../common/SwipeableBottomSheet';

const { height, width } = Dimensions.get('window');

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
    case 'Revoked':
      backgroundColor = 'rgba(65, 105, 225, 0.1)';
      color = '#4169E1';
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

const getStatusText = (status, t) => {
  switch (status) {
    case 'Approved': return t(tokens.actions.approved);
    case 'Pending': return t(tokens.actions.pending);
    case 'Rejected': return t(tokens.actions.rejected);
    case 'Revoked': return t(tokens.actions.revoked);
    default: return status;
  }
};

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const DeleteConfirmationModal = ({ visible, onCancel, onConfirm, t }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.alertOverlay}>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.alertContent}>
        <View style={styles.alertIconContainer}>
          <LinearGradient
            colors={['#FFEDED', '#FFDada']}
            style={styles.alertIconCircle}
          >
            <Ionicons name="trash-outline" size={32} color="#E74C3C" />
          </LinearGradient>
        </View>
        <Text style={styles.alertTitle}>{t(tokens.actions.deleteRequest)}</Text>
        <Text style={styles.alertDescription}>
          {t(tokens.messages.deleteRequestConfirm)}
        </Text>
        <View style={styles.alertActions}>
          <TouchableOpacity style={styles.alertCancelButton} onPress={onCancel}>
            <Text style={styles.alertCancelButtonText}>{t(tokens.actions.cancel)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.alertDeleteButton} onPress={onConfirm}>
            <Text style={styles.alertDeleteButtonText}>{t(tokens.actions.delete)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const LocalToast = ({ visible, message, type }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8
      }).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      }).start(() => setShouldRender(false));
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <Animated.View
      style={[
        styles.localToastContainer,
        {
          opacity: animatedValue,
          transform: [{
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [-40, 0]
            })
          }, {
            scale: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1]
            })
          }]
        }
      ]}
    >
      <View style={styles.localToastContent}>
        <View style={[styles.localToastIcon, { backgroundColor: type === 'success' ? '#10B981' : '#EF4444' }]}>
          <Ionicons name={type === 'success' ? "checkmark-sharp" : "alert-sharp"} size={14} color="#FFF" />
        </View>
        <Text style={styles.localToastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const RequestDetailsSheet = ({ visible, onClose, request, onRefresh, onEdit }) => {
  const { t, i18n } = useTranslation();
  const [isRevoking, setIsRevoking] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [localToast, setLocalToast] = useState(null);
  const [localRequest, setLocalRequest] = useState(null);

  useEffect(() => {
    if (visible && request) {
      setLocalToast(null); // Reset toast state when opening
      setLocalRequest(request);
    }
  }, [visible, request]);

  const displayRequest = request || localRequest;

  const handleRevoke = async () => {
    if (!displayRequest?.id) return;

    try {
      setIsRevoking(true);
      let response;
      if (displayRequest.typeId === 'leave') {
        response = await ProfileServices.revokeLeaveRequest({ leave_ids: [Number(displayRequest.id)] });
      } else if (displayRequest.typeId === 'overtime') {
        response = await ProfileServices.revokeOvertimeRequest([Number(displayRequest.id)]);
      } else if (displayRequest.typeId === 'wfh') {
        response = await ProfileServices.revokeWorkFromHomeRequest([Number(displayRequest.id)]);
      } else if (displayRequest.typeId === 'training') {
        response = await ProfileServices.revokeTrainingRequests([Number(displayRequest.id)]);
      } else if (displayRequest.typeId === 'permission') {
        response = await ProfileServices.revokePermissionRequest([Number(displayRequest.id)]);
      } else {
        response = await ProfileServices.revokeManualLogRequest([Number(displayRequest.id)]);
      }
      // console.log('DEBUG: Revoke Success:', response);

      setLocalToast({
        type: 'success',
        message: t(tokens.messages.requestRevokedSuccess)
      });

      if (onRefresh) onRefresh();
      setTimeout(() => {
        setLocalToast(null);
        onClose();
      }, 600);
    } catch (error) {
      console.error('Revoke Error:', error);
      formatErrorsToToastMessages(error);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleDelete = () => {
    if (!displayRequest?.id) return;
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleteModalVisible(false);
      setIsRevoking(true);
      let response;
      if (displayRequest.typeId === 'leave') {
        response = await ProfileServices.deleteLeaveRequest(displayRequest.id);
      } else if (displayRequest.typeId === 'overtime') {
        response = await ProfileServices.deleteOvertimeRequest(displayRequest.id);
      } else if (displayRequest.typeId === 'wfh') {
        response = await ProfileServices.deleteWorkFromHomeRequest(displayRequest.id);
      } else if (displayRequest.typeId === 'training') {
        response = await ProfileServices.deleteTrainingRequest(displayRequest.id);
      } else if (displayRequest.typeId === 'permission') {
        response = await ProfileServices.deletePermissionRequest(displayRequest.id);
      } else {
        response = await ProfileServices.deleteManualLogRequest(displayRequest.id);
      }
      // console.log('DEBUG: Delete Success:', response);

      setLocalToast({
        type: 'success',
        message: t(tokens.messages.requestDeletedSuccess)
      });

      if (onRefresh) onRefresh();
      setTimeout(() => {
        setLocalToast(null);
        onClose();
      }, 600);
    } catch (error) {
      console.error('Delete Error:', error);
      formatErrorsToToastMessages(error);
    } finally {
      setIsRevoking(false);
    }
  };

  if (!displayRequest) return null;

  const Icon = displayRequest.icon;

  const renderWorkflowStep = (step, index, total) => {
    let iconName, iconColor;
    if (step.status === 'completed') {
      iconName = 'checkmark-circle';
      iconColor = '#2ECC40';
    } else if (step.status === 'rejected') {
      iconName = 'close-circle';
      iconColor = '#E74C3C';
    } else {
      iconName = 'time';
      iconColor = '#F39C12';
    }

    return (
      <View key={index} style={styles.workflowStep}>
        <View style={styles.workflowIconContainer}>
          <Ionicons name={iconName} size={20} color={iconColor} />
          {index < total - 1 && <View style={styles.workflowConnector} />}
        </View>
        <View style={styles.workflowContent}>
          <Text style={styles.workflowTitle}>{step.title}</Text>
          <Text style={styles.workflowDate}>{step.date}</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <SwipeableBottomSheet visible={visible} onClose={onClose} contentStyle={styles.sheet}>
        <LocalToast
          visible={!!localToast}
          message={localToast?.message}
          type={localToast?.type}
        />

        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {Icon && <Icon width={18} height={18} color="#1E1F24" strokeWidth={1.5} />}
              <Text style={styles.headerTitle}>{displayRequest.typeId === 'wfh' ? t(tokens.nav.wfh) : displayRequest.type}</Text>
            </View>
            <StatusBadge status={getStatusText(displayRequest.status, t)} />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
          {/* Summary Section */}
          <View style={styles.summarySection}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                {displayRequest.typeId === 'manual_log' ? t(tokens.common.punchTime) :
                  displayRequest.typeId === 'overtime' ? t(tokens.common.otHours) :
                    t(tokens.common.duration)}
              </Text>
              <Text style={styles.summaryValue}>{displayRequest.duration}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{t(tokens.common.submittedDate)}</Text>
              <Text style={styles.summaryValue}>{displayRequest.submittedOn}</Text>
            </View>
          </View>

          {/* Request Details */}
          <Section title={t(tokens.requests.requestDetails)}>
            {displayRequest.typeId === 'overtime' ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t(tokens.common.otType)}</Text>
                  <Text style={styles.detailValue}>
                    {displayRequest.ot_type
                      ? displayRequest.ot_type.charAt(0).toUpperCase() + displayRequest.ot_type.slice(1).replace('_', ' ')
                      : '--'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t(tokens.common.date)}</Text>
                  <Text style={styles.detailValue}>
                    {displayRequest.start_time ? new Date(displayRequest.start_time).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t(tokens.common.startTime)}</Text>
                  <Text style={styles.detailValue}>
                    {displayRequest.start_time ? new Date(displayRequest.start_time).toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t(tokens.common.endTime)}</Text>
                  <Text style={styles.detailValue}>
                    {displayRequest.end_time ? new Date(displayRequest.end_time).toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '--'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t(tokens.common.currentApprover)}</Text>
                  <View style={styles.approverRow}>
                    <View style={styles.approverAvatar}>
                      <Text style={styles.approverInitials}>{displayRequest.approverInitials}</Text>
                    </View>
                    <Text style={styles.detailValue}>{displayRequest.approver}</Text>
                  </View>
                </View>
                <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                  <Text style={styles.detailLabel}>{t(tokens.common.reason)}</Text>
                  <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>{displayRequest.reason}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t(tokens.common.dateTime)}</Text>
                  <Text style={styles.detailValue}>{displayRequest.date}</Text>
                </View>
                {displayRequest.typeId === 'wfh' && displayRequest.wfh_type && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t(tokens.requests.wfhType)}</Text>
                    <Text style={styles.detailValue}>
                      {displayRequest.wfh_type === 'day' ? t(tokens.common.day) :
                        displayRequest.wfh_type === 'hours' ? t(tokens.common.hours) :
                          displayRequest.wfh_type?.charAt(0).toUpperCase() + displayRequest.wfh_type?.slice(1)}
                    </Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t(tokens.common.requestType)}</Text>
                  <Text style={styles.detailValue}>{displayRequest.typeId === 'manual_log' ? t(tokens.nav.manualLog) : displayRequest.typeId === 'wfh' ? t(tokens.requests.workFromHome) : displayRequest.type}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t(tokens.common.currentApprover)}</Text>
                  <View style={styles.approverRow}>
                    <View style={styles.approverAvatar}>
                      <Text style={styles.approverInitials}>{displayRequest.approverInitials}</Text>
                    </View>
                    <Text style={styles.detailValue}>{displayRequest.approver}</Text>
                  </View>
                </View>
                <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                  <Text style={styles.detailLabel}>{t(tokens.common.reason)}</Text>
                  <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>{displayRequest.reason}</Text>
                </View>
              </>
            )}
          </Section>

          {/* Approval Workflow */}
          <Section title={t(tokens.expense.approvalWorkflow)}>
            <View style={styles.workflowContainer}>
              {displayRequest.workflow && displayRequest.workflow.map((step, index) =>
                renderWorkflowStep(step, index, displayRequest.workflow.length)
              )}
            </View>
          </Section>

          {/* Approval/Rejection Notes Box */}
          {displayRequest.footerMessage && (
            <View style={[
              styles.footerMessage,
              displayRequest.footerMessage.type === 'error' ? styles.footerMessageError : styles.footerMessageSuccess
            ]}>
              <View style={[
                styles.footerIconCircle,
                { backgroundColor: displayRequest.footerMessage.type === 'error' ? '#E74C3C' : '#2ECC40' }
              ]}>
                <Ionicons
                  name={displayRequest.footerMessage.type === 'error' ? "close-sharp" : "checkmark-sharp"}
                  size={14}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.footerMessageContent}>
                {displayRequest.footerMessage.type === 'error' ? (
                  <Text style={[styles.footerMessageText, { color: '#E74C3C' }]}>
                    {displayRequest.footerMessage.text}
                  </Text>
                ) : (
                  <Text style={[styles.footerMessageText, { color: '#2ECC40' }]}>
                    {displayRequest.footerMessage.text}
                  </Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          {displayRequest.status === 'Pending' ? (
            <View style={styles.pendingButtons}>
              <TouchableOpacity style={styles.closeButtonOutline} onPress={onClose}>
                <Text style={styles.closeButtonTextOutline}>{t(tokens.common.close)}</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.revokeButton, isRevoking && { opacity: 0.7 }]}
                  onPress={handleRevoke}
                  disabled={isRevoking}
                >
                  {isRevoking ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.revokeButtonText}>{t(tokens.actions.revoke)}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : displayRequest.status === 'Revoked' ? (
            <View style={styles.pendingButtons}>
              <TouchableOpacity style={[styles.closeButtonOutline, { flex: 1 }]} onPress={onClose}>
                <Text style={styles.closeButtonTextOutline}>{t(tokens.common.close)}</Text>
              </TouchableOpacity>
              <View style={{ width: 12 }} />
              <TouchableOpacity
                style={[styles.primaryButton, { width: "50%" }]}
                onPress={() => {
                  onEdit(displayRequest);
                  onClose();
                }}
              >
                <Text style={styles.primaryButtonText}>{t(tokens.actions.edit)}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryButtonText}>{t(tokens.common.close)}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SwipeableBottomSheet>
      <DeleteConfirmationModal
        visible={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        onConfirm={confirmDelete}
        t={t}
      />
    </>
  );
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '90%',
    padding: 0
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
    gap: 8,
    justifyContent: "space-between",
    width: "100%"
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
  approverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approverAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8E44AD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approverInitials: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '500',
  },
  workflowContainer: {
    gap: 0,
  },
  workflowStep: {
    flexDirection: 'row',
    minHeight: 50,
  },
  workflowIconContainer: {
    alignItems: 'center',
    marginRight: 12,
    width: 20,
  },
  workflowConnector: {
    width: 1,
    flex: 1,
    backgroundColor: '#B9BBC6',
    borderStyle: 'dashed',
    borderWidth: 0.5,
    marginVertical: 2,
  },
  workflowContent: {
    flex: 1,
    paddingBottom: 16,
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
  footerMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    gap: 12,
    borderWidth: 1,
  },
  footerMessageSuccess: {
    backgroundColor: '#F1F9F1',
    borderColor: '#2ECC40',
  },
  footerMessageError: {
    backgroundColor: '#FFF5F5',
    borderColor: '#E74C3C',
  },
  footerIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  footerMessageContent: {
    flex: 1,
    gap: 2,
  },
  footerMessageText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  rejectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E74C3C',
  },
  rejectionValue: {
    fontSize: 13,
    color: '#E74C3C',
    opacity: 0.8,
  },
  footer: {
    padding: 16,
    paddingTop: 16,
  },
  primaryButton: {
    backgroundColor: '#4169E1',
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  },
  closeButtonTextOutline: {
    color: '#62636C',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revokeButton: {
    backgroundColor: '#4169E1',
    height: 44,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revokeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Alert Modal Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    padding: 24,
    alignItems: 'center',
  },
  alertIconContainer: {
    marginBottom: 20,
  },
  alertIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E1F24',
    marginBottom: 12,
  },
  alertDescription: {
    fontSize: 14,
    color: '#62636C',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertCancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F5F6FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#62636C',
  },
  alertDeleteButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertDeleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Local Toast Styles
  localToastContainer: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  localToastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    // Premium Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  localToastIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  localToastText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1F24',
    letterSpacing: -0.2,
  },
});

export default RequestDetailsSheet;