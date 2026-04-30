import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    Modal,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LoanServices from '../../Services/API/LoanServices';
import AuthService from '../../Services/AuthService';
import ProfileServices from '../../Services/API/ProfileServices';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import SkeletonLoader from '../components/home/SkeletonLoader';
import SwipeableBottomSheet from '../components/common/SwipeableBottomSheet';

const { width, height } = Dimensions.get('window');

const SummaryCard = ({ label, value, icon, iconColor, bgColor, subText }) => (
    <View style={styles.summaryCard}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryLabel} numberOfLines={1}>{label}</Text>
            <View style={styles.summaryValueContainer}>
                <Text style={styles.summaryValue}>{value}</Text>
                {subText && <Text style={styles.summarySubText}>{subText}</Text>}
            </View>
        </View>
    </View>
);

const LoanDetailsModal = ({ visible, onClose, loan }) => {
    const { t } = useTranslation();

    if (!loan && !visible) return null;

    const isRequested = loan?.status === t(tokens.actions.requested);
    const isApproved = loan?.status === t(tokens.actions.approved) || loan?.status === t(tokens.actions.running);
    const isInProgress = loan?.status === t(tokens.actions.inProgress);
    const isRunning = isApproved || isInProgress;
    const isCleared = loan?.status === t(tokens.actions.cleared);

    const renderSection = (title, children) => (
        <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>{title}</Text>
            {children}
        </View>
    );

    const renderDetailRow = (label, value, isAmount = false) => (
        <View style={styles.modalDetailRow}>
            <Text style={styles.modalDetailLabel}>{label}</Text>
            <Text style={[styles.modalDetailValue, isAmount && { color: '#1E1F24', fontSize: 14, fontWeight: '700' }]}>
                {isAmount ? `SAR ${value}` : value}
            </Text>
        </View>
    );

    return (
        <SwipeableBottomSheet visible={visible} onClose={onClose} contentStyle={styles.modalContent}>
            <View style={styles.modalHandle} />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.modalScroll}
                style={{ flexShrink: 1 }}
            >
                {loan && (
                    <>
                        <View style={styles.modalHeader}>
                            <View style={[styles.loanIconBox, { backgroundColor: loan.iconBg }]}>
                                <Ionicons name={loan.icon} size={24} color="#FFFFFF" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.modalTitle}>{loan.title || t(tokens.loans.loanDetails)}</Text>
                                <View style={[styles.statusBadge, {
                                    backgroundColor: isRequested ? '#FFF8EB' : isApproved ? '#E6F9EE' : isInProgress ? '#F0FDFA' : '#F0F2F5',
                                    borderRadius: 16,
                                    paddingHorizontal: 12,
                                    paddingVertical: 4,
                                }]}>
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '600',
                                        color: isRequested ? '#F39C12' : isApproved ? '#10B981' : isInProgress ? '#0D9488' : '#62636C'
                                    }}>{isRequested ? t(tokens.actions.requested) : isApproved ? t(tokens.actions.approved) : isInProgress ? t(tokens.actions.inProgress) : isCleared ? t(tokens.actions.cleared) : loan.status}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.modalBody}>
                            {renderSection(t(tokens.loans.loanDetails), (
                                <View style={styles.modalSectionContent}>
                                    {renderDetailRow(t(tokens.loans.amount), loan.amount, true)}
                                    {renderDetailRow(t(tokens.loans.loanStartDate), loan.startDate || "-")}
                                    {renderDetailRow(t(tokens.loans.loanEndDate), loan.endDate || "-")}
                                    {renderDetailRow(t(tokens.loans.loanTenure), loan.tenure || "-")}
                                    {renderDetailRow(t(tokens.loans.paid), loan.paid || "0 / 0")}
                                    <View style={{ marginTop: 12 }}>
                                        <Text style={styles.modalDetailLabel}>{t(tokens.common.description)}</Text>
                                        <Text style={styles.modalDescription}>"{loan.description || t(tokens.messages.noDescription)}"</Text>
                                    </View>
                                </View>
                            ))}

                            {isRequested && renderSection(t(tokens.dashboard.approvalWorkflow), (
                                <View style={styles.workflowContainer}>
                                    <View style={styles.workflowStep}>
                                        <View style={styles.workflowIconContainer}>
                                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                            <View style={styles.workflowLine} />
                                        </View>
                                        <View style={styles.workflowTextContainer}>
                                            <Text style={styles.workflowStepTitle}>{t(tokens.expense.requestSubmitted)}</Text>
                                            <Text style={styles.workflowStepDate}>{loan.startDate || '16 Jan 2026, 09:30AM'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.workflowStep}>
                                        <View style={styles.workflowIconContainer}>
                                            <Ionicons name="time" size={20} color="#F39C12" />
                                        </View>
                                        <View style={styles.workflowTextContainer}>
                                            <Text style={styles.workflowStepTitle}>{t(tokens.expense.managerApproval)}</Text>
                                            <Text style={styles.workflowStepDate}>{t(tokens.expense.lineManager)}: Sarah Ali</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}

                            {(isRunning || isCleared) && renderSection(t(tokens.loans.emiDetails), (
                                <View style={styles.emiContainer}>
                                    {isRunning && renderDetailRow(t(tokens.loans.outstandingAmount), loan.outstanding, true)}
                                    <View style={styles.emiList}>
                                        <View style={styles.emiItem}>
                                            <View>
                                                <Text style={styles.emiAmount}>{loan.emi}</Text>
                                                <Text style={styles.emiDate}>{loan.nextEmiDate}</Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: '#F0F2F3' }]}>
                                                <Text style={[styles.statusText, { color: '#62636C' }]}>
                                                    {t(tokens.loans.nextInstallment)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>

            <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>{t(tokens.common.close)}</Text>
                </TouchableOpacity>
            </View>
        </SwipeableBottomSheet>
    );
};

const LoanItemCard = ({
    item,
    onPress,
    t
}) => {
    const isRequested = item.status === t(tokens.actions.requested);
    const isApproved = item.status === t(tokens.actions.approved) || item.status === t(tokens.actions.running);
    const isInProgress = item.status === t(tokens.actions.inProgress);
    const isRunning = isApproved || isInProgress;
    const isCleared = item.status === t(tokens.actions.cleared);

    let statusBg = '#F0F2F5';
    let statusText = '#62636C';
    if (isRequested) { statusBg = '#FFF8EB'; statusText = '#F39C12'; }
    if (isApproved) { statusBg = '#E6F9EE'; statusText = '#10B981'; }
    if (isInProgress) { statusBg = '#F0FDFA'; statusText = '#0D9488'; }
    if (isCleared) { statusBg = '#F0F2F5'; statusText = '#62636C'; }

    return (
        <TouchableOpacity style={styles.loanCard} onPress={() => onPress(item)}>
            <View style={styles.loanCardHeader}>
                <View style={styles.loanTitleRow}>
                    <View style={[styles.loanIconBox, { backgroundColor: '#FDE68A' }]}>
                        <Ionicons name="grid-outline" size={20} color="#F59E0B" />
                    </View>
                    <View>
                        <Text style={styles.loanTitle}>{item.title}</Text>
                        <Text style={styles.loanSubtitle}>{t(tokens.loans.amount)}: {item.amount}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusText, { color: statusText }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.loanDetailsGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t(tokens.loans.outstandingAmount)}</Text>
                    <Text style={[styles.detailValue, isRunning && { color: '#EF4444' }]}>{item.outstanding}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t(tokens.loans.paid)}</Text>
                    <Text style={styles.detailValue}>{item.paid}</Text>
                </View>
            </View>

            <View style={styles.loanDetailsGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t(tokens.loans.nextEmiDate)}</Text>
                    <Text style={styles.detailValue}>{item.nextEmiDate}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t(tokens.common.emi)}</Text>
                    <Text style={styles.detailValue}>{item.emi}{item.emi !== '-' ? ` / ${t(tokens.messages.perMonth)}` : ''}</Text>
                </View>
            </View>

            <View style={styles.chevron}>
                <Ionicons name="chevron-forward" size={20} color="#B9BBC6" />
            </View>
        </TouchableOpacity>
    );
};

