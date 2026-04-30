import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Animated, PanResponder, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';

const { height } = Dimensions.get('window');

const StatusBadge = ({ status }) => {
  let backgroundColor, color;
  switch (status) {
    case 'Present': backgroundColor = 'rgba(46, 204, 64, 0.1)'; color = '#2ecc40'; break;
    case 'Late': backgroundColor = 'rgba(243, 156, 18, 0.1)'; color = '#f39c12'; break;
    case 'Overtime': backgroundColor = 'rgba(142, 68, 173, 0.1)'; color = '#8e44ad'; break;
    case 'Absent': backgroundColor = 'rgba(231, 76, 60, 0.1)'; color = '#e74c3c'; break;
    case 'Leave': backgroundColor = '#edf2fe'; color = '#4169e1'; break;
    default: backgroundColor = '#EFF0F3'; color = '#1E1F24';
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

const ReportDetailsSheet = ({ visible, onClose, report, onPrevious, onNext, hasPrevious, hasNext }) => {
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
        damping: 25, // Adjusted for smoother feel
        stiffness: 80, // Adjusted for smoother feel
        mass: 1,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true
      }).start(() => setShowModal(false));
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

  if (!showModal || !report) return null;

  const isBlurred = report.status.toLowerCase().includes('absent') || report.status.toLowerCase().includes('leave') || ['sl', 'pl', 'cl', 'al', 'ml'].includes(report.status.toLowerCase());

  const renderContent = () => (
    <View style={{ gap: 16 }}>
      <Section title={t(tokens.dashboard.workSummary)}>
        <View style={styles.summaryContainer}>
            <Text style={styles.summaryValue}>{report.duration !== '--' ? report.duration : '00h 00m'}</Text>
            <Text style={styles.summaryLabel}>{t(tokens.dashboard.totalWorkTime)}</Text>
        </View>
        
        {report.status === 'Overtime' && (
            <View style={styles.shiftContainer}>
                <View style={styles.shiftHeader}>
                    <Text style={styles.shiftLabel}>{t(tokens.dashboard.shiftHours)}</Text>
                    <Text style={styles.shiftValue}>07h 45m</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '100%' }]} />
                </View>
                <View style={styles.overtimeBadge}>
                    <Text style={styles.overtimeText}>+01h 15m Overtime</Text>
                </View>
            </View>
        )}
      </Section>

      <Section title={t(tokens.dashboard.punchDetails)}>
        <View style={styles.punchRow}>
            <View style={styles.punchItem}>
                <Text style={styles.punchLabel}>{t(tokens.dashboard.checkIn)}</Text>
                <Text style={styles.punchValue}>{report.checkIn || '--:--'}</Text>
            </View>
            <View style={styles.punchDivider} />
            <View style={styles.punchItem}>
                <Text style={styles.punchLabel}>{t(tokens.dashboard.checkOut)}</Text>
                <Text style={styles.punchValue}>{report.checkOut || '--:--'}</Text>
            </View>
        </View>

        {report.status === 'Late' && (
             <View style={[styles.punchRow, { marginTop: 16 }]}>
                <View style={styles.punchItem}>
                    <Text style={styles.punchLabel}>{t(tokens.dashboard.lateBy)}</Text>
                    <Text style={styles.punchValue}>00h 10m</Text>
                </View>
                <View style={styles.punchDivider} />
                <View style={styles.punchItem}>
                    <Text style={styles.punchLabel}>{t(tokens.dashboard.earlyOut)}</Text>
                    <Text style={styles.punchValue}>00h 00m</Text>
                </View>
            </View>
        )}
      </Section>

      {/* <Section title={t(tokens.dashboard.locationDetails)}>
        <View style={styles.locationContainer}>
            <View style={styles.mapIcon}>
                <Ionicons name="location-outline" size={24} color="#1E1F24" />
            </View>
            <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>Head Office, NY</Text>
                <Text style={styles.locationAddress}>5th Avenue, Manhattan, New York, 10001</Text>
            </View>
        </View>
      </Section> */}
    </View>
  );

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
          
          <View style={styles.header}>
            <View style={styles.headerRow}>
                <Text style={styles.dateTitle}>{report.date}</Text>
                <StatusBadge status={report.status} />
            </View>
            <View style={styles.navButtons}>
                 <TouchableOpacity 
                    style={[styles.navBtn, !hasPrevious && styles.disabledNavBtn]} 
                    onPress={onPrevious}
                    disabled={!hasPrevious}
                 >
                    <Ionicons name="chevron-back" size={20} color={hasPrevious ? "#1E1F24" : "#B9BBC6"} />
                 </TouchableOpacity>
                 <TouchableOpacity 
                    style={[styles.navBtn, !hasNext && styles.disabledNavBtn]} 
                    onPress={onNext}
                    disabled={!hasNext}
                 >
                    <Ionicons name="chevron-forward" size={20} color={hasNext ? "#1E1F24" : "#B9BBC6"} />
                 </TouchableOpacity>
            </View>
          </View>

          <View style={styles.contentContainer}>
             {isBlurred ? (
                  <View style={styles.blurredContainer}>
                      <View style={styles.blurredContent}>
                         {renderContent()}
                      </View>
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(253, 253, 253, 0.9)' }]} />
                      
                      {/* Overlay Card */}
                      <View style={[styles.overlayCard, 
                         report.status === 'Absent' ? styles.absentCard : styles.leaveCard
                      ]}>
                         <Ionicons 
                             name="alert-circle-outline" 
                             size={24} 
                             color={report.status === 'Absent' ? '#e74c3c' : '#4169e1'} 
                         />
                         <Text style={[styles.overlayTitle, 
                              { color: report.status === 'Absent' ? '#e74c3c' : '#4169e1'}
                         ]}>
                             {report.status}
                         </Text>
                         <Text style={[styles.overlaySubtitle,
                              { color: report.status === 'Absent' ? '#e74c3c' : '#4169e1'}
                         ]}>
                         {report.status.toLowerCase().includes('absent') ? t(tokens.dashboard.noLogsOnThisDay) : report.status}
                         </Text>
                      </View>
                  </View>
              ) : (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
                     {renderContent()}
                  </ScrollView>
              )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryButtonText}>{t(tokens.common.close)}</Text>
            </TouchableOpacity>
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
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E1F24',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F7F8F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledNavBtn: {
    opacity: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 16,
    // height: 450, // Removed fixed height to allow dynamic spacing
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFF0F3',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
  },
  summaryContainer: {
    gap: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E1F24',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#1E1F24',
    opacity: 0.47,
  },
  shiftContainer: {
    marginTop: 8,
    gap: 8,
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shiftLabel: {
    fontSize: 13,
    color: '#1E1F24',
    opacity: 0.47,
  },
  shiftValue: {
    fontSize: 11,
    color: '#1E1F24',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#EFF0F3',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4169E1',
    borderRadius: 3,
  },
  overtimeBadge: {
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  overtimeText: {
    fontSize: 11,
    color: '#8e44ad',
    fontWeight: '500',
  },
  punchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  punchItem: {
    flex: 1,
    gap: 4,
  },
  punchLabel: {
    fontSize: 13,
    color: '#1E1F24',
    opacity: 0.47,
  },
  punchValue: {
    fontSize: 13,
    color: '#1E1F24',
    fontWeight: '500',
  },
  punchDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EFF0F3',
    marginHorizontal: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mapIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    gap: 4,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E1F24',
  },
  locationAddress: {
    fontSize: 12,
    color: '#1E1F24',
    opacity: 0.47,
  },
  blurredContainer: {
    // flex: 1, // Removed to allow dynamic height
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16, // Add padding to match ScrollView spacing
  },
  blurredContent: {
    width: '100%',
    // height: '100%', // Removed to allow dynamic height
  },
  overlayCard: {
    position: 'absolute',
    width: 200,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  absentCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#e74c3c',
  },
  leaveCard: {
    backgroundColor: '#edf2fe',
    borderColor: '#4169e1',
  },
  overlayTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  overlaySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    paddingTop: 16,
    // Removed border top to remove separation
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
});

export default ReportDetailsSheet;
