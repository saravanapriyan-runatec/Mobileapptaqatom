import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    SafeAreaView,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SwipeableBottomSheet from '../common/SwipeableBottomSheet';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AttachmentItem = ({ name, size, type }) => (
    <View style={styles.attachmentCard}>
        <View style={styles.attachmentLeft}>
            <View style={styles.attachmentIconContainer}>
                <Ionicons
                    name={type === 'image' ? 'image-outline' : 'document-text-outline'}
                    size={20}
                    color="#80828D"
                />
            </View>
            <View>
                <Text style={styles.attachmentName} numberOfLines={1}>{name}</Text>
                <Text style={styles.attachmentSize}>{size}</Text>
            </View>
        </View>
        <TouchableOpacity>
            <Ionicons name="download-outline" size={20} color="#80828D" />
        </TouchableOpacity>
    </View>
);

export default function AnnouncementDetailSheet({ visible, announcement, onClose, onAcknowledge }) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [localAnnouncement, setLocalAnnouncement] = useState(null);

    useEffect(() => {
        if (visible && announcement) {
            setLocalAnnouncement(announcement);
        }
    }, [visible, announcement]);

    const displayAnnouncement = announcement || localAnnouncement;

    if (!displayAnnouncement && !visible) return null;

    const priorityColor = (priority) => {
        if (!priority || priority === '-') return '#80828D';
        const p = String(priority).toLowerCase();
        if (p.includes('high')) return '#E74C3C';
        if (p.includes('low')) return '#2ECC71';
        return '#F39C12';
    };

    const getCategoryLabel = (type) => {
        switch (type) {
            case 1: return 'Birthday Wishes';
            case 2: return 'Anniversary Wishes';
            case 3: return 'Date of Joining Wishes';
            case 4: return 'Custom';
            default: return 'General Announcement';
        }
    };

    return (
        <SwipeableBottomSheet
            visible={visible}
            onClose={onClose}
            contentStyle={styles.sheet}
        >
            <View style={styles.handle} />
            
            {!displayAnnouncement ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B5998" />
                </View>
            ) : (
                <View style={styles.sheetContainer}>
                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        contentContainerStyle={styles.scrollContent}
                        style={styles.scrollStyle}
                    >
                        <Text style={styles.sheetTitle}>{displayAnnouncement.title || t(tokens.dashboard.companyNotice)}</Text>
                        {/* Banner Image based on Announcement Type */}
                        <View style={styles.bannerPlaceholder}>
                            {displayAnnouncement?.Announcement_type === 1 && 
                                <Image source={require("../../../assets/birthday.jpg")} style={styles.bannerImage} />
                            }
                            {displayAnnouncement?.Announcement_type === 2 && 
                                <Image source={require("../../../assets/custom.jpg")} style={styles.bannerImage} />
                            }
                            {displayAnnouncement?.Announcement_type === 3 && 
                                <Image source={require("../../../assets/holidays.jpg")} style={styles.bannerImage} />
                            }
                            {displayAnnouncement?.Announcement_type === 4 && 
                                <Image source={require("../../../assets/microphone.jpg")} style={styles.bannerImage} />
                            }
                            {!displayAnnouncement?.Announcement_type && 
                                <Ionicons name="megaphone-outline" size={40} color="#B9BBC6" />
                            }
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>{t(tokens.dashboard.description)}</Text>
                            <Text style={styles.subDescription}>
                                {displayAnnouncement.content || displayAnnouncement.description || t(tokens.messages.noDescription)}
                            </Text>
                        </View>

                        <View style={styles.detailsCard}>
                            <Text style={styles.cardHeader}>{t(tokens.dashboard.details)}</Text>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t(tokens.dashboard.category)}</Text>
                            <Text style={styles.detailValue}>{getCategoryLabel(displayAnnouncement?.Announcement_type)}</Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t(tokens.requests.priority)}</Text>
                            <Text style={[styles.detailValue, { color: priorityColor(displayAnnouncement?.priority || displayAnnouncement?.priority_level || '-') }]}>
                                {displayAnnouncement?.priority || displayAnnouncement?.priority_level || '-'}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t(tokens.dashboard.publishDate)}</Text>
                            <Text style={styles.detailValue}>
                                {displayAnnouncement?.updated_at ? new Date(displayAnnouncement.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : (displayAnnouncement?.date || '-')}
                            </Text>
                        </View>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{t(tokens.dashboard.postedBy)}</Text>
                            <View style={styles.authorRow}>
                                <View style={[styles.avatar, { backgroundColor: '#80828D' }]}>
                                    <Text style={styles.avatarText}>
                                        {displayAnnouncement?.posted_by_name ? displayAnnouncement.posted_by_name.substring(0, 2).toUpperCase() : '-'}
                                    </Text>
                                </View>
                                <Text style={styles.detailValue}>{displayAnnouncement?.posted_by_name || '-'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Attachments Section */}
                    <View style={styles.detailsCard}>
                        <Text style={styles.cardHeader}>{t(tokens.dashboard.attachment)}</Text>
                        {displayAnnouncement?.attachments && displayAnnouncement.attachments.length > 0 ? (
                            displayAnnouncement.attachments.map((file, idx) => (
                                <AttachmentItem 
                                    key={idx} 
                                    name={file.name || `Attachment ${idx + 1}`} 
                                    size={file.size ? (file.size / 1024).toFixed(1) + ' KB' : '--'} 
                                    type={file.type || (file.name?.match(/\.(jpg|jpeg|png)$/i) ? 'image' : 'doc')} 
                                />
                            ))
                        ) : (
                            <Text style={[styles.detailValue, { opacity: 0.5 }]}>-</Text>
                        )}
                    </View>

                    <View style={{ height: 20 }} />
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <TouchableOpacity style={[styles.closeButton, { backgroundColor: '#3B5998', borderColor: '#3B5998' }]} onPress={onClose}>
                        <Text style={[styles.closeButtonText, { color: '#FFF' }]}>{t(tokens.common.close)}</Text>
                    </TouchableOpacity>
                </View>
                </View>
            )}
        </SwipeableBottomSheet>
    );
}

const styles = StyleSheet.create({
    sheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: SCREEN_HEIGHT * 0.85,
        paddingTop: 12,
        padding: 0
    },
    handle: {
        width: 36,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetContainer: {
        maxHeight: SCREEN_HEIGHT * 0.82, // Constraint to ensure footer stays visible
    },
    scrollStyle: {
        flexShrink: 1, 
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E1F24',
        marginBottom: 24,
    },
    bannerPlaceholder: {
        width: '100%',
        height: 160,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        overflow: 'hidden',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 13,
        color: '#94A3B8',
        marginBottom: 8,
    },
    mainDescription: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E1F24',
        marginBottom: 8,
        lineHeight: 22,
    },
    subDescription: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
    },
    detailsCard: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    cardHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E1F24',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    detailLabel: {
        fontSize: 13,
        color: '#94A3B8',
    },
    detailValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E1F24',
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#9B51E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '700',
    },
    attachmentCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    attachmentLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    attachmentIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachmentName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E1F24',
        maxWidth: 200,
    },
    attachmentSize: {
        fontSize: 11,
        color: '#94A3B8',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    closeButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    acknowledgeButton: {
        flex: 2,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#3b66f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    acknowledgeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    loadingContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
