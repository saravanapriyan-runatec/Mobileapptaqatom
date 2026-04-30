import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DatePickerModal } from 'react-native-paper-dates';
import Toast from 'react-native-toast-message';
import LoanServices from '../../Services/API/LoanServices';
import AuthService from '../../Services/AuthService';
import ProfileServices from '../../Services/API/ProfileServices';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';

const { width, height } = Dimensions.get('window');

const FormField = ({ label, placeholder, icon, value, onChangeText, multiline, height, isDate, onPress }) => (
    <View style={styles.fieldContainer}>
        {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
        <TouchableOpacity
            activeOpacity={isDate ? 0.7 : 1}
            onPress={isDate ? onPress : undefined}
            style={[
                styles.inputWrapper,
                multiline && { height: height || 120, alignItems: 'flex-start', paddingTop: 12 }
            ]}
        >
            {isDate ? (
                <View style={styles.dateInputContent}>
                    <Text style={[styles.inputText, !value && styles.placeholderText]}>
                        {value || placeholder}
                    </Text>
                    {icon && <Ionicons name={icon} size={20} color="#62636C" />}
                </View>
            ) : (
                <>
                    <TextInput
                        style={[styles.input, multiline && { textAlignVertical: 'top' }]}
                        placeholder={placeholder}
                        placeholderTextColor="#B9BBC6"
                        value={value}
                        onChangeText={onChangeText}
                        multiline={multiline}
                    />
                    {icon && <Ionicons name={icon} size={20} color="#62636C" />}
                </>
            )}
        </TouchableOpacity>
    </View>
);

import { PanResponder } from 'react-native';

const CustomSlider = ({ value, min, max, onChange, onInteractionStart, onInteractionEnd, step = 1, prefix = '', suffix = '' }) => {
    const [layoutWidthState, setLayoutWidthState] = React.useState(0);
    const layoutWidthRef = React.useRef(0);
    const startValue = React.useRef(0);

    // Keep refs of props to avoid stale closures in PanResponder
    const propsRef = React.useRef({ min, max, step, onChange, onInteractionStart, onInteractionEnd, value });
    React.useEffect(() => {
        propsRef.current = { min, max, step, onChange, onInteractionStart, onInteractionEnd, value };
    }, [min, max, step, onChange, onInteractionStart, onInteractionEnd, value]);

    const handleUpdate = (posX) => {
        const { min, max, step, onChange } = propsRef.current;
        const width = layoutWidthRef.current;
        if (width <= 0) return;

        let percent = posX / width;
        percent = Math.max(0, Math.min(1, percent));
        let newValue = min + percent * (max - min);
        newValue = Math.round(newValue / step) * step;
        newValue = Math.max(min, Math.min(max, newValue));
        onChange(newValue);
    };

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return Math.abs(gestureState.dx) > 2;
            },
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
                return Math.abs(gestureState.dx) > 2;
            },
            onPanResponderGrant: (evt) => {
                propsRef.current.onInteractionStart?.();
                const posX = evt.nativeEvent.locationX;
                startValue.current = parseFloat(propsRef.current.value) || propsRef.current.min;
                handleUpdate(posX);
            },
            onPanResponderMove: (evt, gestureState) => {
                const { min, max } = propsRef.current;
                const width = layoutWidthRef.current;
                if (width <= 0) return;
                const initialPos = ((startValue.current - min) / (max - min)) * width;
                handleUpdate(initialPos + gestureState.dx);
            },
            onPanResponderRelease: () => {
                propsRef.current.onInteractionEnd?.();
            },
            onPanResponderTerminate: () => {
                propsRef.current.onInteractionEnd?.();
            },
            onPanResponderTerminationRequest: () => false,
            onShouldBlockNativeResponder: () => true,
        })
    ).current;

    const currentVal = parseFloat(value) || 0;
    const progressWidth = layoutWidthState > 0 ? ((currentVal - min) / (max - min)) * layoutWidthState : 0;

    return (
        <View style={styles.sliderContainer}>
            <View
                style={styles.sliderTouchArea}
                onLayout={(e) => {
                    const w = e.nativeEvent.layout.width;
                    setLayoutWidthState(w);
                    layoutWidthRef.current = w;
                }}
                {...panResponder.panHandlers}
            >
                <View style={styles.trackBase} pointerEvents="none" />
                <View style={[styles.progress, { width: `${layoutWidthState > 0 ? (progressWidth / layoutWidthState) * 100 : 0}%` }]} pointerEvents="none" />
                <View style={[styles.thumb, { left: Math.max(0, Math.min(layoutWidthState > 0 ? layoutWidthState - 24 : 0, progressWidth - 12)) }]} pointerEvents="none" />
            </View>
        </View>
    );
};

const handleTextChange = (setter, val) => {
    const numericVal = val.replace(/[^0-9.]/g, '');
    setter(numericVal);
};

