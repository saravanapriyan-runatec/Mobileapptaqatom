import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DatePickerModal } from 'react-native-paper-dates';
import AuthService from '../../Services/AuthService';
import ProfileServices from '../../Services/API/ProfileServices';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';

export default function NewExpenseScreen({ onBack, onNavigate }) {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [category, setCategory] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const categories = [
        { label: t(tokens.expense.categories.businessTravel), value: 'Business Travel' },
        { label: t(tokens.expense.categories.accommodation), value: 'Accommodation' },
        { label: t(tokens.expense.categories.personalTravel), value: 'Personal Travel' },
        { label: t(tokens.expense.categories.meals), value: 'Meals' },
        { label: t(tokens.expense.categories.officeSupplies), value: 'Office Supplies' }
    ];

    const onConfirmDate = React.useCallback(
        (params) => {
            setShowDatePicker(false);
            if (params.date) {
                setDate(params.date);
            }
        },
        [setDate]
    );

    const formatDate = (dateObj) => {
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return dateObj.toLocaleDateString('en-GB', options); // e.g., 03 Feb 2026
    };

    const convertToDate = (dateObj) => {
        if (!dateObj) return '';
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const handleSubmit = async () => {
        if (!category || !amount || !reason) {
            Toast.show({
                type: 'error',
                text1: t(tokens.messages.requiredFields),
                text2: t(tokens.messages.fillAllDetails),
                position: 'bottom'
            });
            return;
        }

        try {
            setLoading(true);

            // 1. Get Employee ID
            const authUserId = await AuthService.getUserId();
            const userDetails = await ProfileServices.getUserDetailsData(authUserId);
            const username = userDetails?.username;
            const employee = await ProfileServices.getEmployeeDetailsData(username);
            const empID = employee?.id;

            if (!empID) {
                throw new Error('Could not retrieve employee details.');
            }

            // 2. Construct Payload (matching user-requested format)
            const payload = {
                employee_id: empID,
                Expense_Date: convertToDate(date),
                Expense_Category: category,
                Amount: amount,
                Description: reason,
            };

            // 3. Submit
            const response = await ProfileServices.submitExpenseData(payload);
            // console.log('DEBUG: Expense Submission Response:', response);

            Toast.show({
                type: 'success',
                text1: t(tokens.messages.success),
                text2: t(tokens.messages.expenseSubmitted),
                position: 'top'
            });

            setTimeout(() => {
                onNavigate('expense');
            }, 600);

        } catch (error) {
            console.error('Error submitting expense:', error);
            Toast.show({
                type: 'error',
                text1: t(tokens.messages.error),
                text2: t(tokens.messages.expenseSubmitFailed),
                position: 'bottom'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
            <LinearGradient
                colors={['#8EA3E3', '#FFFFFF']}
                locations={[0, 0.3]}
                style={styles.background}
            />
<View style={{minHeight:height}}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E1F24" />
                    <Text style={styles.headerTitle}>{t(tokens.expense.newExpense)}</Text>
                </TouchableOpacity>
            </View>

            {/* <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}> */}
<View style={styles.scrollContent}>
                {/* Expense Details Form Card */}
                <View style={[styles.card, (showDropdown || showDatePicker) && { zIndex: 10, elevation: 5 }]}>
                    <Text style={styles.cardTitle}>{t(tokens.expense.details)}</Text>

                    {/* Date Field */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t(tokens.common.date)}</Text>
                        <TouchableOpacity style={styles.inputBox} onPress={() => setShowDatePicker(true)}>
                            <Text style={styles.inputText}>{formatDate(date)}</Text>
                            <Ionicons name="calendar-outline" size={20} color="#999BA1" />
                        </TouchableOpacity>
                        <DatePickerModal
                            locale="en"
                            mode="single"
                            visible={showDatePicker}
                            onDismiss={() => setShowDatePicker(false)}
                            date={date}
                            onConfirm={onConfirmDate}
                        />
                    </View>

                    {/* Category Dropdown (Custom) */}
                    <View style={[styles.inputGroup, showDropdown && { zIndex: 1000, elevation: 6 }]}>
                        <Text style={styles.label}>{t(tokens.common.category)}</Text>
                        <TouchableOpacity
                            style={styles.inputBox}
                            onPress={() => setShowDropdown(!showDropdown)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.inputText, !category && { color: '#999BA1' }]}>
                                {category ? categories.find(c => c.value === category)?.label : t(tokens.common.select)}
                            </Text>
                            <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={20} color="#999BA1" />
                        </TouchableOpacity>

                        {showDropdown && (
                            <View style={styles.dropdownMenu}>
                                {categories.map((cat, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setCategory(cat.value);
                                            setShowDropdown(false);
                                        }}
                                    >
                                        <Text style={styles.dropdownItemText}>{cat.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Amount Field */}
                    <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                        <Text style={styles.label}>{t(tokens.common.amount)}</Text>
                        <View style={styles.inputBox}>
                            <TextInput
                                style={styles.textInput}
                                placeholder={t(tokens.common.enter)}
                                placeholderTextColor="#999BA1"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                    </View>
                </View>

                {/* Justification Form Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t(tokens.expense.justification)}</Text>

                    <View style={[styles.inputGroup, { marginBottom: 0 }]}>
                        <Text style={styles.label}>{t(tokens.common.reason)}</Text>
                        <View style={[styles.inputBox, styles.textAreaBox]}>
                            <TextInput
                                style={styles.textArea}
                                placeholder={t(tokens.common.enterHere)}
                                placeholderTextColor="#999BA1"
                                multiline
                                textAlignVertical="top"
                                value={reason}
                                onChangeText={setReason}
                            />
                        </View>
                    </View>
                </View>

                {/* Vertical space for dropdown expansion if needed */}
                {showDropdown && <View style={{ height: 150 }} />}
</View>
</View>
            </ScrollView>

            {/* Submit Button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.submitButton, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>{t(tokens.actions.submit)}</Text>
                    )}
                </TouchableOpacity>
            </View>

        </KeyboardAvoidingView>
    );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0, right: 0,
        height: height * 0.4,
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 20,
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
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100, // accommodate bottom button
        gap: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F2F5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E1F24',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
        position: 'relative',
        zIndex: 1, // Default low zIndex
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        color: '#62636C',
        marginBottom: 8,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
        backgroundColor: '#FFFFFF',
    },
    inputText: {
        fontSize: 14,
        color: '#1E1F24',
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: '#1E1F24',
        height: '100%',
    },
    dropdownMenu: {
        position: 'absolute',
        top: '100%', // Position exactly below the input box
        marginTop: 4,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingVertical: 8,
        zIndex: 1000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#1E1F24',
    },
    textAreaBox: {
        height: 120,
        alignItems: 'flex-start',
        paddingVertical: 12,
    },
    textArea: {
        flex: 1,
        width: '100%',
        fontSize: 14,
        color: '#1E1F24',
        height: '100%',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF', // To hide scrolling elements underneath
        paddingHorizontal: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderColor: '#F0F2F5',
    },
    submitButton: {
        backgroundColor: '#4169E1',
        height: 52,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
