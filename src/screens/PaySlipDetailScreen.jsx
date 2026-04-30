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
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthService from '../../Services/AuthService';
import ProfileServices from '../../Services/API/ProfileServices';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import { formatPayslipDate, formatPayslipRange, formatCurrency } from '../utils/formatDateTime';
import Toast from 'react-native-toast-message';
import * as Sharing from 'expo-sharing';

export default function PaySlipDetailScreen({ onBack, routeParams }) {
    const insets = useSafeAreaInsets();
    const [downloading, setDownloading] = useState(false);
    const [employeeData, setEmployeeData] = useState(null);
    const { t } = useTranslation();

    const data = routeParams?.monthData || {};

    useEffect(() => {
        const fetchEmp = async () => {
            try {
                const authUserId = await AuthService.getUserId();
                const userDetails = await ProfileServices.getUserDetailsData(authUserId);
                const employee = await ProfileServices.getEmployeeDetailsData(userDetails?.username);
                setEmployeeData(employee);
            } catch (err) {
                console.error("Failed to fetch emp data for download", err);
            }
        };
        fetchEmp();
    }, []);

    const handleDownload = async () => {
        if (!data || !employeeData) return;

        try {
            setDownloading(true);
            const payrunId = data.payrun_id || data.payrunId;
            const startDate = data.start_date || data.pay_date_range?.split(' to ')[0];
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
                    <View>
                        <Text style={styles.headerTitle}>{data.month || data.payrun_title || t(tokens.payslip.details)}</Text>
                        <View style={styles.headerSubtitleRow}>
                            <Text style={styles.headerSubtitle}>{formatPayslipRange(data.pay_date_range, data.start_date, data.end_date)}</Text>
                            <View style={styles.headerDot} />
                            <Text style={styles.headerSubtitle}>{data.payrunDays || data.days_paid || data.paid_days || 0} {t(tokens.common.days)}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}> */}
<View style={styles.scrollContent}>
                {/* Net Pay Summary Card */}
                <View style={[styles.card, styles.summaryCardContainer]}>
                    <LinearGradient
                        colors={['#F0F4FF', '#E4EBFF']}
                        style={styles.summaryGradient}
                    >
                        <View style={styles.summaryGrid}>
                            <View style={styles.summaryColLarge}>
                                <Text style={styles.label}>{t(tokens.charts.netPay)}</Text>
                                <Text style={styles.valueLarge}>SAR {'\n'}{formatCurrency(data.net_pay)}</Text>
                                <Text style={styles.subtext}>{t(tokens.payslip.creditedOn)}{'\n'}{formatPayslipDate(data.credit_date || data.end_date)}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.summaryCol}>
                                <Text style={styles.label}>{t(tokens.payslip.gross)}</Text>
                                <Text style={[styles.valueMedium, styles.fadedValue]}>SAR {formatCurrency(data.gross_pay)}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.summaryCol}>
                                <Text style={styles.label}>{t(tokens.charts.deductions)}</Text>
                                <Text style={[styles.valueMedium, styles.fadedValue]}>SAR {formatCurrency(data.deductions)}</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Salary Distribution Card */}
                <View style={[styles.card, styles.paddingVertical]}>
                    <Text style={styles.cardTitle}>{t(tokens.charts.salaryDistribution)}</Text>

                    <View style={styles.progressBarContainer}>
                        {(() => {
                            const grossNum = parseFloat(data.gross_pay) || 1;
                            const earningsNum = parseFloat(data.total_earning) || parseFloat(data.gross_pay) || 0;
                            const deductionNum = parseFloat(data.deductions) || 0;
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
                                {Math.round(((parseFloat(data.total_earning) || parseFloat(data.gross_pay) || 0) / ((parseFloat(data.total_earning) || parseFloat(data.gross_pay) || 0) + (parseFloat(data.deductions) || 0) || 1)) * 100)}%
                            </Text></Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#FF4B4B' }]} />
                            <Text style={styles.legendText}>{t(tokens.charts.deductions)} <Text style={styles.legendValue}>
                                {Math.round(((parseFloat(data.deductions) || 0) / ((parseFloat(data.total_earning) || parseFloat(data.gross_pay) || 0) + (parseFloat(data.deductions) || 0) || 1)) * 100)}%
                            </Text></Text>
                        </View>
                    </View>
                </View>

                {/* Earnings Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t(tokens.charts.earnings)}</Text>

                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>{t(tokens.payslip.totalEarnings)}</Text>
                        <Text style={styles.breakdownValue}>SAR {formatCurrency(data.total_earning || data.gross_pay)}</Text>
                    </View>

                    <View style={styles.breakdownDivider} />

                    <View style={styles.breakdownTotalRow}>
                        <Text style={styles.breakdownTotalLabel}>{t(tokens.actions.total)}</Text>
                        <Text style={styles.breakdownTotalValue}>SAR {formatCurrency(data.total_earning || data.gross_pay)}</Text>
                    </View>
                </View>

                {/* Deductions Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t(tokens.charts.deductions)}</Text>

                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>{t(tokens.payslip.totalDeductions)}</Text>
                        <Text style={styles.breakdownValue}>SAR {formatCurrency(data.deductions)}</Text>
                    </View>

                    <View style={styles.breakdownDivider} />

                    <View style={styles.breakdownTotalRow}>
                        <Text style={styles.breakdownTotalLabel}>{t(tokens.actions.total)}</Text>
                        <Text style={styles.breakdownTotalValue}>SAR {formatCurrency(data.deductions)}</Text>
                    </View>
                </View>
</View>
</View>
            </ScrollView>

            {/* Bottom Fixed Button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
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
            </View>
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
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E1F24',
        marginBottom: 4,
    },
    headerSubtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#999BA1',
        fontWeight: '500',
    },
    headerDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#999BA1',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100, // accommodate bottom button
    },
    paddingVertical: {
        paddingBottom: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F2F5',
    },
    summaryCardContainer: {
        padding: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    summaryGradient: {
        padding: 16,
        borderRadius: 12, // match outer card
    },
    summaryGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
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
        backgroundColor: '#c3dbfeff',
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
        marginTop: 4,
        lineHeight: 20,
    },
    fadedValue: {
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E1F24',
        marginBottom: 20,
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
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    breakdownLabel: {
        fontSize: 14,
        color: '#999BA1',
        fontWeight: '400',
    },
    breakdownValue: {
        fontSize: 14,
        color: '#1E1F24',
        fontWeight: '500',
    },
    breakdownDivider: {
        height: 1,
        backgroundColor: '#F0F2F5',
        marginVertical: 4,
        marginBottom: 16,
    },
    breakdownTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    breakdownTotalLabel: {
        fontSize: 14,
        color: '#1E1F24',
        fontWeight: '700',
    },
    breakdownTotalValue: {
        fontSize: 14,
        color: '#1E1F24',
        fontWeight: '700',
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
    downloadButton: {
        backgroundColor: '#4169E1',
        height: 48,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    downloadButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