const handleTextBlur = (setter, val, min, max) => {
    let num = parseFloat(val);
    if (isNaN(num)) num = min;
    if (num < min) num = min;
    if (num > max) num = max;
    setter(num.toString());
};

const EMICalculatorModal = ({ visible, onClose, initialAmount, initialInterest, initialTenure, t }) => {
    const [scrollEnabled, setScrollEnabled] = useState(true);
    const [calcAmount, setCalcAmount] = useState(initialAmount || '');
    const [calcInterest, setCalcInterest] = useState(initialInterest || '5');
    const [calcTenure, setCalcTenure] = useState(initialTenure || '12');

    // Sync from props only when modal becomes visible
    React.useEffect(() => {
        if (visible) {
            setCalcAmount(initialAmount || '');
            setCalcInterest(initialInterest || '5');
            setCalcTenure(initialTenure || '12');
        }
    }, [visible, initialAmount, initialInterest, initialTenure]);

    const calculateEMI = () => {
        const p = parseFloat(calcAmount) || 0;
        const r = (parseFloat(calcInterest) || 0) / 12 / 100;
        const n = parseFloat(calcTenure) || 0;

        if (p <= 0 || r <= 0 || n <= 0) return 0;
        const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        return isFinite(emi) ? Math.round(emi) : 0;
    };

    const emiValue = calculateEMI();
    const totalRepay = emiValue * (parseInt(calcTenure) || 0);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.calculatorContent}>
                    <View style={styles.calcHeader}>
                        <Ionicons name="calculator" size={24} color="#1E1F24" />
                        <Text style={styles.calcTitle}>{t(tokens.common.emiCalculator)}</Text>
                    </View>

                    <ScrollView
                        scrollEnabled={scrollEnabled}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.calcScrollContent}
                    >
                        <View style={styles.resultsRow}>
                            <View style={styles.resultItem}>
                                <Text style={styles.resultLabel}>{t(tokens.common.totalRepayAmount)}</Text>
                                <Text style={styles.resultValue}>SAR {totalRepay.toLocaleString()}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.resultItem}>
                                <Text style={styles.resultLabel}>{t(tokens.common.emi)}</Text>
                                <Text style={styles.resultValue}>SAR {emiValue.toLocaleString()}</Text>
                            </View>
                        </View>

                        <View style={styles.sliderSection}>
                            {/* Loan Amount */}
                            <View style={styles.fieldWrapper}>
                                <View style={styles.inputLabelRow}>
                                    <Text style={styles.inputLabel}>{t(tokens.loans.amount)}</Text>
                                    <TextInput
                                        style={styles.boxInput}
                                        value={calcAmount.toString()}
                                        onChangeText={(v) => handleTextChange(setCalcAmount, v)}
                                        onBlur={() => handleTextBlur(setCalcAmount, calcAmount.toString(), 0, 100000)}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                                <CustomSlider
                                    value={parseFloat(calcAmount) || 0}
                                    min={0}
                                    max={100000}
                                    step={100}
                                    onChange={(v) => setCalcAmount(v.toString())}
                                    onInteractionStart={() => setScrollEnabled(false)}
                                    onInteractionEnd={() => setScrollEnabled(true)}
                                />
                            </View>

                            {/* Interest Rate */}
                            <View style={styles.fieldWrapper}>
                                <View style={styles.inputLabelRow}>
                                    <Text style={styles.inputLabel}>{t(tokens.loans.interestRate)}</Text>
                                    <TextInput
                                        style={styles.boxInput}
                                        value={calcInterest.toString()}
                                        onChangeText={(v) => handleTextChange(setCalcInterest, v)}
                                        onBlur={() => handleTextBlur(setCalcInterest, calcInterest.toString(), 0.5, 8)}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                                <CustomSlider
                                    value={parseFloat(calcInterest) || 0.5}
                                    min={0.5}
                                    max={8}
                                    step={0.1}
                                    onChange={(v) => setCalcInterest(v.toString())}
                                    onInteractionStart={() => setScrollEnabled(false)}
                                    onInteractionEnd={() => setScrollEnabled(true)}
                                />
                            </View>

                            {/* Tenure */}
                            <View style={styles.fieldWrapper}>
                                <View style={styles.inputLabelRow}>
                                    <Text style={styles.inputLabel}>{t(tokens.loans.tenure)}</Text>
                                    <TextInput
                                        style={styles.boxInput}
                                        value={calcTenure.toString()}
                                        onChangeText={(v) => handleTextChange(setCalcTenure, v)}
                                        onBlur={() => handleTextBlur(setCalcTenure, calcTenure.toString(), 3, 60)}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                                <CustomSlider
                                    value={parseInt(calcTenure) || 3}
                                    min={3}
                                    max={60}
                                    step={1}
                                    onChange={(v) => setCalcTenure(v.toString())}
                                    onInteractionStart={() => setScrollEnabled(false)}
                                    onInteractionEnd={() => setScrollEnabled(true)}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.outlinedCloseButton} onPress={onClose}>
                            <Text style={styles.outlinedCloseText}>{t(tokens.common.close)}</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default function ApplyLoanScreen({ onBack }) {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [calcVisible, setCalcVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const [category, setCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [interestRate, setInterestRate] = useState('5');
    const [tenure, setTenure] = useState('12');
    const [expectedDate, setExpectedDate] = useState(null);
    const [emiStartDate, setEmiStartDate] = useState(null);
    const [description, setDescription] = useState('');

    const [showExpectedPicker, setShowExpectedPicker] = useState(false);
    const [showEmiPicker, setShowEmiPicker] = useState(false);

    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    const onConfirmExpected = React.useCallback((params) => {
        setShowExpectedPicker(false);
        if (params.date) setExpectedDate(params.date);
    }, []);

    const onConfirmEmiStart = React.useCallback((params) => {
        setShowEmiPicker(false);
        if (params.date) setEmiStartDate(params.date);
    }, []);

    const handleApply = async () => {
        if (!category || !amount || !expectedDate || !emiStartDate || !description) {
            Toast.show({
                type: 'error',
                text1: t(tokens.messages.requiredFields),
                text2: t(tokens.messages.fillAllDetails)
            });
            return;
        }

        setLoading(true);
        try {
            // 1. Get Auth User ID -> Username -> Emp ID (Robust Pattern)
            const authUserId = await AuthService.getUserId();
            console.log('DEBUG: ApplyLoan AuthUserId:', authUserId);

            const userDetails = await ProfileServices.getUserDetailsData(authUserId);
            console.log('DEBUG: ApplyLoan UserDetails:', JSON.stringify(userDetails, null, 2));

            const username = userDetails?.username;
            console.log('DEBUG: ApplyLoan Username:', username);

            const employee = await ProfileServices.getEmployeeDetailsData(username);
            console.log('DEBUG: ApplyLoan EmployeeDetails:', JSON.stringify(employee, null, 2));

            const empId = employee?.id;
            console.log('DEBUG: ApplyLoan Resolved empId:', empId);

            if (!empId) {
                console.error("DEBUG: ApplyLoan - No employee ID found at final step");
                throw new Error('Could not retrieve employee ID.');
            }

            // Specific payload structure required by the backend
            const payload = {
                loan_category: category,
                loan_amount: Number(amount),
                interest_rate: Number(interestRate),
                tenure_months: Number(tenure),
                predictable_month: expectedDate.toISOString().split('T')[0],
                terms_month: emiStartDate.toISOString().split('T')[0],
                notes: description,
                employee_id: Number(empId)
            };

            console.log("DEBUG: Loan Application Payload:", JSON.stringify(payload, null, 2));

            const response = await LoanServices.postLoanDetails(payload);
            console.log("DEBUG: Loan Application Success Response:", response);

            Toast.show({
                type: 'success',
                text1: t(tokens.messages.success),
                text2: t(tokens.messages.loanAppliedSuccess)
            });

            // Wait a bit for toast to be visible
            setTimeout(() => onBack(), 600);
        } catch (error) {
            console.log("DEBUG: Apply Loan Error Object:", JSON.stringify(error, null, 2));
            console.error("Apply Loan Error Detail:", error?.errorResponse?.errors);

            let errorMessage = error?.detail || error?.message || t(tokens.messages.somethingWentWrong);
            if (error?.errorResponse?.errors) {
                // Try to extract specific validation errors
                const fieldErrors = error.errorResponse.errors;
                if (typeof fieldErrors === 'object') {
                    const firstField = Object.keys(fieldErrors)[0];
                    const firstMsg = Array.isArray(fieldErrors[firstField]) ? fieldErrors[firstField][0] : fieldErrors[firstField];
                    if (firstField && firstMsg) {
                        errorMessage = `${firstField}: ${firstMsg}`;
                    }
                }
            }

            Toast.show({
                type: 'error',
                text1: t(tokens.messages.submissionFailed),
                text2: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
             <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
 
            <LinearGradient
                colors={['#8EA3E3', '#FFFFFF', '#F8F9FF']}
                locations={[0, 0.3, 1]}
                style={StyleSheet.absoluteFill}
            />
<View style={{ minHeight: height }}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E1F24" />
                    <Text style={styles.headerTitle}>{t(tokens.loans.applyLoan)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.calcTrigger} onPress={() => setCalcVisible(true)}>
                    <Ionicons name="calculator-outline" size={20} color="#4169E1" />
                    <Text style={styles.calcTriggerText}>{t(tokens.common.emiCalculator)}</Text>
                </TouchableOpacity>
            </View>

            {/* <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}> */}
                {/* Request Details Section */}
                <View style={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>{t(tokens.loans.requestDetails)}</Text>

                    <FormField
                        label={t(tokens.common.loanCategory)}
                        placeholder={t(tokens.common.enter)}
                        value={category}
                        onChangeText={setCategory}
                    />

                    <FormField
                        label={t(tokens.loans.amount)}
                        placeholder={t(tokens.common.enter)}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                    />


                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <FormField
                                label={t(tokens.common.expectedMonth)}
                                placeholder="DD/MM/YYYY"
                                icon="calendar-outline"
                                isDate
                                value={formatDate(expectedDate)}
                                onPress={() => setShowExpectedPicker(true)}
                            />
                        </View>
                        <View style={{ width: 16 }} />
                        <View style={{ flex: 1 }}>
                            <FormField
                                label={t(tokens.common.emiStartsFrom)}
                                placeholder="DD/MM/YYYY"
                                icon="calendar-outline"
                                isDate
                                value={formatDate(emiStartDate)}
                                onPress={() => setShowEmiPicker(true)}
                            />
                        </View>
                    </View>
                </View>


                {/* Description Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>{t(tokens.common.description)}</Text>
                    <FormField
                        placeholder={t(tokens.common.enterHere)}
                        multiline
                        height={120}
                        value={description}
                        onChangeText={setDescription}
                    />
                    </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity
                    style={[styles.applyButton, loading && { opacity: 0.7 }]}
                    onPress={handleApply}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={styles.applyButtonText}>{t(tokens.actions.apply)}</Text>
                    )}
                </TouchableOpacity>
            </View>

            <EMICalculatorModal
                visible={calcVisible}
                onClose={() => setCalcVisible(false)}
                initialAmount={amount}
                initialInterest={interestRate}
                initialTenure={tenure}
                t={t}
            />

            <DatePickerModal
                locale="en"
                mode="single"
                visible={showExpectedPicker}
                onDismiss={() => setShowExpectedPicker(false)}
                date={expectedDate || new Date()}
                onConfirm={onConfirmExpected}
            />

            <DatePickerModal
                locale="en"
                mode="single"
                visible={showEmiPicker}
                onDismiss={() => setShowEmiPicker(false)}
                date={emiStartDate || new Date()}
                onConfirm={onConfirmEmiStart}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E1F24',
    },
    calcTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    calcTriggerText: {
        fontSize: 13,
        color: '#4169E1',
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 100,
    },
    section: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 1,
        borderColor: '#EFF0F3',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E1F24',
        marginBottom: 16,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 13,
        color: '#62636C',
        marginBottom: 8,
        fontWeight: '500',
    },
    inputWrapper: {
        height: 48,
        borderWidth: 1,
        borderColor: '#B9BBC6',
        borderRadius: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    dateInputContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#1E1F24',
    },
    inputText: {
        fontSize: 14,
        color: '#1E1F24',
    },
    placeholderText: {
        color: '#B9BBC6',
    },
    row: {
        flexDirection: 'row',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
    },
    applyButton: {
        backgroundColor: '#4169E1',
        height: 52,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    // Calculator Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(30, 31, 36, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calculatorContent: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        maxHeight: '85%',
        borderRadius: 24,
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    calcHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15,
    },
    calcTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E1F24',
    },
    calcScrollContent: {
        paddingBottom: 20,
    },
    resultsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    resultItem: {
        flex: 1,
    },
    resultLabel: {
        fontSize: 11,
        color: '#999BA1',
        marginBottom: 4,
        fontWeight: '500',
    },
    resultValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E1F24',
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#F5F5F5',
        marginHorizontal: 15,
    },
    sliderSection: {
        paddingTop: 5,
    },
    fieldWrapper: {
        marginBottom: 20,
    },
    inputLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 14,
        color: '#1E1F24',
        fontWeight: '600',
    },
    boxInput: {
        width: 75,
        height: 40,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        textAlign: 'center',
        paddingVertical: 0,
        fontSize: 14,
        color: '#1E1F24',
        fontWeight: '700',
        backgroundColor: '#FFFFFF',
    },
    sliderContainer: {
        height: 44,
        justifyContent: 'center',
    },
    sliderTouchArea: {
        height: 44,
        justifyContent: 'center',
        width: '100%',
        position: 'relative',
    },
    trackBase: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        width: '100%',
        position: 'absolute',
        zIndex: 1,
    },
    progress: {
        height: 6,
        backgroundColor: '#4B68FF',
        borderRadius: 3,
        position: 'absolute',
        zIndex: 2,
    },
    thumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#4B68FF',
        borderWidth: 4,
        borderColor: '#D8E2FF', // Glow effect
        zIndex: 10,
    },
    outlinedCloseButton: {
        height: 48,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    outlinedCloseText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
    },
});
