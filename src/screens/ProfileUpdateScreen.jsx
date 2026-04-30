import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, Image,
    ScrollView, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProfileServices from '../../Services/API/ProfileServices';
import AuthService from '../../Services/AuthService';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import { useUser } from '../context/UserContext';
import { getAbsoluteProfileUrl } from '../utils/imageUtils';

const { width, height } = Dimensions.get('window');

/* ───────── Reusable: Label–Value Row ───────── */
const InfoRow = ({ label, value }) => (
    <View style={styles.infoFieldRow}>
        <Text style={styles.infoFieldLabel}>{label}</Text>
        <Text style={styles.infoFieldValue} numberOfLines={2}>{value || '—'}</Text>
    </View>
);

/* ═══════════════════════════════════════════════ */
/*               ProfileUpdateScreen               */
/* ═══════════════════════════════════════════════ */
export default function ProfileUpdateScreen({ onBack }) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const { refreshUserData } = useUser();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [initialData, setInitialData] = useState(null);

    const [userData, setUserData] = useState({
        id: null, name: '', empId: '', employmentType: '',
        department: '', team: '', reportsTo: '',
        profileImage: null, gender: 'M',
        fullName: '', dob: '', mailId: '',
        mobileNo: '', address: '', emergencyContact: '',
    });

    /* ─── Fetch profile data ─── */
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const authUserId = await AuthService.getUserId();
                if (!authUserId) return;

                const userDetails = await ProfileServices.getUserDetailsData(authUserId);
                const username = userDetails?.username;
                if (!username) return;

                const employee = await ProfileServices.getEmployeeDetailsData(username);
                const empID = employee?.id;
                if (!empID) return;

                const d = await ProfileServices.getEmployeeFullDetails(empID);
                if (!d) return;

                setInitialData(d);

                const first = d.first_name || '';
                const last = d.last_name || '';
                let fullName = `${first} ${last}`.trim() || d.employee_name || '';

                setUserData({
                    id: d.id,
                    name: fullName || d.email || '',
                    empId: d.emp_code || d.employee_code || '',
                    department: d.department_name || '',
                    team: d.position_name || d.designation_name || '',
                    reportsTo: d.manager_details?.employee_name || d.reporting_manager_name || d.manager_name || 'Not Assigned',
                    employmentType: d.emp_type === 1 ? 'Full Time' : d.emp_type === 2 ? 'Part Time' : 'N/A',
                    gender: d.gender || 'M', // Set gender first
                    profileImage: getAbsoluteProfileUrl(d.profile_url, Date.now()),
                    fullName,
                    dob: d.birthday || '',
                    mailId: d.email || '',
                    mobileNo: d.mobile || '',
                    address: d.address || '',
                    emergencyContact: d.emergency_contact_number ? String(d.emergency_contact_number) : '',
                });
            } catch (err) {
                console.error('Profile fetch error:', err);
                Toast.show({ type: 'error', text1: t(tokens.common.error), text2: 'Could not load profile' });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ─── Edit Picture Handler ─── */
    const handleEditPicture = async () => {
        try {
            setUpdating(true);
            const result = await DocumentPicker.getDocumentAsync({
                type: 'image/*', copyToCacheDirectory: true, multiple: false,
            });
            if (result.canceled || !result.assets?.length) { setUpdating(false); return; }

            const file = result.assets[0];
            
            // Client-side size check (e.g., 5MB limit)
            const MAX_SIZE = 5 * 1024 * 1024; // 5MB
            if (file.size > MAX_SIZE) {
                setUpdating(false);
                Toast.show({
                    type: 'error',
                    text1: t(tokens.common.error) || 'Error',
                    text2: 'Image size is too large. Please select an image smaller than 5MB.'
                });
                return;
            }

            const base64Data = await FileSystem.readAsStringAsync(file.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const ext = (file.name || '').split('.').pop()?.toLowerCase();
            const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
            const base64Image = `data:${mime};base64,${base64Data}`;

            if (!userData?.id || !initialData) throw new Error('Employee data not loaded');

            // --- DEEP CLEAN UTILITY ---
            // This recursively scans the object and removes anything that looks like a 160-char hex token
            const deepClean = (obj) => {
                if (!obj || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(deepClean);

                const cleaned = {};
                for (const key in obj) {
                    const value = obj[key];
                    
                    // Filter out 160-character hex tokens (Session/Auth tokens)
                    const isToken = typeof value === 'string' && value.length > 50 && /^[a-f0-9]+$/i.test(value);
                    
                    if (!isToken) {
                        if (typeof value === 'object' && value !== null) {
                            cleaned[key] = deepClean(value);
                        } else {
                            cleaned[key] = value;
                        }
                    }
                }
                return cleaned;
            };

            const {
                id, profile_url, update_time, change_time,
                area_details, leave_group_details, department_name,
                department_code, position_name, position_code,
                dependents, payroll, salary_template, ssn, user: rawUser,
                gosi, marital_status, manager_details,
                insurance, insurance_details, 
                contract, contract_details,
                ...restOfDetails
            } = initialData;

            // Ensure we only keep editable or necessary fields to avoid sending read-only tokens
            const cleanedDetails = deepClean(restOfDetails);

            let safeUserId = null;
            if (rawUser && typeof rawUser === 'object' && rawUser.id) {
                safeUserId = Number(rawUser.id);
            } else if (!isNaN(rawUser) && rawUser !== null && rawUser !== '') {
                safeUserId = Number(rawUser);
            }

            const payload = {
                ...cleanedDetails,
                profile_file: base64Image,
                ...(gosi != null ? { gosi } : {}),
                ...(insurance != null ? { insurance } : {}),
                ...(marital_status != null && marital_status !== '' ? { marital_status: Number(marital_status) } : {}),
                ...(safeUserId ? { 
                    user: { 
                        id: safeUserId, 
                        first_name: initialData.first_name, 
                        last_name: initialData.last_name, 
                        email: initialData.email 
                    } 
                } : {}),
                ...(payroll ? { payroll } : {}),
            };

            const res = await ProfileServices.putEmployeeFullDetails(userData.id, payload);
            if (res) {
                // ✅ FIX: Actually upload the image to S3 using the backend's presigned URL
                try {
                    console.log('DEBUG: Requesting S3 presigned URL for upload...');
                    const empCode = userData.empId || initialData?.employee_code || initialData?.emp_code || '';
                    if (empCode) {
                        const s3Response = await ProfileServices.updateProfilePic(empCode, file);
                        const s3Url = typeof s3Response === 'string' 
                            ? s3Response 
                            : (s3Response?.url || s3Response?.presigned_url || s3Response?.data);
                        
                        if (s3Url) {
                            console.log('DEBUG: Uploading local image blob to S3...', s3Url.substring(0, 50));
                            const localRes = await fetch(file.uri);
                            const blob = await localRes.blob();
                            await ProfileServices.sendImagesToS3({ S3URL: s3Url, file: blob, type: mime });
                            console.log('DEBUG: Successfully uploaded image to S3!');
                        } else {
                            console.warn('DEBUG: Invalid S3 URL returned from updateProfilePic:', s3Response);
                        }
                    }
                } catch (s3Error) {
                    console.error('DEBUG: S3 Upload Failed:', s3Error);
                }

                // Refresh global context so dashboard header updates immediately
                await refreshUserData();
                
                // Update local state for immediate visual feedback
                setUserData(prev => ({ ...prev, profileImage: file.uri }));
                Toast.show({ type: 'success', text1: t(tokens.nav.success), text2: t(tokens.nav.profilePictureUpdated) });
            }
        } catch (error) {
            console.error('Upload error:', JSON.stringify(error, null, 2));
            let msg = 'Please try again.';
            
            if (error?.status === 413) {
                msg = 'Image size is too large for the server. Please select a smaller image.';
            } else {
                try {
                    const m = error?.errors?.[0]?.message;
                    if (typeof m === 'string') msg = m;
                    else if (m && typeof m === 'object') {
                        const k = Object.keys(m)[0];
                        msg = Array.isArray(m[k]) ? m[k][0] : String(m[k]);
                    }
                } catch (e) { }
            }
            Toast.show({ type: 'error', text1: t(tokens.nav.uploadFailed), text2: msg });
        } finally {
            setUpdating(false);
        }
    };

    /* ─── Profile Image Source ─── */
    const getProfileImage = () => {
        console.log('DEBUG [ProfileUpdateScreen] raw profileImage:', userData.profileImage);
        if (userData.profileImage && userData.profileImage !== 'null' && userData.profileImage.trim() !== '') {
            if (userData.profileImage.startsWith('http')) {
                console.log('DEBUG [ProfileUpdateScreen] returning network source:', userData.profileImage);
                return { 
                    uri: userData.profileImage,
                    headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache', 'CacheBust': Date.now().toString() }
                };
            }
            console.log('DEBUG [ProfileUpdateScreen] returning local uri source:', userData.profileImage);
            return { uri: userData.profileImage };
        }
        
        const isFemale = userData.gender?.toUpperCase() === 'F' || userData.gender?.toLowerCase() === 'female';
        
        try {
            console.log('DEBUG [ProfileUpdateScreen] returning local fallback asset');
            return isFemale
                ? require('../../assets/female-profile-image.png')
                : require('../../assets/male-profile-image.png');
        } catch {
            return { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random&color=fff` };
        }
    };

    /* ─── Loading State ─── */
    if (loading) {
        return (
            <View style={[styles.screen, styles.center]}>
                <LinearGradient colors={['#8EA3E3', '#FFFFFF']} locations={[0, 0.3]} style={styles.bg} />
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    /* ═══════ RENDER ═══════ */
    return (
        <View style={styles.screen}>
            <LinearGradient colors={['#8EA3E3', '#FFFFFF']} locations={[0, 0.5]} style={styles.bg} />

            {/* ── Header ── */}
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
            <LinearGradient colors={['#8EA3E3', '#FFFFFF']} locations={[0, 0.3]} style={styles.bg} />
            <View style={{ minHeight: height }}>
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#1C1C1E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t(tokens.profile.myProfile)}</Text>
            </View>

            {/* <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} bounces={false}> */}
<View style={styles.scroll}>
                {/* ════════ CARD 1 — Profile Card ════════ */}
                <View style={styles.card}>
                    <LinearGradient
                        colors={['#d3def9ff', '#FFFFFF', '#d3def9ff']}
                        locations={[0, 0.5, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.profileGradient}
                    >
                        {/* Avatar */}
                        <View style={styles.avatarRing}>
                            <Image 
                                source={getProfileImage()} 
                                style={[styles.avatar, { backgroundColor: '#F0F0F0' }]} 
                                key={`${userData.profileImage}-${userData.gender}`}
                                onError={(e) => console.log('DEBUG [ProfileUpdateScreen] Image Load ERROR:', e.nativeEvent.error)}
                            />
                        </View>

                        {/* Edit Picture */}
                        <TouchableOpacity
                            style={styles.editPicBtn}
                            activeOpacity={0.6}
                            onPress={handleEditPicture}
                            disabled={updating}
                        >
                            {updating ? (
                                <ActivityIndicator size="small" color="#4A90E2" />
                            ) : (
                                <>
                                    <Ionicons name="create-outline" size={14} color="#4A90E2" />
                                    <Text style={styles.editPicTxt}>{t(tokens.nav.editPicture)}</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Name */}
                        <Text style={styles.nameText}>{userData.name}</Text>

                        {/* Emp info row */}
                        <View style={styles.empRow}>
                            <Text style={styles.empTxt}>{userData.empId}</Text>
                            <Text style={styles.empPipe}>|</Text>
                            <Text style={styles.empTxt}>{userData.employmentType}</Text>
                            <Text style={styles.empPipe}>|</Text>
                            <Text style={styles.empTxt}>{userData.department}</Text>
                            <Text style={styles.empPipe}>|</Text>
                            <Text style={styles.empTxt}>{userData.team}</Text>
                        </View>

                        {/* Reports To */}
                        <Text style={styles.reportsTo}>
                            {t(tokens.profile.reportsTo)}: <Text style={styles.managerBold}>{userData.reportsTo}</Text>
                        </Text>
                    </LinearGradient>
                </View>

                {/* ════════ CARD 2 — Personal Information Card ════════ */}
                <View style={[styles.card, styles.infoCard]}>
                    <Text style={styles.sectionTitle}>{t(tokens.nav.personalInformation)}</Text>

                    <InfoRow label={t(tokens.nav.fullName)} value={userData.fullName} />
                    <InfoRow label={t(tokens.nav.dob)} value={userData.dob} />
                    <InfoRow label={t(tokens.nav.mailId)} value={userData.mailId} />
                    <InfoRow label={t(tokens.nav.mobileNo)} value={userData.mobileNo} />
                    <InfoRow label={t(tokens.nav.address)} value={userData.address} />
                    <InfoRow label={t(tokens.nav.emergencyContact)} value={userData.emergencyContact} />
                </View>

                <View style={{ height: 40 }} />
                </View>
                </View>
            </ScrollView>
        </View>
    );
}

/* ═══════════════════════════════════════════════ */
/*                    Styles                       */
/* ═══════════════════════════════════════════════ */
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    bg: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: height,
    },

    /* ── Header ── */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    backBtn: {
        padding: 6,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
    },

    /* ── Scroll ── */
    scroll: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 20,
    },

    /* ── Shared Card ── */
    card: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
        shadowColor: '#7D9AC7',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'white',
    },

    /* ── Card 1: Profile ── */
    profileGradient: {
        alignItems: 'center',
        paddingTop: 28,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderRadius: 16,
    },

    /* Avatar */
    avatarRing: {
        width: 92,
        height: 92,
        borderRadius: 46,
       
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginBottom: 6,
    },
    avatar: {
        width: 82,
        height: 82,
        borderRadius: 41,
    },

    /* Edit Picture */
    editPicBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginBottom: 14,
    },
    editPicTxt: {
        fontSize: 13,
        color: '#4A90E2',
        fontWeight: '500',
        marginLeft: 5,
    },

    /* Name */
    nameText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1C1C1E',
        textAlign: 'center',
        marginBottom: 6,
    },

    /* Emp Info Row */
    empRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 8,
    },
    empTxt: {
        fontSize: 12,
        color: '#8E8E93',
    },
    empPipe: {
        fontSize: 12,
        color: '#C7C7CC',
        marginHorizontal: 6,
    },

    /* Reports To */
    reportsTo: {
        fontSize: 13,
        color: '#8E8E93',
        textAlign: 'center',
    },
    managerBold: {
        fontWeight: '700',
        color: '#1C1C1E',
    },

    /* ── Card 2: Personal Info ── */
    infoCard: {
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 14,
    },

    /* ── Info Field Rows ── */
    infoFieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 13,
    },
    infoFieldLabel: {
        fontSize: 13,
        color: '#8E8E93',
        fontWeight: '400',
        flex: 1,
        lineHeight: 20,
    },
    infoFieldValue: {
        fontSize: 13,
        color: '#1C1C1E',
        fontWeight: '500',
        flex: 1.6,
        textAlign: 'right',
        lineHeight: 20,
    },
});
