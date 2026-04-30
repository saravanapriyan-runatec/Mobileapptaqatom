import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    Dimensions,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExpenseBottomSheet from '../components/ExpenseBottomSheet';
import AuthService from '../../Services/AuthService';
import ProfileServices from '../../Services/API/ProfileServices';
import { get } from 'lodash';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import StaggeredEntrance from '../components/common/StaggeredEntrance';
import EmptyState from '../components/common/EmptyState';

const EXPENSE_DATA = [
    {
        id: '1',
        title: 'Business Travel',
        date: '15 Jan 2026',
        fullDateTime: '15 Jan 2026, 04:30 PM',
        amount: '15,000',
        status: 'Pending',
        category: 'Business Travel',
        reason: 'Bought a laptop in Dubai exhibition'
    },
    {
        id: '2',
        title: 'Accommodation',
        date: '09 Jan 2026',
        fullDateTime: '09 Jan 2026, 11:33 AM',
        amount: '6,500',
        status: 'Approved',
        category: 'Accommodation',
        reason: 'Stayed in a hotel while went for business visit',
        approvalReason: 'Approved for personal time',
        approver: 'Sarah Ali',
        actionDate: '11 Jan 2026, 04:23 AM'
    },
    {
        id: '3',
        title: 'Personal Travel',
        date: '16 Dec 2025',
        fullDateTime: '16 Dec 2025, 03:15 PM',
        amount: '30,000',
        status: 'Rejected',
        category: 'Personal Travel',
        reason: 'For travel expense',
        rejectionReason: 'Insufficient justification',
        approver: 'Sarah Ali',
        actionDate: '11 Jan 2026, 04:23 AM'
    }
];

