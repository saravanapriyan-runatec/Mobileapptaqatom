import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

export default function ExpenseBottomSheet({ visible, expenseData, onClose }) {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const translateY = useRef(new Animated.Value(height)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    // Internal state to handle the "real" visibility and data
    const [shouldRender, setShouldRender] = useState(visible);
    const [internalData, setInternalData] = useState(expenseData);

    useEffect(() => {
        if (visible) {
            setInternalData(expenseData);
            setShouldRender(true);
            
            // Reset positions/opacity for a smooth entry every time
            translateY.setValue(height);
            opacity.setValue(0);

            // Animate overlay and sheet
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8
                })
            ]).start();
        } else {
            // Animate down then stop rendering
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true
                }),
                Animated.timing(translateY, {
                    toValue: height,
                    duration: 250,
                    useNativeDriver: true
                })
            ]).start(({ finished }) => {
                if (finished) {
                    setShouldRender(false);
                }
            });
        }
    }, [visible, expenseData]);

    if (!shouldRender && !visible) return null;

    const getStatusText = (status) => {
        switch (status) {
            case 'Approved': return t(tokens.actions.approved);
            case 'Pending': return t(tokens.actions.pending);
            case 'Rejected': return t(tokens.actions.rejected);
            default: return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return '#22C55E';
            case 'Pending': return '#F59E0B';
            case 'Rejected': return '#EF4444';
            default: return '#999BA1';
        }
    };

    const getStatusBg = (status) => {
        switch (status) {
            case 'Approved': return '#DCFCE7';
            case 'Pending': return '#FEF3C7';
            case 'Rejected': return '#FEE2E2';
            default: return '#F0F2F5';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved': return { name: 'checkmark-circle', color: '#22C55E' };
            case 'Pending': return { name: 'time', color: '#F59E0B' };
            case 'Rejected': return { name: 'close-circle', color: '#EF4444' };
            default: return { name: 'ellipse-outline', color: '#999BA1' };
        }
    };

    return (
        <Modal
            visible={shouldRender}
            transparent
            animationType="fade" // uses fade for smoother overlay transition
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { opacity }
                    ]}
                >
                    <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                    <LinearGradient
                        colors={['rgba(30, 31, 36, 0.47)', 'rgba(30, 31, 36, 0.10)']}
                        locations={[0.37, 0.82]}
                        style={StyleSheet.absoluteFill}
                    />
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={onClose}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.sheetContainer,
                        { transform: [{ translateY }] },
                        { paddingBottom: insets.bottom + 20 }
                    ]}
                >
                    <View style={styles.dragHandle} />

                    <View style={styles.header}>
                        <Text style={styles.title}>{internalData?.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(internalData?.status) }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(internalData?.status) }]}>
                                {getStatusText(internalData?.status)}
                            </Text>
                        </View>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                        {/* Expense Details Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>{t(tokens.expense.details)}</Text>

                            <View style={styles.row}>
                                <Text style={styles.label}>{t(tokens.common.dateTime)}</Text>
                                <Text style={styles.value}>{internalData?.fullDateTime}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>{t(tokens.common.category)}</Text>
                                <Text style={styles.value}>{internalData?.category}</Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>{t(tokens.common.amount)}</Text>
                                <Text style={styles.value}>SAR {internalData?.amount}</Text>
                            </View>

                            <View style={styles.reasonRow}>
                                <Text style={styles.label}>{t(tokens.common.reason)}</Text>
                                <Text style={styles.reasonValue}>"{internalData?.reason}"</Text>
                            </View>
                        </View>

                        {/* Approval Workflow Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>{t(tokens.expense.approvalWorkflow)}</Text>

                            <View style={styles.workflowContainer}>

                                {/* Step 1: Submitted */}
                                <View style={styles.workflowStep}>
                                    <View style={styles.workflowIconContainer}>
                                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                                        <View style={styles.workflowLine} />
                                    </View>
                                    <View style={styles.workflowContent}>
                                        <Text style={styles.workflowTitle}>{t(tokens.expense.requestSubmitted)}</Text>
                                        <Text style={styles.workflowDate}>{internalData?.date}, 09:30 AM</Text>
                                    </View>
                                </View>

                                {/* Step 2: Final Action / Manager Approval */}
                                <View style={styles.workflowStep}>
                                    <View style={styles.workflowIconContainer}>
                                        <Ionicons
                                            name={getStatusIcon(internalData?.status).name}
                                            size={20}
                                            color={getStatusIcon(internalData?.status).color}
                                            style={{ backgroundColor: '#fff' }}
                                        />
                                    </View>
                                    <View style={styles.workflowContent}>
                                        <Text style={styles.workflowTitle}>
                                            {internalData?.status === 'Pending'
                                                ? t(tokens.expense.managerApproval)
                                                : `${getStatusText(internalData?.status)} ${t(tokens.common.by)} ${internalData?.approver || 'Manager'}`
                                            }
                                        </Text>
                                        <Text style={styles.workflowDate}>
                                            {internalData?.status === 'Pending'
                                                ? t(tokens.expense.lineManager)
                                                : internalData?.actionDate
                                            }
                                        </Text>
                                    </View>
                                </View>

                            </View>
                        </View>

                        {/* Optional Reason Message Box */}
                        {(internalData?.status === 'Approved' && internalData?.approvalReason) && (
                            <View style={[styles.messageBox, styles.messageBoxSuccess]}>
                                <Ionicons name="checkmark-circle" size={24} color="#22C55E" style={styles.messageIcon} />
                                <View style={styles.messageTextContainer}>
                                    <Text style={[styles.messageLabel, { color: '#22C55E' }]}>{t(tokens.common.reason)}:</Text>
                                    <Text style={[styles.messageValue, { color: '#22C55E' }]}>{internalData.approvalReason}</Text>
                                </View>
                            </View>
                        )}

                        {(internalData?.status === 'Rejected' && internalData?.rejectionReason) && (
                            <View style={[styles.messageBox, styles.messageBoxError]}>
                                <Ionicons name="close-circle" size={24} color="#EF4444" style={styles.messageIcon} />
                                <View style={styles.messageTextContainer}>
                                    <Text style={[styles.messageLabel, { color: '#EF4444' }]}>{t(tokens.common.reason)}:</Text>
                                    <Text style={[styles.messageValue, { color: '#EF4444' }]}>{internalData.rejectionReason}</Text>
                                </View>
                            </View>
                        )}

                        {/* Close Button */}
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>{t(tokens.common.close)}</Text>
                        </TouchableOpacity>

                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'transparent',
    },
    sheetContainer: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: height * 0.5,
        maxHeight: height * 0.9,
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 24,
        marginBottom: 20,
        gap: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E1F24',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F0F2F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E1F24',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        color: '#999BA1',
        fontWeight: '400',
    },
    value: {
        fontSize: 14,
        color: '#1E1F24',
        fontWeight: '500',
    },
    reasonRow: {
        marginTop: 8,
    },
    reasonValue: {
        fontSize: 14,
        color: '#1E1F24',
        fontWeight: '500',
        marginTop: 4,
        fontStyle: 'italic',
    },
    workflowContainer: {
        marginTop: 8,
    },
    workflowStep: {
        flexDirection: 'row',
        marginBottom: -4, // Counteract line height for last item
    },
    workflowIconContainer: {
        alignItems: 'center',
        marginRight: 16,
        width: 20,
    },
    workflowLine: {
        width: 1,
        height: 36,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
    },
    workflowContent: {
        flex: 1,
        paddingBottom: 24,
    },
    workflowTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E1F24',
        marginBottom: 4,
    },
    workflowDate: {
        fontSize: 12,
        color: '#999BA1',
    },
    messageBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    messageBoxSuccess: {
        backgroundColor: '#DCFCE7',
        borderColor: '#22C55E',
    },
    messageBoxError: {
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
    },
    messageIcon: {
        marginRight: 12,
        marginTop: -2,
    },
    messageTextContainer: {
        flex: 1,
    },
    messageLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    messageValue: {
        fontSize: 14,
        fontWeight: '400',
    },
    closeButton: {
        height: 52,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
    },
    closeButtonText: {
        color: '#62636C',
        fontSize: 16,
        fontWeight: '600',
    },
});