export default function LoanScreen({ onBack, onApplyLoan }) {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(t(tokens.common.all));
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loanData, setLoanData] = useState([]);
    const [summaryStats, setSummaryStats] = useState({
        outstanding: '0.00',
        totalPaid: '0.00',
        totalEmi: '0.00',
        totalLoanAmount: '0.00'
    });

    const tabs = [t(tokens.common.all), t(tokens.actions.requested), t(tokens.actions.running), t(tokens.actions.cleared)];

    const fetchLoanData = useCallback(async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            // 1. Get Auth User ID -> Username -> Emp ID (Robust Pattern)
            const authUserId = await AuthService.getUserId();
            console.log('DEBUG: LoanScreen AuthUserId:', authUserId);

            const userDetails = await ProfileServices.getUserDetailsData(authUserId);
            console.log('DEBUG: LoanScreen UserDetails:', JSON.stringify(userDetails, null, 2));

            const username = userDetails?.username;
            console.log('DEBUG: LoanScreen Username:', username);

            const employee = await ProfileServices.getEmployeeDetailsData(username);
            console.log('DEBUG: LoanScreen EmployeeDetails:', JSON.stringify(employee, null, 2));

            const empId = employee?.id;
            console.log('DEBUG: LoanScreen Resolved empId:', empId);

            if (!empId) {
                console.error("DEBUG: LoanScreen - No employee ID found at final step");
                setLoading(false);
                setRefreshing(false);
                return;
            }

            // Fetch summary stats and list data
            // Summary stats are always fetched, but list data depends on the active tab
            let listPromise;
            if (activeTab === t(tokens.common.all)) {
                listPromise = LoanServices.getAllLoan(empId);
            } else if (activeTab === t(tokens.actions.requested)) {
                listPromise = LoanServices.getRequestedLoan(empId);
            } else if (activeTab === t(tokens.actions.running)) {
                listPromise = LoanServices.getRunningLoan(empId);
            } else if (activeTab === t(tokens.actions.cleared)) {
                listPromise = LoanServices.getClearedLoan(empId);
            }

            const [outstanding, totalEmiPaid, totalEmiBalance, totalLoanAmount, listResponse] = await Promise.all([
                LoanServices.getOutstandinBalance(empId).catch(() => ({ total_outstanding_principal: 0 })),
                LoanServices.getTotalEmiPaid(empId).catch(() => ({ total_emi_paid: 0 })),
                LoanServices.getTotalEmiBalance(empId).catch(() => ({ total_emi_amount: 0 })),
                LoanServices.getTotalLoanAmount(empId).catch(() => ({ total_loan_amount: 0 })),
                listPromise.catch(() => [])
            ]);

            console.log(`DEBUG: LoanScreen - Active Tab: ${activeTab}`);
            console.log(`DEBUG: LoanScreen - Outstanding Balance Response:`, JSON.stringify(outstanding, null, 2));
            console.log(`DEBUG: LoanScreen - Total EMI Paid Response:`, JSON.stringify(totalEmiPaid, null, 2));
            console.log(`DEBUG: LoanScreen - Total EMI Balance Response:`, JSON.stringify(totalEmiBalance, null, 2));
            console.log(`DEBUG: LoanScreen - Total Loan Amount Response:`, JSON.stringify(totalLoanAmount, null, 2));
            console.log(`DEBUG: LoanScreen - List (${activeTab}) Response:`, JSON.stringify(listResponse, null, 2));

            setSummaryStats({
                outstanding: outstanding?.total_outstanding_principal || '0.00',
                totalPaid: totalEmiPaid?.total_emi_paid || '0.00',
                totalEmi: totalEmiBalance?.total_emi_amount || '0.00',
                totalLoanAmount: totalLoanAmount?.total_loan_amount || '0.00'
            });

            // Map API data to UI format
            const rawResults = listResponse?.results || listResponse?.data?.results || [];
            const rawLoans = activeTab === 'All' ? rawResults : (Array.isArray(listResponse) ? listResponse : (Array.isArray(listResponse?.data) ? listResponse.data : rawResults));

            const mappedLoans = rawLoans.map(item => {
                const statusMap = {
                    'pending': t(tokens.actions.requested) || 'Requested',
                    'approved': t(tokens.actions.approved) || 'Approved',
                    'in-progress': t(tokens.actions.inProgress) || 'In Progress',
                    'rejected': t(tokens.actions.rejected) || 'Rejected',
                    'cleared': t(tokens.actions.cleared) || 'Cleared',
                    '1': t(tokens.actions.requested) || 'Requested',
                    '2': t(tokens.actions.approved) || 'Approved',
                    '3': t(tokens.actions.cleared) || 'Cleared',
                    '4': t(tokens.actions.rejected) || 'Rejected'
                };

                const currentStatus = statusMap[item.status?.toLowerCase()] || item.status || 'Requested';

                return {
                    id: item.id,
                    title: item.loan_category || item.loan_type_name || "Loan Request",
                    amount: `SAR ${(item.loan_amount || item.amount || 0).toLocaleString()}`,
                    status: currentStatus,
                    outstanding: item.outstanding_amount ? `SAR ${Number(item.outstanding_amount).toLocaleString()}` : (item.loan_amount ? `SAR ${Number(item.loan_amount).toLocaleString()}` : '-'),
                    paid: `${item.emicompletedterms_inmonth || item.paid_emi_count || 0} / ${item.repaymentterms_inmonth || item.tenure || 0}`,
                    nextEmiDate: item.emideducts_from || item.next_emi_date || "-",
                    emi: item.emi_amount ? `SAR ${Number(item.emi_amount).toLocaleString()}` : "-",
                    icon: (item.loan_category || "").toLowerCase().includes('home') ? 'home' :
                        (item.loan_category || "").toLowerCase().includes('car') ? 'car' :
                            (item.loan_category || "").toLowerCase().includes('bike') ? 'car' : 'grid',
                    iconBg: (item.loan_category || "").toLowerCase().includes('home') ? '#A3CB38' :
                        (item.loan_category || "").toLowerCase().includes('car') ? '#95A5A6' :
                            (item.loan_category || "").toLowerCase().includes('bike') ? '#3498DB' : '#FAD390',
                    startDate: item.loanrelease_date || item.predictable_month || item.start_date || "-",
                    endDate: item.terms_month || item.end_date || "-",
                    tenure: (item.repaymentterms_inmonth || item.tenure) ? `${item.repaymentterms_inmonth || item.tenure} ${t(tokens.common.months)}` : "-",
                    description: item.notes || item.reason || item.description || t(tokens.messages.noDescription)
                };
            });

            setLoanData(mappedLoans);
        } catch (error) {
            console.error("Error fetching loan data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchLoanData();
    }, [fetchLoanData]);

    const handlePressLoan = (loan) => {
        setSelectedLoan(loan);
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#8EA3E3', '#FFFFFF', '#F8F9FF']}
                locations={[0, 0.3, 1]}
                style={StyleSheet.absoluteFill}
            />

            <View style={{ paddingTop: insets.top + 12 }}>
                {/* Fixed Header */}
                <View style={[styles.header]}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1E1F24" />
                        <Text style={styles.headerTitle}>{t(tokens.nav.loan)}</Text>
                    </TouchableOpacity>
                </View>

                {/* Fixed Summary Grid (Now at Top) */}
                <View style={[styles.summaryGrid, { paddingHorizontal: 16, marginBottom: 12 }]}>
                    {loading && !refreshing ? (
                        Array.from({ length: 4 }).map((_, idx) => (
                            <View key={idx} style={styles.summaryCard}>
                                <SkeletonLoader width={36} height={36} borderRadius={18} />
                                <View style={styles.summaryTextContainer}>
                                    <View style={{ marginBottom: 4 }}><SkeletonLoader width={60} height={10} borderRadius={2} /></View>
                                    <SkeletonLoader width={80} height={14} borderRadius={2} />
                                </View>
                            </View>
                        ))
                    ) : (
                        <>
                            <SummaryCard
                                label={t(tokens.charts.outstandingPrincipleBalance)}
                                value={`SAR ${summaryStats.outstanding}`}
                                icon="wallet"
                                iconColor="#FFFFFF"
                                bgColor="#EF4444"
                            />
                            <SummaryCard
                                label={t(tokens.charts.totalEMIPaid)}
                                value={`SAR ${summaryStats.totalPaid}`}
                                icon="layers"
                                iconColor="#FFFFFF"
                                bgColor="#10B981"
                            />
                            <SummaryCard
                                label={t(tokens.charts.totalEMI)}
                                value={`SAR ${summaryStats.totalEmi}`}
                                subText={t(tokens.messages.perMonth)}
                                icon="calendar"
                                iconColor="#FFFFFF"
                                bgColor="#4169E1"
                            />
                            <SummaryCard
                                label={t(tokens.charts.totalLoanAmount)}
                                value={`SAR ${summaryStats.totalLoanAmount}`}
                                icon="business"
                                iconColor="#FFFFFF"
                                bgColor="#F39C12"
                            />
                        </>
                    )}
                </View>

                {/* Fixed Tabs wrapper (Now Below Summary) */}
                <View style={[styles.tabsWrapper, { paddingHorizontal: 16 }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabsContainer}
                    >
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                onPress={() => setActiveTab(tab)}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={[styles.scrollContent, { paddingTop: 0 }]}>
                    <View style={styles.listContainer}>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <View key={index} style={[styles.loanCard, { height: 160 }]}>
                                <View style={styles.loanCardHeader}>
                                    <View style={styles.loanTitleRow}>
                                        <SkeletonLoader width={44} height={44} borderRadius={12} />
                                        <View>
                                            <SkeletonLoader width={120} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                                            <SkeletonLoader width={80} height={12} borderRadius={4} />
                                        </View>
                                    </View>
                                    <SkeletonLoader width={70} height={20} borderRadius={6} />
                                </View>
                                <View style={styles.loanDetailsGrid}>
                                    <View style={styles.detailItem}>
                                        <SkeletonLoader width={60} height={10} borderRadius={2} style={{ marginBottom: 6 }} />
                                        <SkeletonLoader width={100} height={14} borderRadius={4} />
                                    </View>
                                    <View style={styles.detailItem}>
                                        <SkeletonLoader width={60} height={10} borderRadius={2} style={{ marginBottom: 6 }} />
                                        <SkeletonLoader width={100} height={14} borderRadius={4} />
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => fetchLoanData(true)} tintColor="#4169E1" />
                    }
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
                >
                    <View style={styles.listContainer}>
                        {loanData.length > 0 ? (
                            loanData.map((item, index) => (
                                <LoanItemCard
                                    key={`${item.id}-${index}`}
                                    item={item}
                                    onPress={() => handlePressLoan(item)}
                                    t={t}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="document-text-outline" size={48} color="#B9BBC6" />
                                <Text style={styles.emptyText}>{t(tokens.messages.noLoanData)}</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity style={styles.applyButton} onPress={onApplyLoan}>
                    <Text style={styles.applyButtonText}>{t(tokens.loans.applyLoan)}</Text>
                </TouchableOpacity>
            </View>

            <LoanDetailsModal
                visible={modalVisible}
                loan={selectedLoan}
                onClose={() => setModalVisible(false)}
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
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E1F24',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 120,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    summaryCard: {
        width: (width - 32 - 12) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#F0F2F5',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryTextContainer: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 10,
        color: '#62636C',
        marginBottom: 2,
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E1F24',
        flexShrink: 1,
    },
    summaryValueContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    summarySubText: {
        fontSize: 10,
        color: '#62636C',
        fontWeight: '400',
    },
    tabsWrapper: {
        marginBottom: 20,
        paddingVertical: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 4,
        minWidth: 80,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#4169E1',
    },
    tabText: {
        fontSize: 13,
        color: '#62636C',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    listContainer: {
        gap: 16,
    },
    loanCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EFF0F3',
        position: "relative",
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.03,
                shadowRadius: 8,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    loanCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    loanTitleRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    loanIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loanTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E1F24',
    },
    loanSubtitle: {
        fontSize: 13,
        color: '#62636C',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    loanDetailsGrid: {
        flexDirection: 'row',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: '#62636C',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E1F24',
    },
    chevron: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: 10,
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
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        ...Platform.select({
            ios: {
                shadowColor: '#4169E1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    applyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: height * 0.85,
        padding: 0,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    modalScroll: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 32,
        flexGrow: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E1F24',
    },
    modalBody: {
        paddingBottom: 24,
    },
    modalSection: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EFF0F3',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    modalSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E1F24',
        marginBottom: 16,
    },
    modalSectionContent: {
        gap: 12,
    },
    modalDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalDetailLabel: {
        fontSize: 13,
        color: '#62636C',
    },
    modalDetailValue: {
        fontSize: 13,
        color: '#1E1F24',
        fontWeight: '500',
    },
    modalDescription: {
        fontSize: 13,
        color: '#1E1F24',
        fontStyle: 'italic',
        marginTop: 4,
    },
    workflowContainer: {
        paddingLeft: 8,
        paddingBottom: 4,
    },
    workflowStep: {
        flexDirection: 'row',
        gap: 12,
    },
    workflowIconContainer: {
        width: 24,
        alignItems: 'center',
    },
    workflowLine: {
        width: 2,
        height: 24,
        backgroundColor: '#F0F2F5',
        marginVertical: 4,
    },
    workflowTextContainer: {
        flex: 1,
        paddingBottom: 20,
    },
    workflowStepTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E1F24',
    },
    workflowStepDate: {
        fontSize: 12,
        color: '#62636C',
        marginTop: 2,
    },
    emiList: {
        marginTop: 12,
        gap: 12,
    },
    emiItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
    },
    emiAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E1F24',
    },
    emiDate: {
        fontSize: 12,
        color: '#62636C',
        marginTop: 2,
    },
    modalFooter: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    closeButton: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EFF0F3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#62636C',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
        color: '#B9BBC6',
        fontWeight: '500',
    },
});
