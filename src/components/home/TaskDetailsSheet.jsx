import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Animated, PanResponder, ScrollView, Platform, Dimensions, ActivityIndicator, LayoutAnimation, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';
import Toast from 'react-native-toast-message';
import SwipeableBottomSheet from '../common/SwipeableBottomSheet';

import * as DocumentPicker from 'expo-document-picker';
import { TextInput } from 'react-native';
import { useTasks } from '../../context/TaskContext';
import ProfileServices from '../../../Services/API/ProfileServices';
import { HighPriorityIcon, MediumPriorityIcon, LowPriorityIcon } from '../icons/PriorityIcons';

const { height, width } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const PriorityIcon = ({ priority }) => {
  switch (priority) {
    case 'high':
      return <HighPriorityIcon />;
    case 'medium':
      return <MediumPriorityIcon />;
    case 'low':
      return <LowPriorityIcon />;
    default:
      return null;
  }
};

const TaskDetailsSheet = ({ visible, onClose, task, onAction, onComplete }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { updateAssetStatus, fetchTaskDetails } = useTasks();
  const [completing, setCompleting] = useState(false);
  const [localTask, setLocalTask] = useState(null);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expandedAssetId, setExpandedAssetId] = useState(null); // Track which asset is expanded
  const [localInputs, setLocalInputs] = useState({}); // { assetId: { deduction_amount: '', reason: '' } }
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    if (visible && task) {
      setLocalTask(task);
      setFiles(task?.files || []);

      // Initialize local inputs for assets
      const inputs = {};
      (task.assets || []).forEach(asset => {
        inputs[asset.id] = {
          deduction_amount: asset.deduction_amount?.toString() || '',
          reason: asset.reason || ''
        };
      });
      setLocalInputs(inputs);
    }
  }, [visible, task]);

  const handleComplete = async () => {
    try {
      setCompleting(true);
      await onComplete();
    } finally {
      setCompleting(false);
    }
  };

  const handleAssetInlineUpdate = async (assetId, updates) => {
    if (task) {
      try {
        setSaving(true);
        const asset = task.assets.find(a => a.id === assetId);
        const newStatus = updates.status || asset.status;
        const newCondition = (updates.condition || asset.condition).toUpperCase();

        // Trigger condition API call if changed
        if (updates.condition) {
          await ProfileServices.updateAssetCondition(assetId, newCondition);
        }

        // Trigger status API call if changed
        if (updates.status) {
          // Map internal status to API status
          const apiStatus = newStatus === 'PENDING' ? 'OPEN' :
            newStatus === 'INPROGRESS' ? 'IN_PROGRESS' :
              newStatus === 'COMPLETED' ? 'COMPLETED' :
                newStatus;
          await ProfileServices.updateAssetStatusData(assetId, { status: apiStatus });
        }

        // Trigger other fields if provided directly in updates
        if (updates.deduction_amount !== undefined || updates.reason !== undefined) {
          const payload = {};
          if (updates.deduction_amount !== undefined) payload.deduction_amount = updates.deduction_amount;
          if (updates.reason !== undefined) payload.reason = updates.reason;
          await ProfileServices.updateAssetStatusData(assetId, payload);
        }

        // Update global state in TaskContext
        await updateAssetStatus(
          task.id,
          assetId,
          newStatus,
          newCondition,
          displayTask.description || '',
          files,
          localInputs[assetId]?.deduction_amount,
          localInputs[assetId]?.reason
        );

        Toast.show({
          type: 'success',
          text1: t(tokens.common.success),
          text2: t(tokens.messages.updateSuccess || 'Asset updated successfully'),
        });

        setSaving(false);
      } catch (err) {
        setSaving(false);
        console.error('Error in inline asset update:', err);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setPostingComment(true);
    try {
      // In the provided example, cmd_by is 23. Fallback to this or assignee ID.
      const userId = displayTask.current_assignee || 23;
      const commentObj = {
        comment: newComment.trim(),
        cmd_by: userId,
        cmd_at: new Date().toISOString()
      };

      await ProfileServices.updateTaskStatusWithComments(displayTask.id, [commentObj]);

      // Refresh task details to update the UI instantly
      await fetchTaskDetails(displayTask.id, displayTask);

      setNewComment('');
      Toast.show({
        type: 'success',
        text1: t(tokens.common.success),
        text2: t(tokens.messages.updateSuccess || 'Comment added successfully'),
      });
    } catch (err) {
      console.error('Error adding comment:', err);
      Toast.show({
        type: 'error',
        text1: t(tokens.common.error),
        text2: t(tokens.messages.updateFailed || 'Failed to add comment'),
      });
    } finally {
      setPostingComment(false);
    }
  };

  const handleFileUpload = async (fileAssets) => {
    if (!fileAssets || fileAssets.length === 0) return;

    setSaving(true);
    try {
      const attachmentsArray = await Promise.all(fileAssets.map(async (file) => {
        const response = await fetch(file.uri);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve({
              filename: file.name,
              image_binary: base64Data
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }));

      await ProfileServices.uploadTaskAttachment(displayTask.id, attachmentsArray);

      // Refresh task details to update the UI instantly (this will also update displayTask.attachment_presigned_url)
      await fetchTaskDetails(displayTask.id, displayTask);

      // Clear local temporary files list
      setFiles([]);

      Toast.show({
        type: 'success',
        text1: t(tokens.common.success),
        text2: t(tokens.messages.updateSuccess || 'Files uploaded successfully'),
      });
    } catch (err) {
      console.error('Error uploading files:', err);
      Toast.show({
        type: 'error',
        text1: t(tokens.common.error),
        text2: t(tokens.messages.updateFailed || 'Failed to upload files'),
      });
    } finally {
      setSaving(false);
    }
  };

  const displayTask = task || localTask;

  // Only return null if there is no task AND the sheet is not visible
  if (!displayTask && !visible) return null;
  console.log("testcheck", displayTask)

  // Determine if this task has sub-assets (like Asset Handover)
  const assets = displayTask.assets || [];
  // Correctly identify asset tasks based on sub-assets or is_asset_main flag (Offboarding)
  const isAssetTask = assets.length > 0 || displayTask.details?.is_asset_main === true;
  const taskNameLower = (displayTask.taskName || '').toLowerCase();
  const isFlightTicket = taskNameLower.includes('flight ticket') || displayTask.taskType === 'FLIGHT_TICKET';
  const isKTTask = taskNameLower === 'kt';
  const isLoanTask = taskNameLower === 'loan';
  const isSystemAccessTask = taskNameLower === 'system access';
  const isFinalSettlementTask = taskNameLower === 'final settlement';
  const isVacationSettlementTask = taskNameLower === 'vacation settlement';
  const isActionableTask = isAssetTask || isFlightTicket || isKTTask || isLoanTask || isSystemAccessTask || isFinalSettlementTask || isVacationSettlementTask;

  const isCompletedButtonDisabled = isAssetTask && assets.length > 0 && assets.some(a => a.status?.toUpperCase() !== 'COMPLETED');

  const renderStatusBadge = () => {
    let bgColor, textColor;
    switch (displayTask.status) {
      case 'Pending':
        bgColor = 'rgba(243, 156, 18, 0.2)';
        textColor = '#F39C12';
        break;
      case 'Completed':
        bgColor = 'rgba(46, 204, 64, 0.2)';
        textColor = '#2ECC40';
        break;
      case 'Expired':
        bgColor = 'rgba(231, 76, 60, 0.2)';
        textColor = '#E74C3C';
        break;
      default:
        bgColor = 'rgba(255, 255, 255, 0.1)';
        textColor = '#FFFFFF';
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
        <Text style={[styles.statusText, { color: textColor }]}>
          {displayTask.status === 'Pending' ? t(tokens.tasks.pending) :
            displayTask.status === 'Completed' ? t(tokens.tasks.completed) :
              displayTask.status === 'Expired' ? t(tokens.tasks.expired) :
                displayTask.status === 'Blocked' ? t(tokens.tasks.blocked) :
                  displayTask.status === 'In Progress' ? t(tokens.tasks.inProgress) :
                    displayTask.status}
        </Text>
      </View>
    );
  };

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      contentStyle={styles.sheetContent}
      extraContent={<Toast />}
    >
      <View style={styles.modalHandle} />

      {!displayTask ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#395CC6" />
        </View>
      ) : (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{displayTask?.title}</Text>
              <View style={{ marginLeft: 6 }}>
                <PriorityIcon priority={displayTask?.priority} />
              </View>
            </View>
            {renderStatusBadge()}
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t(tokens.dashboard.taskDetails)}</Text>

              {displayTask.details?.task_code && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>{t(tokens.tasks.code)}</Text>
                  <Text style={styles.value}>{displayTask.details.task_code}</Text>
                </View>
              )}



              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t(tokens.dashboard.createdDate)}</Text>
                <Text style={styles.value}>{displayTask.createdDate}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>{t(tokens.dashboard.dueDate)}</Text>
                <Text style={styles.value}>{displayTask.dueDate}</Text>
              </View>
            </View>

            {/* Associated Employee Section */}
            {(displayTask.associatedEmployee !== 'N/A' || displayTask.details?.related_employee_details || displayTask.details?.employee_details) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t(tokens.dashboard.associatedEmployee)}</Text>
                {(() => {
                  const emp = displayTask.details?.employee_details || displayTask.details?.related_employee_details;
                  return (
                    <>
                      <View style={styles.fieldGroup}>
                        <Text style={styles.label}>{t(tokens.dashboard.employeeName)}</Text>
                        <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
                          {emp?.employee_name || displayTask.associatedEmployee}
                        </Text>
                      </View>
                      {emp?.emp_code && (
                        <View style={styles.fieldGroup}>
                          <Text style={styles.label}>{t(tokens.tasks.employeeCode)}</Text>
                          <Text style={styles.value}>{emp.emp_code}</Text>
                        </View>
                      )}
                      {emp?.position_name && (
                        <View style={styles.fieldGroup}>
                          <Text style={styles.label}>{t(tokens.tasks.position || 'Position')}</Text>
                          <Text style={styles.value}>{emp.position_name}</Text>
                        </View>
                      )}
                      {(emp?.department_name || displayTask.department) && emp?.department_name !== 'N/A' && (
                        <View style={styles.fieldGroup}>
                          <Text style={styles.label}>{t(tokens.dashboard.department)}</Text>
                          <Text style={styles.value}>{emp?.department_name || displayTask.department}</Text>
                        </View>
                      )}
                      {emp?.doj_gregorian && (
                        <View style={styles.fieldGroup}>
                          <Text style={styles.label}>{t(tokens.common.dateOfJoining)}</Text>
                          <Text style={styles.value}>{new Date(emp.doj_gregorian).toLocaleDateString(t(tokens.common.locale || 'en-GB'))}</Text>
                        </View>
                      )}
                      {emp?.manager && (
                        <View style={styles.fieldGroup}>
                          <Text style={styles.label}>{t(tokens.tasks.manager)}</Text>
                          <Text style={styles.value}>{emp.manager}</Text>
                        </View>
                      )}
                    </>
                  );
                })()}
              </View>
            )}

            {(displayTask.details?.assignee_details || displayTask.details?.current_assignee_details) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t(tokens.tasks.assignee)}</Text>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>{t(tokens.dashboard.employeeName)}</Text>
                  <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
                    {displayTask.details?.assignee_details?.employee_name || displayTask.details?.current_assignee_details?.employee_name}
                  </Text>
                </View>
                {(displayTask.details?.assignee_details?.emp_code || displayTask.details?.current_assignee_details?.emp_code) && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t(tokens.tasks.employeeCode)}</Text>
                    <Text style={styles.value}>{displayTask.details?.assignee_details?.emp_code || displayTask.details?.current_assignee_details?.emp_code}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Asset List Section - Sub Tasks */}
            {isAssetTask && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t(tokens.tasks.subtasks || 'Sub Tasks')}</Text>

                {assets.map((asset, index) => {
                  const isExpanded = expandedAssetId === asset.id;

                  return (
                    <View key={`asset-${asset.id || index}-${index}`} style={styles.assetCard}>
                      <TouchableOpacity
                        style={styles.assetHeader}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setExpandedAssetId(isExpanded ? null : asset.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={styles.assetTitleRow}>
                            <Text style={[styles.assetName, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{asset.name}</Text>
                            <View style={styles.assetIdBadge}>
                              <Text style={styles.assetIdText}>{asset.code}</Text>
                            </View>
                          </View>

                          <View style={styles.assetDetailsRow}>
                            <Text style={styles.assetLabel}>{t(tokens.dashboard.serialNo)}: <Text style={styles.assetValue}>{asset.serial}</Text></Text>
                          </View>
                        </View>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={20}
                          color="#395CC6"
                          style={{ marginLeft: 8 }}
                        />
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={styles.inlineControls}>
                          {/* Condition Selection */}
                          <View style={styles.controlGroup}>
                            <Text style={styles.controlLabel}>{t(tokens.dashboard.assetCondition)}</Text>
                            <View style={styles.miniButtonGroup}>
                              <TouchableOpacity
                                style={[
                                  styles.miniButton,
                                  asset.condition?.toUpperCase() === 'GOOD' && styles.miniButtonActiveGood
                                ]}
                                onPress={() => handleAssetInlineUpdate(asset.id, { condition: 'GOOD' })}
                              >
                                <Text style={[styles.miniButtonText, asset.condition?.toUpperCase() === 'GOOD' && styles.miniButtonTextActive]}>
                                  {t(tokens.dashboard.good)}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.miniButton,
                                  asset.condition?.toUpperCase() === 'AVERAGE' && styles.miniButtonActiveAverage
                                ]}
                                onPress={() => handleAssetInlineUpdate(asset.id, { condition: 'AVERAGE' })}
                              >
                                <Text style={[styles.miniButtonText, asset.condition?.toUpperCase() === 'AVERAGE' && styles.miniButtonTextActive]}>
                                  {t(tokens.dashboard.average)}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.miniButton,
                                  (asset.condition?.toUpperCase() === 'BAD' || asset.condition?.toUpperCase() === 'DAMAGED') && styles.miniButtonActiveBad
                                ]}
                                onPress={() => handleAssetInlineUpdate(asset.id, { condition: 'DAMAGED' })}
                              >
                                <Text style={[styles.miniButtonText, (asset.condition?.toUpperCase() === 'BAD' || asset.condition?.toUpperCase() === 'DAMAGED') && styles.miniButtonTextActive]}>
                                  {t(tokens.dashboard.damaged)}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Status Selection */}
                          <View style={styles.controlGroup}>
                            <Text style={styles.controlLabel}>{t(tokens.dashboard.status || 'Status')}</Text>
                            <View style={styles.miniButtonGroup}>
                              <TouchableOpacity
                                style={[
                                  styles.miniButton,
                                  asset.status?.toUpperCase() === 'PENDING' && styles.miniButtonActivePrimary
                                ]}
                                onPress={() => handleAssetInlineUpdate(asset.id, { status: 'PENDING' })}
                              >
                                <Text style={[styles.miniButtonText, asset.status?.toUpperCase() === 'PENDING' && styles.miniButtonTextActive]}>
                                  {t(tokens.dashboard.pending)}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.miniButton,
                                  asset.status?.toUpperCase() === 'INPROGRESS' && styles.miniButtonActiveAverage
                                ]}
                                onPress={() => handleAssetInlineUpdate(asset.id, { status: 'INPROGRESS' })}
                              >
                                <Text style={[styles.miniButtonText, asset.status?.toUpperCase() === 'INPROGRESS' && styles.miniButtonTextActive]}>
                                  {t(tokens.dashboard.inprogress)}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.miniButton,
                                  asset.status?.toUpperCase() === 'COMPLETED' && styles.miniButtonActiveGood
                                ]}
                                onPress={() => handleAssetInlineUpdate(asset.id, { status: 'COMPLETED' })}
                              >
                                <Text style={[styles.miniButtonText, asset.status?.toUpperCase() === 'COMPLETED' && styles.miniButtonTextActive]}>
                                  {t(tokens.dashboard.completed)}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Deduction Fields */}
                          <View style={styles.assetInputRow}>
                            <Text style={styles.assetInputLabel}>{t(tokens.dashboard.deductionAmount || 'Deduction Amount')}</Text>
                            <TextInput
                              style={styles.assetAmountInput}
                              placeholder="0.00"
                              keyboardType="numeric"
                              value={localInputs[asset.id]?.deduction_amount}
                              onChangeText={(val) => setLocalInputs(prev => ({
                                ...prev,
                                [asset.id]: { ...prev[asset.id], deduction_amount: val }
                              }))}
                              onBlur={() => handleAssetInlineUpdate(asset.id, { deduction_amount: localInputs[asset.id]?.deduction_amount })}
                            />
                          </View>

                          <View style={styles.assetInputRow}>
                            <Text style={styles.assetInputLabel}>{t(tokens.dashboard.reason || 'Reason')}</Text>
                            <TextInput
                              style={[styles.assetTextInput, { minHeight: 60 }]}
                              placeholder={t(tokens.common.reason)}
                              multiline
                              value={localInputs[asset.id]?.reason}
                              onChangeText={(val) => setLocalInputs(prev => ({
                                ...prev,
                                [asset.id]: { ...prev[asset.id], reason: val }
                              }))}
                              onBlur={() => handleAssetInlineUpdate(asset.id, { reason: localInputs[asset.id]?.reason })}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Flight Ticket Section */}
            {(displayTask.moduleName === 'FLIGHT_TICKET' ||
              displayTask.taskName?.toUpperCase().includes('FLIGHT TICKET') ||
              displayTask.taskType === 'FLIGHT_TICKET') && displayTask.details && (
                <View style={styles.section}>
                  {console.log('DEBUG [FlightTicketTaskDetails]: response:', JSON.stringify(displayTask.details, null, 2))}
                  <Text style={styles.sectionTitle}>{t(tokens.dashboard.travelDetails || 'Flight Ticket Details')}</Text>

                  {/* Passenger / Related Employee Info */}
                  {(displayTask.details.related_employee_details || displayTask.details.employee_details) && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={styles.subSectionTitle}>{t(tokens.tasks.passengerInfo || 'Passenger Details')}</Text>
                      {(() => {
                        const pass = displayTask.details.related_employee_details || displayTask.details.employee_details;
                        return (
                          <>
                            <View style={styles.componentRow}>
                              <Text style={styles.componentLabel}>{t(tokens.dashboard.employeeName)}</Text>
                              <Text style={styles.componentValue}>{pass.employee_name}</Text>
                            </View>
                            <View style={styles.componentRow}>
                              <Text style={[styles.componentLabel, { marginRight: 16 }]}>{t(tokens.tasks.code)}</Text>
                              <Text style={[styles.componentValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1} ellipsizeMode="tail">{pass.emp_code}</Text>
                            </View>
                          </>
                        );
                      })()}
                    </View>
                  )}

                  {/* Coordinator Info */}
                  {displayTask.details.current_assignee_details && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={styles.subSectionTitle}>{t(tokens.tasks.coordinator)}</Text>
                      <View style={styles.componentRow}>
                        <Text style={[styles.componentLabel, { marginRight: 16 }]}>{t(tokens.dashboard.employeeName)}</Text>
                        <Text style={[styles.componentValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1} ellipsizeMode="tail">{displayTask.details.current_assignee_details.employee_name}</Text>
                      </View>
                      <View style={styles.componentRow}>
                        <Text style={[styles.componentLabel, { marginRight: 16 }]}>{t(tokens.tasks.email)}</Text>
                        <Text style={[styles.componentValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1} ellipsizeMode="tail">{displayTask.details.current_assignee_details.email}</Text>
                      </View>
                    </View>
                  )}

                  {/* Specific Travel Info (if present in details or sub-objects) */}
                  {(displayTask.details.destination || displayTask.details.travel_date || displayTask.details.ticket_details) && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.subSectionTitle}>{t(tokens.dashboard.travelDetails)}</Text>
                    {console.log('DEBUG [FlightTicketTravelDetails]:', JSON.stringify({
                      destination: displayTask.details.destination,
                      travel_date: displayTask.details.travel_date,
                      ticket_details: displayTask.details.ticket_details,
                      travel_details: displayTask.details.travel_details // Just in case it's named this
                    }, null, 2))}
                      {displayTask.details.destination && (
                        <View style={styles.componentRow}>
                          <Text style={styles.componentLabel}>{t(tokens.dashboard.destination)}</Text>
                          <Text style={styles.componentValue}>{displayTask.details.destination}</Text>
                        </View>
                      )}
                      {displayTask.details.travel_date && (
                        <View style={styles.componentRow}>
                          <Text style={styles.componentLabel}>{t(tokens.dashboard.travelDate)}</Text>
                          <Text style={styles.componentValue}>{displayTask.details.travel_date}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {displayTask.details.passport?.length > 0 && (
                    <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                      <Text style={styles.label}>{t(tokens.tasks.passportNumber)}</Text>
                      <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
                        {displayTask.details.passport[0].number}
                      </Text>
                      {displayTask.details.passport[0].expiry_date && (
                        <Text style={[styles.label, { marginTop: 4, fontStyle: 'italic' }]}>
                          {t(tokens.common.expiryDate)}: {displayTask.details.passport[0].expiry_date}
                        </Text>
                      )}
                    </View>
                  )}

                  {displayTask.details.notes && (
                    <View style={[styles.fieldGroup, { marginTop: 16 }]}>
                      <Text style={styles.label}>{t(tokens.common.notes)}</Text>
                      <Text style={styles.value}>{displayTask.details.notes}</Text>
                    </View>
                  )}
                </View>
              )}

            {/* Loan Deduction Section */}
            {(displayTask.taskName === 'Loan' || displayTask.details?.task_details?.task_type === 'LOAN') && displayTask.details && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t(tokens.dashboard.loanDeductionDetails)}</Text>

                {displayTask.details.loan_deduction && (
                  <View>
                    <View style={styles.componentRow}>
                      <Text style={styles.componentLabel}>{t(tokens.dashboard.outstandingAmount)}</Text>
                      <Text style={styles.componentValue}>{displayTask.details.loan_deduction.OutstandingAmount?.toLocaleString() || '0.00'}</Text>
                    </View>
                    <View style={styles.componentRow}>
                      <Text style={styles.componentLabel}>{t(tokens.dashboard.emiAmount)}</Text>
                      <Text style={styles.componentValue}>{displayTask.details.loan_deduction.EMIAmount?.toLocaleString() || '0.00'}</Text>
                    </View>
                    <View style={styles.componentRow}>
                      <Text style={styles.componentLabel}>{t(tokens.dashboard.remainingTerms)}</Text>
                      <Text style={styles.componentValue}>{displayTask.details.loan_deduction.remainingEmiterm || '0'}</Text>
                    </View>
                    <View style={styles.componentRow}>
                      <Text style={styles.componentLabel}>{t(tokens.dashboard.payrollMonth)}</Text>
                      <Text style={styles.componentValue}>{displayTask.details.loan_deduction.payrollmonth || t(tokens.common.na)}</Text>
                    </View>
                  </View>
                )}

                {displayTask.details.asset_deduction?.length > 0 && (
                  <View style={{ marginTop: 24 }}>
                    {console.log('DEBUG [LoanTaskDetails]: Asset Deductions Response:', JSON.stringify(displayTask.details, null, 2))}
                    <Text style={styles.subSectionTitle}>{t(tokens.dashboard.assetDeductions)}</Text>
                    {displayTask.details.asset_deduction.map((item, idx) => (
                      <View key={`loan-asset-${idx}`} style={styles.componentRow}>
                        <Text style={[styles.componentLabel, { flex: 1, marginRight: 8 }]} numberOfLines={1} ellipsizeMode="tail">
                          {(item.assetitemname || item.asset_item_name || item.asset_name || item.item_name || item.taskname || t(tokens.common.na))} {item.serialnumber ? `(${item.serialnumber})` : ''}
                        </Text>
                        <Text style={[styles.componentValue, { color: '#E74C3C' }]}>
                          -{item.deductionamount?.toLocaleString() || '0.00'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Final Settlement Section */}
            {(displayTask.taskName === 'Final Settlement' || displayTask.details?.task_details?.task_type === 'FINAL_SETTLEMENT') && displayTask.details && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t(tokens.dashboard.finalSettlementDetails)}</Text>

                {/* Earnings */}
                <Text style={styles.subSectionTitle}>{t(tokens.dashboard.earnings)}</Text>
                {(displayTask.details.earnings_deductions || [])
                  .filter(item => item.status === 'earnings')
                  .map((item, idx) => (
                    <View key={`earn-${idx}`} style={styles.componentRow}>
                      <Text style={[styles.componentLabel, { flex: 1, marginRight: 8 }]} numberOfLines={1} ellipsizeMode="tail">{item.type}</Text>
                      <Text style={styles.componentValue}>{item.amount.toLocaleString()}</Text>
                    </View>
                  ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t(tokens.dashboard.totalEarnings)}</Text>
                  <Text style={styles.totalValue}>{displayTask.details.total_earnings?.toLocaleString() || '0.00'}</Text>
                </View>

                {/* Deductions */}
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.subSectionTitle}>{t(tokens.dashboard.deductions)}</Text>
                  {(displayTask.details.earnings_deductions || [])
                    .filter(item => item.status === 'deductions')
                    .map((item, idx) => (
                      <View key={`deduct-${idx}`} style={styles.componentRow}>
                        <Text style={[styles.componentLabel, { flex: 1, marginRight: 8 }]} numberOfLines={1} ellipsizeMode="tail">{item.type}</Text>
                        <Text style={[styles.componentValue, { color: '#E74C3C' }]}>{item.amount.toLocaleString()}</Text>
                      </View>
                    ))}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>{t(tokens.dashboard.totalDeductions)}</Text>
                    <Text style={[styles.totalValue, { color: '#E74C3C' }]}>{displayTask.details.total_deductions?.toLocaleString() || '0.00'}</Text>
                  </View>
                </View>

                {/* Net Settlement */}
                <View style={[styles.netSettlementBox, { backgroundColor: displayTask.details.net_settlement >= 0 ? 'rgba(46, 204, 64, 0.05)' : 'rgba(231, 76, 60, 0.05)' }]}>
                  <Text style={styles.netLabel}>{t(tokens.dashboard.netSettlement)}</Text>
                  <Text style={[styles.netValue, { color: displayTask.details.net_settlement >= 0 ? '#2ECC40' : '#E74C3C' }]}>
                    {displayTask.details.net_settlement?.toLocaleString() || '0.00'}
                  </Text>
                </View>
              </View>
            )}

            {/* Vacation Settlement Section */}
            {(displayTask.taskType === 'VACATION_SETTLEMENT' || displayTask.taskName === 'Vacation Settlement') && displayTask.details && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t(tokens.dashboard.vacationSettlementDetails)}</Text>

                {displayTask.details.related_employee_details && (
                  <View>
                    <View style={styles.componentRow}>
                      <Text style={styles.componentLabel}>{t(tokens.dashboard.associatedEmployee)}</Text>
                      <Text style={[styles.componentValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1} ellipsizeMode="tail">{displayTask.details.related_employee_details.employee_name}</Text>
                    </View>
                    <View style={styles.componentRow}>
                      <Text style={styles.componentLabel}>{t(tokens.tasks.code || 'Code')}</Text>
                      <Text style={styles.componentValue}>{displayTask.details.related_employee_details.emp_code}</Text>
                    </View>
                    <View style={styles.componentRow}>
                      <Text style={styles.componentLabel}>{t(tokens.tasks.position || 'Position')}</Text>
                      <Text style={styles.componentValue}>{displayTask.details.related_employee_details.position_name}</Text>
                    </View>
                  </View>
                )}

                {displayTask.details.task_code && (
                  <View style={[styles.componentRow, { borderBottomWidth: 0, marginTop: 4 }]}>
                    <Text style={styles.componentLabel}>{t(tokens.tasks.code || 'Task Code')}</Text>
                    <Text style={[styles.componentValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1} ellipsizeMode="tail">{displayTask.details.task_code}</Text>
                  </View>
                )}

                {displayTask.details.priority && (
                  <View style={[styles.componentRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.componentLabel}>{t(tokens.common.priority)}</Text>
                    <Text style={styles.componentValue}>{displayTask.details.priority}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Dependencies Section */}
            {((displayTask.details?.depend_on?.length > 0) || (displayTask.details?.dependencies?.length > 0)) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t(tokens.tasks.dependencies)}</Text>
                {(displayTask.details.depend_on || displayTask.details.dependencies).map((dep, idx) => {
                  const name = dep.task_name || dep.depends_on_task_name;
                  const status = dep.status || dep.depends_on_status;
                  const code = dep.task_code || dep.depends_on_task_code;

                  return (
                    <View key={`dep-${idx}`} style={styles.assetItem}>
                      <View style={styles.assetInfo}>
                        <View style={styles.assetHeader}>
                          <Text style={[styles.assetName, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
                          <View style={[
                            styles.assetStatusBadge,
                            status === 'COMPLETED' ? { backgroundColor: '#E8F5E9' } : { backgroundColor: 'rgba(243, 156, 18, 0.1)' }
                          ]}>
                            <Text style={[
                              styles.assetStatusText,
                              status === 'COMPLETED' ? { color: '#27AE60' } : { color: '#F39C12' }
                            ]}>{status}</Text>
                          </View>
                        </View>
                        <View style={styles.assetDetails}>
                          {code && (
                            <Text style={[styles.assetDetailText, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                              {t(tokens.tasks.code)}: {code}
                            </Text>
                          )}
                        </View>
                        {dep.assignee && (
                          <View style={[styles.assetDetails, { marginTop: 4 }]}>
                            <Text style={[styles.assetDetailText, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                              {t(tokens.tasks.assignee)}: {dep.assignee}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Subtasks Section */}
            {displayTask.details?.subtasks?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t(tokens.tasks.subtasks)}</Text>
                {displayTask.details.subtasks.map((sub, idx) => (
                  <View key={`sub-${idx}`} style={styles.assetItem}>
                    <View style={styles.assetInfo}>
                      <View style={styles.assetHeader}>
                        <Text style={[styles.assetName, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{sub.task_name}</Text>
                        <View style={[styles.assetStatusBadge, sub.status === 'COMPLETED' ? { backgroundColor: '#E8F5E9' } : { backgroundColor: 'rgba(243, 156, 18, 0.1)' }]}>
                          <Text style={[styles.assetStatusText, sub.status === 'COMPLETED' ? { color: '#27AE60' } : { color: '#F39C12' }]}>{sub.status}</Text>
                        </View>
                      </View>
                      <View style={styles.assetDetails}>
                        <Text style={[styles.assetDetailText, { flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                          {t(tokens.tasks.code)}: {sub.task_code}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* General Attachments Section */}
            {displayTask.attachment_presigned_url?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t(tokens.tasks.attachments)}</Text>
                {displayTask.attachment_presigned_url.map((url, idx) => (
                  <TouchableOpacity
                    key={`gen-attach-${idx}`}
                    style={styles.attachmentItem}
                    onPress={() => { /* Open attachment */ }}
                  >
                    <Ionicons name="document-attach" size={20} color="#4169E1" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.attachmentText} numberOfLines={1}>
                        {displayTask.attachment_url?.[idx] || `Attachment ${idx + 1}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Comments / Activity Section */}
            {(displayTask.comments?.length > 0 || isActionableTask) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#395CC6" />
                  <Text style={styles.sheetSectionHeader}>{t(tokens.dashboard.comments)}</Text>
                </View>


                <View style={styles.commentInputWrapper}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder={t(tokens.dashboard.addCommentPlaceholder)}
                    value={newComment}
                    onChangeText={setNewComment}
                    placeholderTextColor="#9EA0A3"
                  />
                  {postingComment ? (
                    <ActivityIndicator size="small" color="#395CC6" style={{ marginLeft: 8 }} />
                  ) : (
                    <TouchableOpacity
                      style={[styles.postButton, !newComment.trim() && styles.postButtonDisabled]}
                      onPress={handleAddComment}
                      disabled={postingComment || !newComment.trim()}
                    >
                      <Text style={styles.postButtonText}>{t(tokens.dashboard.post)}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.activityHeader}>
                  <Text style={styles.activityTitle}>{t(tokens.dashboard.activity)}</Text>
                  <View style={styles.activityBadge}>
                    <Text style={styles.activityBadgeText}>{displayTask.comments?.length || 0}</Text>
                  </View>
                </View>

                <View style={styles.commentList}>
                  {(displayTask.comments || []).map((c, idx) => (
                    <View key={`comment-${idx}`} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{c.cmd_by_name || 'System'}</Text>
                        <Text style={styles.commentDate}>
                          {c.cmd_at ? new Date(c.cmd_at).toLocaleDateString() : ''}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{c.comment}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Attachments Section */}
            {isActionableTask && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="attach-outline" size={20} color="#395CC6" />
                  <Text style={styles.sheetSectionHeader}>{t(tokens.dashboard.attachment)}</Text>

                </View>

                <TouchableOpacity
                  style={styles.inlineUploadBox}
                  onPress={async () => {
                    try {
                      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', multiple: true });
                      if (!result.canceled) {
                        await handleFileUpload(result.assets);
                      }
                    } catch (err) {
                      console.log('Picker error:', err);
                    }
                  }}
                >
                  <Ionicons name="cloud-upload-outline" size={20} color="#4169E1" />
                  <Text style={styles.uploadLinkText}>{t(tokens.dashboard.chooseFiles)}</Text>
                </TouchableOpacity>

                {files.map((file, idx) => (
                  <View key={`file-${idx}`} style={styles.inlineFileItem}>
                    <Ionicons name="document-outline" size={16} color="#62636C" />
                    <Text style={styles.inlineFileName} numberOfLines={1}>{file.name}</Text>
                    <TouchableOpacity onPress={() => setFiles(prev => prev.filter((_, i) => i !== idx))}>
                      <Ionicons name="close-circle" size={16} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer Action Button */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {displayTask.status === 'Completed' || displayTask.status === 'Expired' ? (
              <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
                <Text style={styles.primaryButtonText}>{t(tokens.common.close)}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (isCompletedButtonDisabled || completing) && styles.disabledButton
                ]}
                onPress={(isCompletedButtonDisabled || completing) ? null : handleComplete}
                activeOpacity={(isCompletedButtonDisabled || completing) ? 1 : 0.7}
              >
                {completing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[
                    styles.primaryButtonText,
                    isCompletedButtonDisabled && styles.disabledButtonText
                  ]}>{t(tokens.actions.completed)}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetContent: {
    backgroundColor: '#FFFFFF', // Refined to pure white
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    padding: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DEDFE4',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1F24',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 'auto',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1F24',
    marginBottom: 16,
    textTransform: 'capitalize',
    letterSpacing: 0.3,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#62636C',
    opacity: 0.6,
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    color: '#1E1F24',
    fontWeight: '500',
  },
  // Asset Item Styles
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F1F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  assetInfo: {
    flex: 1,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
    marginRight: 10,
  },
  assetStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  assetStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  assetDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetDetailText: {
    fontSize: 13,
    color: '#8E9199',
  },
  textDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#D1D3D9',
    marginHorizontal: 8,
  },
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  verticalArrowDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#F0F1F3',
    marginRight: 12,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#DEDFE4',
  },
  componentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  componentLabel: {
    fontSize: 13,
    color: '#62636C',
    fontWeight: '500',
  },
  componentValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1F24',
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#62636C',
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#DEDFE4',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1F24',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1F24',
  },
  netSettlementBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  netLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1F24',
  },
  netValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E1E8F7',
  },
  attachmentText: {
    fontSize: 13,
    color: '#4169E1',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    padding: 16,
  },
  primaryButton: {
    backgroundColor: '#4169E1',
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#DEDFE4',
  },
  disabledButtonText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Asset Card Styles
  assetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  assetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  assetIdBadge: {
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8F7',
  },
  assetIdText: {
    fontSize: 11,
    color: '#395CC6',
    fontWeight: '700',
  },
  assetDetailsRow: {
    marginBottom: 0,
  },
  assetLabel: {
    fontSize: 12,
    color: '#62636C',
    opacity: 0.7,
    fontWeight: '500',
  },
  assetValue: {
    color: '#1E1F24',
    fontSize: 13,
    fontWeight: '600',
  },
  inlineControls: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F3',
    gap: 20,
  },
  controlGroup: {
    gap: 8,
  },
  controlLabel: {
    fontSize: 14,
    color: '#1E1F24',
    fontWeight: '600',
    marginBottom: 4,
  },
  miniButtonGroup: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  miniButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F2F5',
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniButtonActiveGood: {
    borderColor: '#4CD964',
    backgroundColor: '#4CD964',
  },
  miniButtonActiveAverage: {
    borderColor: '#F39C12',
    backgroundColor: '#F39C12',
  },
  miniButtonActiveBad: {
    borderColor: '#FF3B30',
    backgroundColor: '#FF3B30',
  },
  miniButtonActivePrimary: {
    borderColor: '#395CC6',
    backgroundColor: '#395CC6',
  },
  miniButtonActiveSecondary: {
    borderColor: '#62636C',
    backgroundColor: '#62636C',
  },
  miniButtonText: {
    fontSize: 13,
    color: '#62636C',
    fontWeight: '700',
  },
  miniButtonTextActive: {
    color: '#FFFFFF',
  },
  assetInputRow: {
    marginTop: 16,
    gap: 8,
  },
  assetInputLabel: {
    fontSize: 13,
    color: '#1E1F24',
    fontWeight: '600',
  },
  assetTextInput: {
    borderWidth: 1,
    borderColor: '#F0F2F5',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: '#1E1F24',
    backgroundColor: '#F8FAFF',
    minHeight: 40,
  },
  assetAmountInput: {
    borderWidth: 1,
    borderColor: '#F0F2F5',
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: '#1E1F24',
    backgroundColor: '#F8FAFF',
    height: 40,
    width: '100%',
  },
  inlineUploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#395CC6',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'rgba(57, 92, 198, 0.05)',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadLinkText: {
    fontSize: 14,
    color: '#395CC6',
    fontWeight: '600',
  },
  inlineFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F8FAFF',
    borderRadius: 6,
    marginBottom: 8,
    gap: 8,
  },
  inlineFileName: {
    flex: 1,
    fontSize: 13,
    color: '#1E1F24',
  },
  // Comment Styles
  commentList: {
    marginTop: 12,
    gap: 12,
  },
  commentItem: {
    backgroundColor: '#F8F9FB',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUser: {
    fontSize: 11,
    fontWeight: '700',
    color: '#395CC6',
    textTransform: 'uppercase',
  },
  commentDate: {
    fontSize: 10,
    color: '#62636C',
    opacity: 0.7,
  },
  commentText: {
    fontSize: 13,
    color: '#1E1F24',
    lineHeight: 18,
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8F7',
    paddingHorizontal: 12,
    marginTop: 8,
    height: 44,
  },
  commentInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E1F24',
    paddingVertical: 8,
  },
  commentSendBtn: {
    marginLeft: 8,
    padding: 4,
  },
  // Missing Activity Styles
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1F24',
  },
  activityBadge: {
    backgroundColor: 'rgba(57, 92, 198, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#395CC6',
  },
  sheetSectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1F24',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
});

export default TaskDetailsSheet;
