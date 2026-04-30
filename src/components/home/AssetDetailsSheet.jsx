import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';
import Toast from 'react-native-toast-message';
import SwipeableBottomSheet from '../common/SwipeableBottomSheet';

const { height } = Dimensions.get('window');

const AssetDetailsSheet = ({ visible, onClose, asset, onSave, readOnly }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [condition, setCondition] = useState(null); // 'good' or 'bad'
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [localAsset, setLocalAsset] = useState(null);

  const isFormValid = condition && description.trim().length > 0 && files.length > 0;

  useEffect(() => {
    if (visible && asset) {
      setLocalAsset(asset);
      // Reset form when opening
      setCondition(asset?.condition || null);
      setDescription(asset?.description || '');
      setFiles(asset?.files || []);
    }
  }, [visible, asset]);

  const displayAsset = asset || localAsset || {};

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
        multiple: true
      });

      if (result.canceled === false) {
        setFiles(prev => [...prev, ...result.assets]);
      }
    } catch (err) {
      // console.log('Document picker error:', err);
    }
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (onSave) {
      setSaving(true);
      try {
        await onSave('Received', condition, description, files);
      } catch (err) {
        setSaving(false);
        console.error('Save error:', err);
      }
    } else {
      onClose();
    }
  };

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      contentStyle={styles.bottomSheet}
      extraContent={<Toast />}
    >
      <View style={styles.handle} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1F24" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{displayAsset.name || ''}</Text>
            <View style={styles.subHeaderRow}>
              <Text style={styles.subHeaderText}>{t(tokens.dashboard.itemCode)}: {displayAsset.code || ''}</Text>
              <View style={styles.divider} />
              <Text style={styles.subHeaderText}>{t(tokens.dashboard.serialNo)}: {displayAsset.serial || ''}</Text>
            </View>
          </View>
          <View style={[
            styles.statusBadge,
            displayAsset.status === 'Received' ? { backgroundColor: '#EDF2FE' } : {}
          ]}>
            <Text style={[
              styles.statusText,
              displayAsset.status === 'Received' ? { color: '#4169E1' } : {}
            ]}>{(displayAsset.status === 'Received' ? t(tokens.dashboard.received) : t(tokens.dashboard.notReceived)) || displayAsset.status}</Text>
          </View>
        </View>

        {/* Action Required Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(tokens.dashboard.actionRequired)}</Text>

          <View style={styles.conditionRow}>
            <Text style={styles.label}>{t(tokens.dashboard.assetCondition)}</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioButtonContainer}
                onPress={readOnly ? null : () => setCondition('good')}
                activeOpacity={readOnly ? 1 : 0.7}
              >
                <View style={styles.radioButtonWrapper}>
                  <View style={[styles.radioButton, condition === 'good' && styles.radioButtonSelected]}>
                    {condition === 'good' && <View style={styles.radioButtonInner} />}
                  </View>
                </View>
                <Text style={styles.radioLabel}>{t(tokens.dashboard.good)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioButtonContainer}
                onPress={readOnly ? null : () => setCondition('bad')}
                activeOpacity={readOnly ? 1 : 0.7}
              >
                <View style={styles.radioButtonWrapper}>
                  <View style={[styles.radioButton, condition === 'bad' && styles.radioButtonSelected]}>
                    {condition === 'bad' && <View style={styles.radioButtonInner} />}
                  </View>
                </View>
                <Text style={styles.radioLabel}>{t(tokens.dashboard.bad)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder={t(tokens.dashboard.description)}
              placeholderTextColor="#62636C"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              editable={!readOnly}
            />
          </View>
        </View>

        {/* Attachment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(tokens.dashboard.attachment)}</Text>

          {!readOnly && (
            <TouchableOpacity style={styles.uploadBox} onPress={handlePickDocument}>
              <Ionicons name="cloud-upload-outline" size={24} color="#1E1F24" style={{ marginBottom: 8 }} />
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={styles.uploadTitle}>{t(tokens.dashboard.chooseFiles)}</Text>
                <Text style={styles.uploadSubtitle}>{t(tokens.dashboard.jpegOrPng)}</Text>
              </View>
              <View style={styles.browseButton}>
                <Text style={styles.browseButtonText}>{t(tokens.dashboard.browseFiles)}</Text>
              </View>
            </TouchableOpacity>
          )}

          {files.map((file, index) => (
            <View key={index} style={[styles.fileItem, { marginTop: index === 0 ? 0 : 8 }]}>
              <View style={styles.fileIcon}>
                <Ionicons name="image" size={18} color="#1E1F24" />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>{file.name}</Text>
                <Text style={styles.fileSize}>{file.size ? (file.size / 1024).toFixed(2) + ' KB' : 'Unknown size'}</Text>
              </View>
              {!readOnly && (
                <TouchableOpacity onPress={() => handleRemoveFile(index)}>
                  <Ionicons name="trash-outline" size={20} color="#E74C3C" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer Action Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            ((!isFormValid || saving) || readOnly) && styles.disabledButton
          ]}
          onPress={((!isFormValid || saving) || readOnly) ? null : handleSave}
          activeOpacity={((!isFormValid || saving) || readOnly) ? 1 : 0.7}
        >
          <Text style={[
            styles.primaryButtonText,
            ((!isFormValid || saving) || readOnly) && styles.disabledButtonText
          ]}>{saving ? t(tokens.actions.saving) : (readOnly ? t(tokens.dashboard.allAssetsReviewed) : t(tokens.actions.received))}</Text>
        </TouchableOpacity>
      </View>
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    backgroundColor: '#F8F9FB', // Solid background to prevent bleeding
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 0
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DEDFE4',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subHeaderText: {
    fontSize: 12,
    color: '#1E1F24',
    opacity: 0.47,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: '#B9BBC6',
    marginHorizontal: 8,
  },
  statusBadge: {
    marginLeft: 'auto',
    backgroundColor: '#EFF0F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    color: '#80828D',
  },
  content: {
    flexShrink: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFF0F3',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
    marginBottom: 16,
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#1E1F24',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButtonWrapper: {
    padding: 6, // Matches Figma padding for touch area
  },
  radioButton: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#62636C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0,
  },
  radioButtonSelected: {
    borderColor: '#4169E1',
  },
  radioButtonInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4169E1',
  },
  radioLabel: {
    fontSize: 12,
    color: '#62636C',
    marginLeft: 4,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: '#B9BBC6',
    borderRadius: 4,
    padding: 7,
  },
  textArea: {
    height: 80,
    fontSize: 13,
    color: '#1E1F24',
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#B9BBC6',
    borderRadius: 8,
    backgroundColor: '#EDF2FE', // Primary Blue 3
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  uploadTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E1F24',
  },
  uploadSubtitle: {
    fontSize: 11,
    color: '#1E1F24',
    opacity: 0.47,
  },
  browseButton: {
    backgroundColor: '#4169E1',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 4,
    width: 100,
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFF0F3',
    borderRadius: 8,
  },
  fileIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#EFF0F3',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    color: '#1E1F24',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    color: '#1E1F24',
    opacity: 0.47,
  },
  footer: {
    padding: 16,
  },
  primaryButton: {
    backgroundColor: '#4169E1',
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.47,
  },
  disabledButtonText: {
    color: '#FFFFFF',
  },
});

export default AssetDetailsSheet;
