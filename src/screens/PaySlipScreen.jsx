import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    Dimensions,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthService from '../../Services/AuthService';
import ProfileServices from '../../Services/API/ProfileServices';
import { get } from 'lodash';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import { formatPayslipDate, formatPayslipRange, formatCurrency } from '../utils/formatDateTime';
import Toast from 'react-native-toast-message';
import SkeletonLoader from '../components/home/SkeletonLoader';
import * as Sharing from 'expo-sharing';

export default function PaySlipScreen({ onBack, onNavigate }) {
    const insets = useSafeAreaInsets();

    // State
    const [payslipData, setPayslipData] = useState([]);
    const [currentPayslip, setCurrentPayslip] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [employeeData, setEmployeeData] = useState(null);

    const { t } = useTranslation();

    useEffect(() => {
        fetchPayslipHistory();
    }, []);

    const fetchPayslipHistory = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const authUserId = await AuthService.getUserId();
            if (!authUserId) throw new Error('No Auth User ID');

            const userDetails = await ProfileServices.getUserDetailsData(authUserId);
            const username = userDetails?.username;
            if (!username) throw new Error('No Username found');

            const employee = await ProfileServices.getEmployeeDetailsData(username);
            const empID = employee?.id;
            if (!empID) throw new Error('No Employee ID found');
            setEmployeeData(employee);

            const res = await ProfileServices.getPayrollHistory(empID);
            const history = get(res, 'results', get(res, 'pay_run_details', []));
            // console.log("payslip responce", res);

            setPayslipData(history);
            if (history.length > 0) {
                setCurrentPayslip(history[0]);
                setCurrentIndex(0);
            }
        } catch (error) {
            console.error('Error fetching payslip history:', error);
            // Alert.alert("Error", "Failed to load payslip data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };


    const handleMonthChange = (direction) => {
        if (direction === 'prev' && currentIndex < payslipData.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setCurrentPayslip(payslipData[currentIndex + 1]);
        } else if (direction === 'next' && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setCurrentPayslip(payslipData[currentIndex - 1]);
        }
    };

    const handleNavigateDetail = (monthData) => {
        if (!monthData && !currentPayslip) return;
        onNavigate('payslipDetail', {
            monthData: monthData || currentPayslip
        });
    };

    const handleDownload = async () => {
        if (!currentPayslip || !employeeData) return;

        try {
            setDownloading(true);
            const payrunId = currentPayslip.payrun_id || currentPayslip.payrunId;
            const startDate = currentPayslip.start_date || currentPayslip.pay_date_range?.split(' to ')[0];
            const formattedDate = formatPayslipDate(startDate);
            const filename = `Payslip_${formattedDate}.pdf`;

            const result = await ProfileServices.downloadPaySlip(payrunId, employeeData.id, filename);
            
            if (result && result.success) {
                // Automatically trigger sharing dialog to allow user to save to a public location
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(result.path, {
                        mimeType: 'application/pdf',
                        dialogTitle: 'Save or Share Payslip',
                        UTI: 'com.adobe.pdf'
                    });
                }

                Toast.show({
                    type: 'success',
                    text1: 'Download Successful',
                    text2: `Saved as ${filename}`,
                });
            }
        } catch (error) {
            console.error("Download failed:", error);
            Toast.show({
                type: 'error',
                text1: 'Download Failed',
                text2: 'Could not download the payslip. Please try again.',
            });
        } finally {
            setDownloading(false);
        }
    };

    return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#8EA3E3', '#FFFFFF']}
        locations={[0, 0.3]}
        style={styles.background}
      />

      <View style={{ paddingTop: insets.top + 12 }}>
        {/* Fixed Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
            <Text style={styles.headerTitle}>{t(tokens.nav.paySlip)}</Text>
          </TouchableOpacity>
        </View>

        {loading ? null : currentPayslip ? (
          <View>
            {/* Fixed Month Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity
                onPress={() => handleMonthChange('prev')}
                style={styles.monthNavIcon}
                disabled={currentIndex >= payslipData.length - 1}
              >
                <Ionicons name="chevron-back" size={20} color={currentIndex >= payslipData.length - 1 ? "#D1D5DB" : "#1E1F24"} />
              </TouchableOpacity>
              <Text style={styles.monthText}>{currentPayslip?.month || currentPayslip?.payrun_title || t(tokens.common.na)}</Text>
              <TouchableOpacity
                onPress={() => handleMonthChange('next')}
                style={styles.monthNavIcon}
                disabled={currentIndex <= 0}
              >
                <Ionicons name="chevron-forward" size={20} color={currentIndex <= 0 ? "#D1D5DB" : "#1E1F24"} />
              </TouchableOpacity>
            </View>

            {/* Fixed Summary Content */}
            <View style={styles.mainContentFixed}>
                {/* Net Pay Summary Card */}
                <View style={[styles.card, styles.summaryCardContainer]}>
                  <LinearGradient
                    colors={['#F0F4FF', '#E4EBFF']}
                    style={styles.summaryGradient}
                  >
                    <View style={styles.summaryGrid}>
                      <View style={styles.summaryColLarge}>
                        <Text style={styles.label}>{t(tokens.charts.netPay)}</Text>
                        <Text style={styles.valueLarge}>SAR {formatCurrency(currentPayslip?.net_pay)}</Text>
                        <Text style={styles.subtext}>{t(tokens.payslip.creditedOn)} {formatPayslipDate(currentPayslip?.credit_date || currentPayslip?.end_date)}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.summaryCol}>
                        <Text style={styles.label}>{t(tokens.payslip.gross)}</Text>
                        <Text style={[styles.valueMedium, styles.fadedValue]}>SAR {formatCurrency(currentPayslip?.gross_pay)}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.summaryCol}>
                        <Text style={styles.label}>{t(tokens.charts.deductions)}</Text>
                        <Text style={[styles.valueMedium, styles.fadedValue]}>SAR {formatCurrency(currentPayslip?.deductions)}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.downloadButton, downloading && { opacity: 0.7 }]}
                      onPress={handleDownload}
                      disabled={downloading}
                    >
                      {downloading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                      )}
                      <Text style={styles.downloadButtonText}>
                        {downloading ? t(tokens.payslip.downloading) : t(tokens.actions.downloadPayslip)}
                      </Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>

                {/* Salary Distribution Card */}
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{t(tokens.charts.salaryDistribution)}</Text>

                  <View style={styles.progressBarContainer}>
                    {(() => {
                      const grossNum = parseFloat(currentPayslip?.gross_pay) || 1;
                      const earningsNum = parseFloat(currentPayslip?.total_earning) || parseFloat(currentPayslip?.gross_pay) || 0;
                      const deductionNum = parseFloat(currentPayslip?.deductions) || 0;
                      const total = earningsNum + deductionNum || 1; // avoid div by 0

                      const earningPct = Math.round((earningsNum / total) * 100);
                      const deductionPct = Math.round((deductionNum / total) * 100);

                      return (
                        <>
                          <View style={[styles.progressSegment, { backgroundColor: '#4169E1', flex: earningPct }]} />
                          <View style={[styles.progressSegment, { backgroundColor: '#FF4B4B', flex: deductionPct }]} />
                        </>
                      );
                    })()}
                  </View>

                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#4169E1' }]} />
                      <Text style={styles.legendText}>{t(tokens.charts.earnings)} <Text style={styles.legendValue}>
                        {Math.round(((parseFloat(currentPayslip?.total_earning) || parseFloat(currentPayslip?.gross_pay) || 0) / ((parseFloat(currentPayslip?.total_earning) || parseFloat(currentPayslip?.gross_pay) || 0) + (parseFloat(currentPayslip?.deductions) || 0) || 1)) * 100)}%
                      </Text></Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#FF4B4B' }]} />
                      <Text style={styles.legendText}>{t(tokens.charts.deductions)} <Text style={styles.legendValue}>
                        {Math.round(((parseFloat(currentPayslip?.deductions) || 0) / ((parseFloat(currentPayslip?.total_earning) || parseFloat(currentPayslip?.gross_pay) || 0) + (parseFloat(currentPayslip?.deductions) || 0) || 1)) * 100)}%
                      </Text></Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => handleNavigateDetail()}>
                    <Text style={styles.linkText}>{t(tokens.payslip.viewDetailedBreakdown)} <Ionicons name="chevron-forward" size={12} /></Text>
                  </TouchableOpacity>
                </View>

                {/* Recent Payslips Title */}
                <Text style={styles.sectionTitle}>{t(tokens.payslip.recentPayslips)}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {loading && !refreshing ? (
        <View style={styles.mainContentFixed}>
          {/* Month Nav Skeleton */}
          <View style={[styles.monthNav, { marginBottom: 20 }]}>
            <SkeletonLoader width={20} height={20} borderRadius={10} />
            <SkeletonLoader width={120} height={20} borderRadius={4} />
            <SkeletonLoader width={20} height={20} borderRadius={10} />
          </View>

          {/* Summary Card Skeleton */}
          <View style={[styles.card, { height: 180, padding: 16 }]}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryColLarge}>
                <SkeletonLoader width={60} height={12} borderRadius={2} style={{ marginBottom: 8 }} />
                <SkeletonLoader width={140} height={24} borderRadius={4} style={{ marginBottom: 12 }} />
                <SkeletonLoader width={100} height={10} borderRadius={2} />
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryCol}>
                <SkeletonLoader width={40} height={10} borderRadius={2} style={{ marginBottom: 6 }} />
                <SkeletonLoader width={80} height={12} borderRadius={4} />
              </View>
            </View>
            <SkeletonLoader width={Dimensions.get('window').width - 32} height={48} borderRadius={8} style={{ marginTop: 10 }} />
          </View>

          {/* Distribution Skeleton */}
          <View style={[styles.card, { height: 140, padding: 16 }]}>
            <SkeletonLoader width={120} height={14} borderRadius={4} style={{ marginBottom: 20 }} />
            <SkeletonLoader width={"100%"} height={8} borderRadius={4} style={{ marginBottom: 16 }} />
            <View style={styles.legendRow}>
              <SkeletonLoader width={80} height={12} borderRadius={4} />
              <SkeletonLoader width={80} height={12} borderRadius={4} />
            </View>
          </View>

          {/* List Skeleton */}
          <SkeletonLoader width={150} height={20} borderRadius={4} style={{ marginBottom: 16, marginTop: 8 }} />
          {Array.from({ length: 2 }).map((_, i) => (
            <View key={i} style={[styles.payslipCard, { height: 120 }]}>
              <View style={styles.payslipHeader}>
                <View style={styles.payslipHeaderLeft}>
                  <SkeletonLoader width={24} height={24} borderRadius={12} style={{ marginRight: 12 }} />
                  <View>
                    <SkeletonLoader width={80} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                    <SkeletonLoader width={120} height={12} borderRadius={2} />
                  </View>
                </View>
              </View>
              <View style={styles.payslipFooter}>
                <SkeletonLoader width={60} height={20} borderRadius={4} />
                <SkeletonLoader width={100} height={20} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      ) : currentPayslip ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchPayslipHistory(true)} tintColor="#4169E1" />
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
          <View style={styles.mainContent}>
            <View style={styles.listScrollContent}>
              {payslipData.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.payslipCard}
                  onPress={() => handleNavigateDetail(item)}
                >
                  <View style={styles.payslipHeader}>
                    <View style={styles.payslipHeaderLeft}>
                      <Ionicons name="document-text-outline" size={24} color="#62636C" style={styles.docIcon} />
                      <View>
                        <Text style={styles.payslipMonth}>{item.month || item.payrun_title}</Text>
                        <Text style={styles.payslipDateRange}>{formatPayslipRange(item.pay_date_range, item.start_date, item.end_date)}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#B9BBC6" />
                  </View>

                  <View style={styles.payslipFooter}>
                    <View>
                      <Text style={styles.label}>{t(tokens.messages.paidFor)}</Text>
                      <Text style={styles.payslipValue}>{item.payrunDays || item.days_paid || item.paid_days || 0} {t(tokens.common.days)}</Text>
                    </View>
                    <View style={styles.payslipFooterRight}>
                      <Text style={styles.label}>{t(tokens.charts.netPay)}</Text>
                      <Text style={styles.payslipValue}>SAR {formatCurrency(item.net_pay)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="document-outline" size={48} color="#D1D5DB" />
          <Text style={{ marginTop: 12, color: '#62636C', fontSize: 16 }}>{t(tokens.messages.noPayrolls)}</Text>
        </View>
      )}
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
        left: 0,
        right: 0,
        top: 0,
        height: height,
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
        fontSize: 18,
        fontWeight: '700',
        color: '#1E1F24',
    },
    mainContent: {
        flex: 1,
        paddingHorizontal: 16,
    },
    mainContentFixed: {
        paddingHorizontal: 16,
    },
    listScrollContent: {
        paddingBottom: 40,
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        gap: 20,
    },
    monthNavIcon: {
        padding: 8,
    },
    monthText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E1F24',
        minWidth: 120,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F0F2F5',
    },
    summaryCardContainer: {
        padding: 0,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'white',
        
    },
    summaryGradient: {
        padding: 16,
        borderRadius: 12, // match outer card
    },
    summaryGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    summaryColLarge: {
        flex: 2,
    },
    summaryCol: {
        flex: 1.5,
        paddingLeft: 12,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: '#dbe6f5ff',
    },
    label: {
        fontSize: 12,
        color: '#62636C',
        marginBottom: 0,
        fontWeight: '500',
    },
    valueLarge: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E1F24',
        marginBottom: 8,
        lineHeight: 24,
    },
    subtext: {
        fontSize: 11,
        color: '#999BA1',
        lineHeight: 16,
    },
    valueMedium: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1E1F24',
        marginTop: 0,
        lineHeight: 20,
    },
    fadedValue: {
        fontWeight: '600',
    },
    downloadButton: {
        backgroundColor: '#4169E1',
        height: 48,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E1F24',
        marginBottom: 16,
    },
    progressBarContainer: {
        height: 8,
        flexDirection: 'row',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressSegment: {
        height: '100%',
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        marginBottom: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 12,
        color: '#62636C',
    },
    legendValue: {
        fontWeight: '700',
        color: '#1E1F24',
    },
    linkText: {
        fontSize: 13,
        color: '#4169E1',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E1F24',
        marginTop: 8,
        marginBottom: 16,
    },
    payslipCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F2F5',
    },
    payslipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    payslipHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    docIcon: {
        marginRight: 12,
    },
    payslipMonth: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E1F24',
        marginBottom: 2,
    },
    payslipDateRange: {
        fontSize: 12,
        color: '#999BA1',
    },
    payslipFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F0F2F5',
        paddingTop: 12,
    },
    payslipValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E1F24',
    },
    payslipFooterRight: {
        alignItems: 'flex-start',
        flex: 0.5,
    },
     downloadButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
