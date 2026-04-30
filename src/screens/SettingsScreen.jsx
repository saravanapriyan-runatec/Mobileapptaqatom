import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Dimensions, ActivityIndicator, Switch, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileServices from '../../Services/API/ProfileServices';
import AuthService from '../../Services/AuthService';
import { triggerGlobalLogout } from '../utils/globalLogoutHandler';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import StaggeredEntrance from '../components/common/StaggeredEntrance';
import { useUser } from '../context/UserContext';
import { getAbsoluteProfileUrl } from '../utils/imageUtils';
import BiometricService from '../../Services/BiometricService';
import Toast from 'react-native-toast-message';

const { width,height} = Dimensions.get('window');

export default function SettingsScreen({ onBack, onNavigate }) {

    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { userDetails, loading: userLoading } = useUser();
    const [userData, setUserData] = useState({
        name: '', empId: '', employmentType: '',
        department: '', team: '', reportsTo: '',
        profileImage: null, gender: 'M'
    });

    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [showBiometricModal, setShowBiometricModal] = useState(false);
    const [passwordForBiometric, setPasswordForBiometric] = useState('');
    const [biometricLoading, setBiometricLoading] = useState(false);

    useEffect(() => {
        // Check if biometric is already enabled
        const checkBiometric = async () => {
            const creds = await BiometricService.getCredentials();
            setIsBiometricEnabled(!!creds);
        };
        checkBiometric();
    }, []);

    const toggleBiometric = async (value) => {
        if (!value) {
            // Disable
            await BiometricService.clearCredentials();
            setIsBiometricEnabled(false);
            Toast.show({ type: 'success', text1: 'Success', text2: 'Biometric login disabled' });
        } else {
            // Check support
            const support = await BiometricService.checkBiometricSupport();
            if (!support.supported) {
                Toast.show({ type: 'error', text1: 'Not Supported', text2: support.error });
                return;
            }
            setShowBiometricModal(true);
        }
    };

    const enableBiometricWithPassword = async () => {
        if (!passwordForBiometric.trim()) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter your password' });
            return;
        }
        
        setBiometricLoading(true);
        try {
            // Verify biometric
            const auth = await BiometricService.authenticate('Verify to enable Biometric Login');
            if (!auth.success) {
                Toast.show({ type: 'error', text1: 'Failed', text2: 'Biometric verification failed' });
                return;
            }

            // Save credentials (using email from userDetails)
            const email = userDetails?.email || userData.name;
            await BiometricService.saveCredentials(email, passwordForBiometric);
            
            setIsBiometricEnabled(true);
            setShowBiometricModal(false);
            setPasswordForBiometric('');
            Toast.show({ type: 'success', text1: 'Success', text2: 'Biometric login enabled successfully' });
        } catch (e) {
            console.error('Biometric enable error:', e);
            Toast.show({ type: 'error', text1: 'Error', text2: 'An error occurred while enabling Biometrics' });
        } finally {
            setBiometricLoading(false);
        }
    };

    useEffect(() => {
        if (userDetails) {
            const firstName = userDetails.first_name || '';
            const lastName = userDetails.last_name || '';
            let fullName = `${firstName} ${lastName}`.trim();

            if (!fullName && userDetails.employee_name) {
                fullName = userDetails.employee_name;
            }

            setUserData({
                name: fullName || userDetails.email || 'Employee',
                empId: userDetails.emp_code || userDetails.employee_code || '',
                department: userDetails.department_name || '',
                team: userDetails.position_name || userDetails.designation_name || '',
                reportsTo: userDetails.manager_details?.employee_name || userDetails.reporting_manager_name || userDetails.manager_name || 'Not Assigned',
                employmentType: userDetails.emp_type === 1 ? 'Full Time' : userDetails.emp_type === 2 ? 'Part Time' : userDetails.employment_status_name || userDetails.employment_type || 'N/A',
                gender: userDetails.gender || 'M',
                profileImage: getAbsoluteProfileUrl(userDetails.profile_url, userDetails._fetchTime),
            });
        }
    }, [userDetails]);

    const handleLogout = async () => {
        try {
            // Use global logout exclusively to prevent concurrent state/store mutations during unmount
            triggerGlobalLogout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };


    const getProfileImage = () => {
        console.log('DEBUG [SettingsScreen] raw profileImage:', userData.profileImage);
        if (userData.profileImage && userData.profileImage !== 'null' && userData.profileImage.trim() !== '') {
            if (userData.profileImage.startsWith('http')) {
                console.log('DEBUG [SettingsScreen] returning network source:', userData.profileImage);
                return { 
                    uri: userData.profileImage,
                    headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache', 'CacheBust': userDetails?._fetchTime?.toString() || Date.now().toString() }
                };
            }
            console.log('DEBUG [SettingsScreen] returning local uri source:', userData.profileImage);
            return { uri: userData.profileImage };
        }

        const isFemale = userData.gender?.toUpperCase() === 'F' || userData.gender?.toLowerCase() === 'female';

        try {
            console.log('DEBUG [SettingsScreen] returning local fallback asset');
            return isFemale
                ? require('../../assets/female-profile-image.png')
                : require('../../assets/male-profile-image.png');
        } catch (err) {
            return { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random&color=fff` };
        }
    };

    const SettingItem = ({ icon, text, onPress, isSwitch, switchValue, onSwitchChange }) => (
        <TouchableOpacity style={styles.settingItemCard} onPress={onPress} activeOpacity={isSwitch ? 1 : 0.7}>
            <View style={styles.settingItemLeft}>
                <Ionicons name={icon} size={24} color="#1C1C1E" style={styles.settingIcon} />
                <Text style={styles.settingItemText}>{text}</Text>
            </View>
            {isSwitch ? (
                <Switch
                    value={switchValue}
                    onValueChange={onSwitchChange}
                    trackColor={{ false: "#D1D1D6", true: "#34C759" }}
                    thumbColor="#FFFFFF"
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            )}
        </TouchableOpacity>
    );

    if (userLoading && !userDetails) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LinearGradient
                    colors={['#8EA3E3', '#FFFFFF']}
                    locations={[0, 0.6]}
                    style={styles.background}
                />
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Background Gradient - Fixed */}
            <LinearGradient
                colors={['#8EA3E3', '#FFFFFF']}
                locations={[0, 0.3]}
                style={styles.background}
            />

            {/* Fixed Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12, zIndex: 1 }]}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t(tokens.profile.settings)}</Text>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingTop: 10 }]}
            >
                <View style={{ minHeight: height - (insets.top + 100) }}>
                    {/* Profile Card */}
                    <View style={styles.profileCardContainer}>
                        <LinearGradient
                            colors={['#d3def9ff', '#FFFFFF', '#d3def9ff']}
                            locations={[0, 0.5, 1]}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={styles.profileCardGradient}
                        >
                            <Image 
                                source={getProfileImage()} 
                                style={[styles.profileAvatar, { backgroundColor: '#F0F0F0' }]} 
                                key={`${userData.profileImage}-${userData.gender}`}
                                onError={(e) => console.log('DEBUG [SettingsScreen] Image Load ERROR:', e.nativeEvent.error)}
                            />
                            <Text style={styles.profileName}>{userData.name}</Text>

                            <View style={styles.empInfoRow}>
                                <Text style={styles.empIdText}>{userData.empId}</Text>
                                <View style={styles.divider} />
                                <Text style={styles.empDetailText}>{userData.employmentType}</Text>
                                <View style={styles.divider} />
                                <Text style={styles.empDetailText}>{userData.department}</Text>
                                <View style={styles.divider} />
                                <Text style={styles.empDetailText}>{userData.team}</Text>
                            </View>

                            <Text style={styles.reportsToText}>
                                {t(tokens.profile.reportsTo)}: <Text style={styles.managerName}>{userData.reportsTo}</Text>
                            </Text>
                        </LinearGradient>
                    </View>

                    {/* Sections */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t(tokens.nav.myAccount)}</Text>
                        <StaggeredEntrance index={0}>
                            <SettingItem
                                icon="person-outline"
                                text={t(tokens.profile.myProfile)}
                                onPress={() => onNavigate && onNavigate('profileUpdate')}
                            />
                        </StaggeredEntrance>
                        <StaggeredEntrance index={1}>
                            <SettingItem
                                icon="notifications-outline"
                                text={t(tokens.nav.notifications)}
                                onPress={() => onNavigate && onNavigate('notifications')}
                            />
                        </StaggeredEntrance>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t(tokens.nav.otherSettings)}</Text>
                        <StaggeredEntrance index={2}>
                            <SettingItem
                                icon="lock-closed-outline"
                                text={t(tokens.nav.passwordSettings)}
                                onPress={() => onNavigate && onNavigate('password')}
                            />
                        </StaggeredEntrance>
                        <StaggeredEntrance index={3}>
                            <SettingItem
                                icon="finger-print-outline"
                                text="Biometric Login"
                                isSwitch={true}
                                switchValue={isBiometricEnabled}
                                onSwitchChange={toggleBiometric}
                            />
                        </StaggeredEntrance>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#4A90E2" />
                        <Text style={styles.logoutText}>{t(tokens.nav.logout)}</Text>
                    </TouchableOpacity>

                    {/* App Version */}
                    <View style={styles.versionContainer}>
                        <Text style={styles.versionText}>1.0.0</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Biometric Password Prompt Modal */}
            <Modal
                visible={showBiometricModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowBiometricModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Enable Biometric Login</Text>
                            <TouchableOpacity onPress={() => setShowBiometricModal(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#8E8E93" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>
                            Please enter your password to confirm and securely store your credentials for biometric login.
                        </Text>
                        <View style={styles.modalInputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.modalInputIcon} />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter your password"
                                placeholderTextColor="#A0A0A0"
                                secureTextEntry
                                value={passwordForBiometric}
                                onChangeText={setPasswordForBiometric}
                                autoCapitalize="none"
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.modalButton, biometricLoading && styles.modalButtonDisabled]}
                            onPress={enableBiometricWithPassword}
                            disabled={biometricLoading}
                        >
                            {biometricLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.modalButtonText}>Verify & Enable</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
        
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: Dimensions.get('window').height,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    profileCardContainer: {
        marginBottom: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',

        overflow: 'hidden',
    },
    profileCardGradient: {
        padding: 24,
        alignItems: 'center',
    },
    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 8,
    },
    empInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    empIdText: {
        fontSize: 13,
        color: '#9BA1A6',
        fontWeight: '500',
    },
    empDetailText: {
        fontSize: 13,
        color: '#9BA1A6',
    },
    divider: {
        width: 1,
        height: 10,
        backgroundColor: '#D1D1D6',
        marginHorizontal: 8,
    },
    reportsToText: {
        fontSize: 14,
        color: '#9BA1A6',
    },
    managerName: {
        color: '#1C1C1E',
        fontWeight: '700',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        marginBottom: 10,
        marginLeft: 4,
    },
    settingItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#Eff0f3',
    },
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingIcon: {
        marginRight: 16,
    },
    settingItemText: {
        fontSize: 16,
        color: '#1C1C1E',
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingVertical: 12,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A90E2',
        marginLeft: 8,
    },
    versionContainer: {
        alignItems: 'center',
        marginTop: 32,
    },
    versionText: {
        fontSize: 13,
        color: '#AEA9B1',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    closeButton: {
        padding: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 20,
        lineHeight: 20,
    },
    modalInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 24,
    },
    modalInputIcon: {
        marginRight: 10,
    },
    modalInput: {
        flex: 1,
        fontSize: 16,
        color: '#1C1C1E',
    },
    modalButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 10,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonDisabled: {
        backgroundColor: '#A0A0A0',
    },
    modalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
