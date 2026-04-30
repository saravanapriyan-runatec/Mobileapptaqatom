import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';

const DeleteConfirmationModal = ({ visible, onClose, onDelete }) => {
  const { t } = useTranslation();
  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        </View>
        
        <View style={styles.modalContent}>
          <View style={styles.contentContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="trash-outline" size={20} color="#E74C3C" />
              </View>
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>{t(tokens.dashboard.deleteRequestTitle)}</Text>
              <Text style={styles.message}>
                {t(tokens.dashboard.deleteRequestMessage)}
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{t(tokens.actions.cancel)}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
              <Text style={styles.deleteButtonText}>{t(tokens.actions.delete)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  contentContainer: {
    gap: 16,
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.1)', // #E74C3C1A
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
  },
  message: {
    fontSize: 14,
    color: '#62636C',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#62636C',
  },
  deleteButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DeleteConfirmationModal;
