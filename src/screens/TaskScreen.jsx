import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ScrollView, Dimensions, Platform, StatusBar, RefreshControl } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTasks } from '../context/TaskContext';
import { HighPriorityIcon, MediumPriorityIcon, LowPriorityIcon } from '../components/icons/PriorityIcons';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import EmptyState from '../components/common/EmptyState';
import StaggeredEntrance from '../components/common/StaggeredEntrance';
import TaskDetailsSheet from '../components/home/TaskDetailsSheet';

const { height } = Dimensions.get('window');

const PriorityIcon = ({ priority }) => {
  switch (priority) {
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

const TaskCard = ({ task, onPress }) => {
  const { t } = useTranslation();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#F39C12';
      case 'Completed': return '#2ECC40';
      case 'Expired': return '#E74C3C';
      case 'Blocked': return '#E74C3C';
      case 'In Progress': return '#3498DB';
      default: return '#62636C';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'Pending': return 'rgba(243, 156, 18, 0.1)';
      case 'Completed': return 'rgba(46, 204, 64, 0.1)';
      case 'Expired': return 'rgba(231, 76, 60, 0.1)';
      case 'Blocked': return 'rgba(231, 76, 60, 0.1)';
      case 'In Progress': return 'rgba(52, 152, 219, 0.1)';
      default: return 'rgba(98, 99, 108, 0.1)';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, task.status === 'Blocked' && { opacity: 0.6 }]} 
      onPress={onPress} 
      disabled={task.status === 'Blocked'}
    >
      <View style={styles.cardBody}>
        <View style={styles.contentSection}>
          {/* Header: Title + Icon */}
          <View style={styles.headerRow}>
            <Text style={styles.cardTitle}>{task.title}</Text>
            {/* Priority Icon */}
            <View style={{ marginLeft: 6 }}>
               <PriorityIcon priority={task.priority} />
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description} numberOfLines={1}>
            {task.description}
          </Text>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.dateItem}>
              <Text style={styles.detailLabel} numberOfLines={1}>{t(tokens.tasks.createdDate)}</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{task.createdDate}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.detailLabel} numberOfLines={1}>{t(tokens.tasks.dueDate)}</Text>
              <Text style={[
                styles.detailValue, 
                (task.status === 'Pending' || task.status === 'Expired') && task.isUrgent ? { color: '#E74C3C' } : {}
              ]} numberOfLines={1}>
                {task.dueDate}
              </Text>
            </View>
            <View style={styles.employeeItem}>
              <Text style={styles.detailLabel} numberOfLines={1}>{t(tokens.tasks.associatedEmployee)}</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{task.associatedEmployee}</Text>
            </View>
          </View>
        </View>

        {/* Chevron Container - Absolute Positioned */}
        <View style={styles.rightSection}>
          <View style={styles.verticalDivider} />
          <Ionicons name="chevron-forward" size={20} color="#DEDFE4" />
        </View>
      </View>

      {/* Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: getStatusBg(task.status) }]}>
        <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
          {task.status === 'Pending' ? t(tokens.tasks.pending) : 
           task.status === 'Completed' ? t(tokens.tasks.completed) : 
           task.status === 'Expired' ? t(tokens.tasks.expired) : 
           task.status === 'Blocked' ? t(tokens.tasks.blocked) : 
           task.status === 'In Progress' ? t(tokens.tasks.inProgress) : 
           task.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const TaskScreen = ({ onBack }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { tasks, updateAssetStatus, updateTaskStatus, fetchTaskDetails, completeTask, fetchTasks } = useTasks();
  const [activeTab, setActiveTab] = useState('Pending');
  const [refreshing, setRefreshing] = useState(false);

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const paddingTop = insets.top;

  const filteredTasks = tasks.filter(task => task.status === activeTab);
  const selectedTask = tasks.find(t => String(t.id) === String(selectedTaskId)) || null;

  const handleTaskPress = (task) => {
    setSelectedTaskId(task.id);
    if (task.id) {
      fetchTaskDetails(task.id, task);
    }
  };

  const handleTaskAction = (action, payload) => {
    // action: 'viewAsset' is now handled inline or ignored if no modal needed
  };

  const handleCompleteTask = async () => {
    if (selectedTaskId) {
        const result = await completeTask(selectedTaskId);
        if (result.success) {
            // Add a 2-second delay before closing to allow success toast to be seen
            setTimeout(() => {
                setSelectedTaskId(null);
                setActiveTab('Completed');
            }, 2000);
        }
    }
  };
 
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  }, []);


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      

      <TaskDetailsSheet 
        visible={!!selectedTask}
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onAction={handleTaskAction}
        onComplete={handleCompleteTask}
      />

      <LinearGradient
        colors={['#8EA3E3', '#FFFFFF']}
        locations={[0, 0.3]} 
        style={styles.background}
      />

      {/* Fixed Header and Tabs Area */}
      <View style={{ paddingTop: paddingTop + 24, paddingHorizontal: 16 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleRow}>
              {onBack && (
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#1E1F24" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>{t(tokens.tasks.title)}</Text>
            </View>
          </View>
          
          {/* Tabs moved to a new row to prevent overflow */}
          <View style={styles.tabsWrapper}>
            <View style={styles.tabsContainer}>
              {['Pending', 'Completed', 'Blocked', 'Expired'].map((tab) => (
                <TouchableOpacity 
                  key={tab} 
                  style={[
                    styles.tabItem, 
                    activeTab === tab && styles.activeTabItem
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[
                    styles.tabText, 
                    activeTab === tab && styles.activeTabText
                  ]}>{tab === 'Pending' ? t(tokens.tasks.pending) : 
                      tab === 'Completed' ? t(tokens.tasks.completed) : 
                      tab === 'Blocked' ? t(tokens.tasks.blocked) : 
                      t(tokens.tasks.expired)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Scrollable List container */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={filteredTasks}
          keyExtractor={(task, index) => `task-${task.id || index}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContainer, { paddingHorizontal: 16, paddingBottom: 100 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4169E1" />
          }
          ListEmptyComponent={
            <EmptyState 
              title={t(tokens.tasks.noTasksFound)}
              description={t(tokens.common.allCaughtUp)}
            />
          }
          renderItem={({ item: task, index }) => (
            <StaggeredEntrance index={index}>
              <TaskCard 
                task={task} 
                onPress={() => handleTaskPress(task)} 
              />
            </StaggeredEntrance>
          )}
        />
      </View>
    </View>
  );
};

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
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Extra padding for bottom nav
  },
  header: {
    marginBottom: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E1F24',
  },
  tabsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', 
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    flex: 1, // Let it take full width of wrapper
    justifyContent: 'space-between',
  },
  tabItem: {
    flex: 1, // Distribute tabs equally
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTabItem: {
    backgroundColor: '#4169E1',
  },
  tabText: {
    fontSize: 12,
    color: '#62636C',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContainer: {
    gap: 16, // Matches RegularizationScreen list gap
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Matches RegularizationScreen
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFF0F3',
  },
  cardBody: {
    position: 'relative',
    flexDirection: 'row', // Ensures content takes width correctly
  },
  contentSection: {
    flex: 1,
    padding: 16,
    paddingRight: 48, // Space for the absolute positioned icon
  },
  rightSection: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalDivider: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#EFF0F3',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1F24',
  },
  description: {
    fontSize: 12,
    color: '#62636C',
    fontWeight: '400',
    marginBottom: 12,
    lineHeight: 18,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateItem: {
    flexShrink: 0, // Prevent shrinking to keep dates on one line
  },
  employeeItem: {
    flex: 1, // Take remaining space
    minWidth: 0, // Allow shrinking past content size
  },
  detailLabel: {
    fontSize: 11, // Matches Attendance card labels
    color: '#9E9E9E',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E1F24',
  },
  statusBar: {
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9E9E9E',
    fontSize: 14,
  }
});

export default TaskScreen;
