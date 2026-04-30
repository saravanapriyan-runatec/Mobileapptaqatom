import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Platform, ScrollView, Dimensions, Modal, Animated, PanResponder, Easing, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimePickerModal } from 'react-native-paper-dates';
import { useTranslation } from 'react-i18next';
import { Portal } from 'react-native-paper';
import tokens from '../../../locales/tokens';
import { useRegularization } from '../../context/RegularizationContext';
import moment from 'moment';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const RegularizeModal = ({ visible, onClose, date, onSubmit }) => {
  const { t } = useTranslation();
  const { requests, loading, fetchRequests } = useRegularization();
  
  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const detailSlideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [reason, setReason] = useState('');
  const [checkInTime, setCheckInTime] = useState(new Date());
  const [checkOutTime, setCheckOutTime] = useState(new Date());
  
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  
  const [isCheckInSet, setIsCheckInSet] = useState(false);
  const [isCheckOutSet, setIsCheckOutSet] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      setReason('');
      setCheckInTime(new Date());
      setCheckOutTime(new Date());
      setIsCheckInSet(false);
      setIsCheckOutSet(false);
      fetchRequests();

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 120
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      }).start(() => setShowModal(false));
    }
  }, [visible]);

  useEffect(() => {
    if (isDetailVisible) {
      setShowDetailModal(true);
      Animated.spring(detailSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 120
      }).start();
    } else {
      Animated.timing(detailSlideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      }).start(() => setShowDetailModal(false));
    }
  }, [isDetailVisible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          onClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0
          }).start();
        }
      },
    })
  ).current;

  const detailPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          detailSlideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          setIsDetailVisible(false);
        } else {
          Animated.spring(detailSlideAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0
          }).start();
        }
      },
    })
  ).current;

  const handleCheckInChange = ({ hours, minutes }) => {
    setShowCheckInPicker(false);
    if (hours !== undefined && minutes !== undefined) {
      const newTime = new Date(checkInTime);
      newTime.setHours(hours);
      newTime.setMinutes(minutes);
      setCheckInTime(newTime);
      setIsCheckInSet(true);
    }
  };

  const handleCheckOutChange = ({ hours, minutes }) => {
    setShowCheckOutPicker(false);
    if (hours !== undefined && minutes !== undefined) {
      const newTime = new Date(checkOutTime);
      newTime.setHours(hours);
      newTime.setMinutes(minutes);
      setCheckOutTime(newTime);
      setIsCheckOutSet(true);
    }
  };

  const formatTime = (date) => {
    if (!date) return '--:--';
    return moment(date).format('hh:mm A');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return '#2ECC40';
      case 'rejected': return '#E74C3C';
      case 'pending': return '#F39C12';
      default: return '#62636C';
    }
  };

  const getStatusBg = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'rgba(46, 204, 64, 0.1)';
      case 'rejected': return 'rgba(231, 76, 60, 0.1)';
      case 'pending': return 'rgba(243, 156, 18, 0.1)';
      default: return 'rgba(98, 99, 108, 0.1)';
    }
  };

  const handleSubmit = () => {
    onSubmit({
      date,
      checkIn: isCheckInSet ? checkInTime : null,
      checkOut: isCheckOutSet ? checkOutTime : null,
      reason
    });
  };

  if (!showModal && !showDetailModal) return null;

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <Portal.Host>
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1} 
              onPress={() => {
                Keyboard.dismiss();
                onClose();
              }} 
            />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ width: '100%', justifyContent: 'flex-end' }}
              >
              <Animated.View 
                style={[
                  styles.sheetContent,
                  { transform: [{ translateY: slideAnim }] }
                ]}
                {...panResponder.panHandlers}
              >
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <Ionicons name="create-outline" size={24} color="#1E1F24" />
                  <Text style={styles.sheetTitle}>{t(tokens.dashboard.regularize)}</Text>
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  style={styles.scrollArea}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t(tokens.common.date)}</Text>
                    <View style={styles.inputContainer}>
                      <Text style={styles.dateText}>
                        {date ? (date instanceof Date ? date.toLocaleDateString('en-GB') : date) : '--/--/----'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#62636C" />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={styles.col}>
                      <Text style={styles.label}>{t(tokens.dashboard.actualCheckIn)}</Text>
                      <TouchableOpacity style={styles.inputContainer} onPress={() => setShowCheckInPicker(true)}>
                        <Text style={[styles.timeText, !isCheckInSet && styles.placeholderText]}>
                          {isCheckInSet ? formatTime(checkInTime) : '--:--'}
                        </Text>
                        <Ionicons name="time-outline" size={20} color="#62636C" />
                      </TouchableOpacity>
                    </View>
                    <View style={{ width: 12 }} />
                    <View style={styles.col}>
                      <Text style={styles.label}>{t(tokens.dashboard.actualCheckOut)}</Text>
                      <TouchableOpacity style={styles.inputContainer} onPress={() => setShowCheckOutPicker(true)}>
                        <Text style={[styles.timeText, !isCheckOutSet && styles.placeholderText]}>
                          {isCheckOutSet ? formatTime(checkOutTime) : '--:--'}
                        </Text>
                        <Ionicons name="time-outline" size={20} color="#62636C" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>{t(tokens.common.reason)}</Text>
                    <View style={[styles.inputContainer, styles.textAreaContainer]}>
                      <TextInput
                        style={styles.textArea}
                        placeholder={t(tokens.dashboard.enterHere)}
                        placeholderTextColor="#9E9E9E"
                        multiline
                        numberOfLines={3}
                        value={reason}
                        onChangeText={setReason}
                        textAlignVertical="top"
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                        blurOnSubmit={true}
                      />
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.sheetActions}>
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>{t(tokens.actions.cancel)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>{t(tokens.dashboard.regularize)}</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
          </View>

          {/* Render Time Pickers INTO the Modal window's Portal host */}
          <Portal>
            <TimePickerModal
              visible={showCheckInPicker}
              onDismiss={() => setShowCheckInPicker(false)}
              onConfirm={handleCheckInChange}
              hours={checkInTime.getHours()}
              minutes={checkInTime.getMinutes()}
              use24HourClock={false}
            />
            <TimePickerModal
              visible={showCheckOutPicker}
              onDismiss={() => setShowCheckOutPicker(false)}
              onConfirm={handleCheckOutChange}
              hours={checkOutTime.getHours()}
              minutes={checkOutTime.getMinutes()}
              use24HourClock={false}
            />
          </Portal>
        </Portal.Host>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showDetailModal}
        onRequestClose={() => setIsDetailVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setIsDetailVisible(false)} 
          />
          <Animated.View 
            style={[
              styles.sheetContent,
              styles.detailSheetContent,
              { transform: [{ translateY: detailSlideAnim }] }
            ]}
            {...detailPanResponder.panHandlers}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.detailHeader}>
              <View>
                <View style={styles.detailDateRow}>
                  <Text style={styles.detailTitle}>{selectedRequest?.date || '--'}</Text>
                  <View style={[styles.detailStatusBadge, { backgroundColor: getStatusBg(selectedRequest?.status) }]}>
                    <Text style={[styles.detailStatusText, { color: getStatusColor(selectedRequest?.status) }]}>
                      {selectedRequest?.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.detailSubtitle}>Submitted on: {selectedRequest?.created_at?.split('T')[0] || '--'}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDetailVisible(false)} style={styles.closeIconBtn}>
                <Ionicons name="close" size={24} color="#1E1F24" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollArea}>
              <View style={styles.detailCard}>
                <Text style={styles.cardSectionTitle}>{t(tokens.home.timing)}</Text>
                <View style={styles.cardRow}>
                  <View style={styles.cardCol}>
                    <Text style={styles.cardLabel}>{t(tokens.dashboard.actualCheckIn)}</Text>
                    <Text style={styles.cardValue}>{selectedRequest?.actual_check_in || '--'}</Text>
                  </View>
                  <View style={styles.verticalLineDetail} />
                  <View style={styles.cardCol}>
                    <Text style={styles.cardLabel}>{t(tokens.dashboard.actualCheckOut)}</Text>
                    <Text style={styles.cardValue}>{selectedRequest?.actual_check_out || '--'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.cardSectionTitle}>{t(tokens.common.reason)}</Text>
                <Text style={styles.reasonValue}>{selectedRequest?.reason || 'No reason provided'}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.closeButtonPrimary} onPress={() => setIsDetailVisible(false)}>
              <Text style={styles.closeButtonPrimaryText}>{t(tokens.common.close)}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  detailSheetContent: {
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DEDFE4',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#62636C',
    marginBottom: 6,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DEDFE4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  textAreaContainer: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#1E1F24',
  },
  timeText: {
    fontSize: 14,
    color: '#1E1F24',
  },
  placeholderText: {
    color: '#9E9E9E',
  },
  textArea: {
    flex: 1,
    fontSize: 14,
    color: '#1E1F24',
    padding: 0,
    textAlignVertical: 'top',
    width: '100%',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    paddingTop: 16,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DEDFE4',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#62636C',
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#4169E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  detailDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1F24',
  },
  detailStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailSubtitle: {
    fontSize: 12,
    color: '#62636C',
    opacity: 0.7,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F6F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCard: {
    backgroundColor: '#FAFBFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFF0F3',
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCol: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: '#62636C',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
  },
  reasonValue: {
    fontSize: 14,
    color: '#1E1F24',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  closeButtonPrimary: {
    backgroundColor: '#4169E1',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  verticalLineDetail: {
    width: 1,
    height: 30,
    backgroundColor: '#DEDFE4',
    marginHorizontal: 16,
  },
});

export default RegularizeModal;