export default function ExpenseScreen({ onBack, onNavigate }) {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('All');
    const [selectedExpense, setSelectedExpense] = useState(null);

    // API States
    const [expenses, setExpenses] = useState([]);
    const [totals, setTotals] = useState({
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            // 1. Get Employee ID
            const authUserId = await AuthService.getUserId();
            const userDetails = await ProfileServices.getUserDetailsData(authUserId);
            const username = userDetails?.username;
            const employee = await ProfileServices.getEmployeeDetailsData(username);
            const empID = employee?.id;

            if (!empID) throw new Error('No Employee ID found');

            // 2. Fetch Totals and List in parallel
            const [listData, totalAll, totalPending, totalApproved, totalRejected] = await Promise.all([
                ProfileServices.getExpenseDetails(empID),
                ProfileServices.getTotalExpense(empID),
                ProfileServices.getTotalPendingExpense(empID),
                ProfileServices.getTotalApprovedExpense(empID),
                ProfileServices.getTotalRejectedExpense(empID)
            ]);

            // console.log('DEBUG: Expense List Response:', listData);
            // console.log('DEBUG: Expense Total All:', totalAll);
            // console.log('DEBUG: Expense Total Pending:', totalPending);
            // console.log('DEBUG: Expense Total Approved:', totalApproved);
            // console.log('DEBUG: Expense Total Rejected:', totalRejected);

            // 3. Map Totals
            setTotals({
                total: get(totalAll, 'total_expense_amount', 0),
                approved: get(totalApproved, 'approved_total_amount', 0),
                pending: get(totalPending, 'pending_total_amount', 0),
                rejected: get(totalRejected, 'rejected_total_amount', 0)
            });

            // 4. Map List Data
            // Note: User logs show listData is a direct array: [...]
            const mappedList = (Array.isArray(listData) ? listData : get(listData, 'results') || []).map(item => ({
                id: String(item.id),
                title: item.Expense_Category || 'Expense',
                date: item.Expense_Date ? new Date(item.Expense_Date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '--',
                fullDateTime: item.Expense_Date ? new Date(item.Expense_Date).toLocaleString() : '--',
                amount: String(item.Amount),
                status: item.Status || 'Pending',
                category: item.Expense_Category || '--',
                reason: item.Description || '',
                rejectionReason: item.reject_reason || '',
                approver: 'Manager',
                actionDate: ''
            }));

            setExpenses(mappedList);

        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const filteredData = activeTab === 'All'
        ? expenses
        : expenses.filter(item => item.status === activeTab);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return '#22C55E'; // Green
            case 'Pending': return '#F59E0B'; // Orange
            case 'Rejected': return '#EF4444'; // Red
            default: return '#999BA1';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'Approved': return t(tokens.actions.approved);
            case 'Pending': return t(tokens.actions.pending);
            case 'Rejected': return t(tokens.actions.rejected);
            default: return status;
        }
    };

    const getStatusBg = (status) => {
        switch (status) {
            case 'Approved': return '#DCFCE7'; // Light Green
            case 'Pending': return '#FEF3C7'; // Light Orange
            case 'Rejected': return '#FEE2E2'; // Light Red
            default: return '#F0F2F5';
        }
    };

    return (
        <View style={styles.container}>
            {/* Fixed Top Section */}
            <View style={{ zIndex: 1, backgroundColor: '#FFFFFF' }}>
                <LinearGradient
                    colors={['#8EA3E3', '#FFFFFF']}
                    locations={[0, 1]}
                    style={[styles.background, { height: '100%' }]}
                />
                
                <View style={{ paddingTop: insets.top + 12 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
                            <Text style={styles.headerTitle}>{t(tokens.nav.expense)}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ paddingHorizontal: 16 }}>
                        {/* Summary Card */}
                        <View style={[styles.summaryCardContainer]}>
                            <LinearGradient
                                colors={['#EDF1FF', '#E4EBFF']}
                                style={styles.summaryCardGradient}
                            >
                                <Text style={styles.summaryTitle}>{t(tokens.charts.totalExpense)}</Text>
                                <Text style={styles.summaryTotal}>SAR {Number(totals.total).toLocaleString()}</Text>

                                <View style={styles.summaryDivider} />

                                <View style={styles.summaryGrid}>
                                    <View style={styles.summaryCol}>
                                        <Text style={styles.summaryColLabel}>{t(tokens.actions.approved)}</Text>
                                        <Text style={styles.summaryColValue}>SAR {Number(totals.approved).toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.summaryColDivider} />
                                    <View style={styles.summaryCol}>
                                        <Text style={styles.summaryColLabel}>{t(tokens.actions.pending)}</Text>
                                        <Text style={styles.summaryColValue}>SAR {Number(totals.pending).toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.summaryColDivider} />
                                    <View style={styles.summaryCol}>
                                        <Text style={styles.summaryColLabel}>{t(tokens.actions.rejected)}</Text>
                                        <Text style={styles.summaryColValue}>SAR {Number(totals.rejected).toLocaleString()}</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>

                        {/* Filter Tabs */}
                        <View style={styles.tabsContainer}>
                            {['All', 'Pending', 'Approved', 'Rejected'].map(tab => (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.tab, activeTab === tab && styles.tabActive]}
                                    onPress={() => setActiveTab(tab)}
                                >
                                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                        {tab === 'All' ? t(tokens.common.all) : getStatusText(tab)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </View>

            {/* Scrollable Expense List */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor="#4169E1" />
                }
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
                <View style={[styles.listContainer, { paddingHorizontal: 16, paddingTop: 10 }]}>
                    {loading && !refreshing ? (
                        <View style={{ paddingVertical: 40 }}>
                            <ActivityIndicator size="large" color="#4169E1" />
                        </View>
                    ) : filteredData.length === 0 ? (
                        <EmptyState 
                            title={t(tokens.messages.noExpenses)}
                            description={t(tokens.messages.noExpensesDesc || 'You have not submitted any expense requests yet')}
                        />
                    ) : (
                        filteredData.map((item, index) => (
                            <StaggeredEntrance key={item.id} index={index}>
                                <TouchableOpacity
                                    style={styles.expenseCard}
                                    onPress={() => setSelectedExpense(item)}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusText(item.status)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardContentRow}>
                                        <View style={styles.cardInfoCol}>
                                            <Text style={styles.cardLabel}>{t(tokens.common.dateTime)}</Text>
                                            <Text style={styles.cardValue}>{item.date}</Text>
                                        </View>

                                        <View style={styles.cardVerticalDivider} />

                                        <View style={styles.cardInfoCol}>
                                            <Text style={styles.cardLabel}>{t(tokens.common.amount)}</Text>
                                            <Text style={styles.cardValue}>SAR {Number(item.amount).toLocaleString()}</Text>
                                        </View>

                                        <View style={styles.chevronContainer}>
                                            <Ionicons name="chevron-forward" size={20} color="#999BA1" />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </StaggeredEntrance>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Add Expense Button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => onNavigate('newExpense')}
                >
                    <Text style={styles.addButtonText}>{t(tokens.actions.addExpense)}</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Sheet Modal */}
            <ExpenseBottomSheet
                visible={!!selectedExpense}
                expenseData={selectedExpense}
                onClose={() => setSelectedExpense(null)}
            />
        </View>
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
    },
    summaryCardContainer: {
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 2,
        borderColor: 'white',
        overflow: 'hidden',
    },
    summaryCardGradient: {
        padding: 24,
    },
    summaryTitle: {
        fontSize: 13,
        color: '#62636C',
        textAlign: 'center',
        marginBottom: 6,
        fontWeight: '500',
    },
    summaryTotal: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E1F24',
        textAlign: 'center',
        marginBottom: 20,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#E2E8F0', // Very faint
        marginBottom: 20,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: -4, // align with padding visually
    },
    summaryCol: {
        flex: 1,
        alignItems: 'flex-start',
        paddingLeft: 4,
    },
    summaryColDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E2E8F0',
    },
    summaryColLabel: {
        fontSize: 11,
        color: '#62636C',
        marginBottom: 6,
        fontWeight: '500',
    },
    summaryColValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E1F24',
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    tabActive: {
        backgroundColor: '#4169E1',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999BA1',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    listContainer: {
        gap: 12,
    },
    expenseCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 0, // Padding handled individually for full corner badge
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F0F2F5',
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingLeft: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E1F24',
        marginTop: 16,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderBottomLeftRadius: 10,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardContentRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 12,
        alignItems: 'center',
    },
    cardInfoCol: {
        flex: 1,
    },
    cardVerticalDivider: {
        width: 1,
        height: '80%',
        backgroundColor: '#F0F2F5',
        marginHorizontal: 12,
    },
    cardLabel: {
        fontSize: 12,
        color: '#999BA1',
        marginBottom: 6,
        fontWeight: '500',
    },
    cardValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E1F24',
    },
    chevronContainer: {
        paddingLeft: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    addButton: {
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
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
