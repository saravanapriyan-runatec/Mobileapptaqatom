import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import tokens from '../../../locales/tokens';
import { HighPriorityIcon, MediumPriorityIcon, LowPriorityIcon } from '../icons/PriorityIcons';
import { useTasks } from '../../context/TaskContext';

const PriorityIcon = ({ priority }) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return <HighPriorityIcon />;
    case 'medium':
      return <MediumPriorityIcon />;
    case 'low':
      return <LowPriorityIcon />;
    default:
      return null;
  }
};

const getStatusStyles = (status) => {
  switch (status) {
    case 'Pending':
      return { color: '#F39C12', bg: '#FFF3E0' };
    case 'Completed':
      return { color: '#27AE60', bg: '#E8F5E9' };
    case 'Blocked':
      return { color: '#E74C3C', bg: '#FDEDEC' };
    case 'In Progress':
      return { color: '#3498DB', bg: '#EBF5FB' };
    default:
      return { color: '#7F8C8D', bg: '#F8F9F9' };
  }
};

import TaskDetailsSheet from './TaskDetailsSheet';

export default React.memo(function TaskSection({ onNavigate }) {
  const { t } = useTranslation();
  const { tasks, loading, error, updateTaskStatus, updateAssetStatus, fetchTaskDetails, completeTask } = useTasks();
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const pendingTasks = (tasks || []).filter(t => {
    const status = (t.status || '').trim().toLowerCase();
    return status === 'pending';
  });

  // console.log('DEBUG [Dashboard]: Pending Tasks (from TaskContext):', JSON.stringify(pendingTasks, null, 2));

  const selectedTask = tasks.find(t => String(t.id) === String(selectedTaskId));

  const handleTaskPress = (task) => {
    setSelectedTaskId(task.id);
    setSheetVisible(true);
    if (task.id) {
      fetchTaskDetails(task.id, task);
    }
  };

  const handleTaskAction = (action, payload) => {
    // action: 'viewAsset' is now handled inline in TaskDetailsSheet
  };



  if (loading && tasks.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="small" color="#395CC6" />
      </View>
    );
  }

  if (pendingTasks.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t(tokens.dashboard.tasks)}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t(tokens.dashboard.noTasks)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t(tokens.dashboard.tasks)}</Text>
        <TouchableOpacity onPress={() => onNavigate && onNavigate('task')}>
          <Text style={styles.viewAll}>{t(tokens.dashboard.viewAll)}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {pendingTasks.map((task, index) => {
          const statusStyle = getStatusStyles(task.status);
          return (
            <TouchableOpacity 
              key={`task-${task.id || index}-${index}`} 
              style={[styles.card, task.status === 'Blocked' && { opacity: 0.6 }]}
              onPress={() => handleTaskPress(task)}
              disabled={task.status === 'Blocked'}
              activeOpacity={0.7}
            >
              <View style={styles.contentContainer}>
                <View style={styles.leftContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{task.title}</Text>
                    <PriorityIcon priority={task.priority} />
                  </View>
                  <Text style={styles.description} numberOfLines={1} ellipsizeMode="tail">
                    {task.description || t(tokens.messages.noDescription)}
                  </Text>
                </View>

                <View style={styles.rightContent}>
                  <Text style={styles.dueLabel}>{t(tokens.dashboard.dueDate)}</Text>
                  <Text style={[styles.dueValue, task.isUrgent && { color: '#E74C3C' }]}>
                    {task.dueDate}
                  </Text>
                </View>
              </View>

              <View style={[styles.statusBar, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.statusText, { color: statusStyle.color }]}>
                  {task.status === 'Pending' ? t(tokens.actions.pending) : 
                   task.status === 'Completed' ? t(tokens.actions.completed) : 
                   task.status === 'Expired' ? t(tokens.actions.expired) : 
                   task.status === 'Blocked' ? t(tokens.actions.blocked || 'Blocked') : 
                   task.status === 'In Progress' ? t(tokens.actions.inProgress || 'In Progress') : 
                   task.status}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TaskDetailsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        task={selectedTask}
        onComplete={async () => {
          if (selectedTask) {
            const result = await completeTask(selectedTask.id);
            if (result.success) {
              // Add a 2-second delay before closing to allow success toast to be seen
              setTimeout(() => {
                setSheetVisible(false);
              }, 2000);
            }
          }
        }}
        onAction={handleTaskAction}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    // marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1F24',
  },
  viewAll: {
    fontSize: 12,
    color: '#395CC6',
    fontWeight: '500',
  },
  scrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  card: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EFF0F3',
    overflow: 'hidden', // Needed for the bottom status bar to respect rounded corners
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    gap: 12,
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    alignItems: 'flex-start', // Align to start or end depending on preference, image shows standard left align in column
    justifyContent: 'flex-start',
    minWidth: 70,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  priorityIcon: {
    width: 16,
    height: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
  },
  description: {
    fontSize: 11,
    color: '#1E1F24', // Grey-5 from SCSS
    fontWeight: '400',
    lineHeight: 16,
  },
  dueLabel: {
    fontSize: 11, // Match detailLabel from RequestSection
    color: '#1E1F24',
    fontWeight: '400',
    marginBottom: 2,
  },
  dueValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7F8C8D', // Default neutral grey
  },
  center: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9F9',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#D7DBDD',
  },
  emptyText: {
    color: '#7F8C8D',
    fontSize: 14,
  },
  statusBar: {
    width: '100%',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
