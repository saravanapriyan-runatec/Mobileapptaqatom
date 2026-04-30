import React, { createContext, useState, useContext } from 'react';
import ProfileServices from '../../Services/API/ProfileServices';
import { useTranslation } from 'react-i18next';
import tokens from '../../locales/tokens';
import Toast from 'react-native-toast-message';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ProfileServices.getAssignedTasks();
      console.log('DEBUG [TaskContext]: Raw getAssignedTasks response:', JSON.stringify(response, null, 2));
      // The API returns "tasks" as the array key
      const taskList = response?.tasks || response?.results || [];
      
      // Map API response to UI expected format
      const mappedTasks = taskList.map(task => {
        console.log(`Task API Item: ID=${task.id}, Module=${task.module_name}, Name=${task.task_name}`);
        return {
          id: task.id?.toString(),
          title: task.task_name || 'No Title',
          description: task.description || '',
          createdDate: task.created_at ? new Date(task.created_at).toLocaleDateString('en-GB') : '',
          dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB') : '',
          associatedEmployee: task.related_employee_details?.employee_name || task.assignee_details?.employee_name || 'N/A',
          department: task.related_employee_details?.department_name || '',
          status: task.status === 'OPEN' ? 'Pending' : 
                  task.status === 'COMPLETED' ? 'Completed' : 
                  task.status === 'BLOCKED' ? 'Blocked' :
                  task.status === 'IN_PROGRESS' ? 'In Progress' :
                  'Expired',
          isUrgent: task.priority === 'HIGH',
          priority: task.priority?.toLowerCase() || 'medium',
          moduleName: task.module_name,
          taskName: task.task_name,
          taskType: task.task_type,
          assets: (task.asset_details_list || []).map(asset => ({
            id: asset.id?.toString(),
            name: asset.asset_name,
            code: asset.asset_code,
            serial: asset.serial_number,
            status: asset.status === 'OPEN' ? 'PENDING' : 
                    asset.status === 'IN_PROGRESS' ? 'INPROGRESS' : 
                    asset.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
            condition: asset.condition
          })),
          comments: task.comments || [],
          attachment_presigned_url: task.attachment_presigned_url || [],
          attachment_url: task.attachment_url || []
        };
      });

      // console.log('Mapped Task List Count:', mappedTasks.length);
      setTasks(mappedTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err);
      Toast.show({
        type: 'error',
        text1: t(tokens.messages.error || 'Error'),
        text2: t(tokens.messages.fetchFailed || 'Failed to fetch tasks')
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = (newTask) => {
    // Note: Usually handled by API, but keeping for local state consistency if needed
    setTasks(prev => [{ ...newTask, id: Date.now().toString(), status: 'Pending', priority: newTask.priority || 'medium' }, ...prev]);
  };

  const getErrorMessage = (err, defaultMsg) => {
    if (typeof err === 'string') return err;
    if (err?.errors?.[0]?.message) return err.errors[0].message;
    if (err?.errorResponse?.errors?.[0]?.message) return err.errorResponse.errors[0].message;
    if (err?.message) return err.message;
    return defaultMsg;
  };

  const updateTaskStatus = async (id, status) => {
    try {
      const apiStatus = status === 'Completed' ? 'COMPLETED' : status;
      await ProfileServices.updateTaskStatus(id, apiStatus);
      
      await fetchTasks();
      
      Toast.show({
        type: 'success',
        text1: t(tokens.messages.statusUpdated || 'Success'),
        text2: t(tokens.messages.taskUpdatedSuccessfully || 'Task status updated successfully')
      });

      return { success: true };
    } catch (err) {
      console.error('Error updating task status:', err);
      const errorMsg = getErrorMessage(err, t(tokens.messages.updateFailed || 'Failed to update task status'));
      Toast.show({
        type: 'error',
        text1: t(tokens.messages.error || 'Error'),
        text2: errorMsg
      });
      return { success: false, error: err };
    }
  };

  const updateAssetTaskStatus = async (id, status) => {
    try {
      const apiStatus = status === 'Completed' ? 'COMPLETED' : status;
      await ProfileServices.updateAssetTaskStatus(id, apiStatus);
      
      await fetchTasks();
      
      Toast.show({
        type: 'success',
        text1: t(tokens.messages.statusUpdated || 'Success'),
        text2: t(tokens.messages.taskUpdatedSuccessfully || 'Task status updated successfully')
      });

      return { success: true };
    } catch (err) {
      console.error('Error updating asset task status:', err);
      const errorMsg = getErrorMessage(err, t(tokens.messages.updateFailed || 'Failed to update task status'));
      Toast.show({
        type: 'error',
        text1: t(tokens.messages.error || 'Error'),
        text2: errorMsg
      });
      return { success: false, error: err };
    }
  };

  const updateAssetStatus = async (taskId, assetId, status, condition, description, files, deduction_amount, reason) => {
    try {
      // console.log(`Local update for Asset ID: ${assetId} to: ${status}`);
      
      setTasks(prev => prev.map(t => {
        if (t.id === taskId?.toString()) {
          const updatedAssets = t.assets.map(a => {
            if (a.id === assetId?.toString()) {
              return { 
                ...a, 
                status: status, // "Received" or "Not Received"
                condition,
                description,
                files,
                deduction_amount,
                reason,
                isLocallyUpdated: true 
              };
            }
            return a;
          });
          return { ...t, assets: updatedAssets };
        }
        return t;
      }));
      
      return { success: true };
    } catch (err) {
      console.error('Error in local updateAssetStatus:', err);
      return { success: false, error: err };
    }
  };

  const fetchTaskDetails = async (taskId, task) => {
    try {
      const title = (task?.title || '').toLowerCase();
      const moduleName = (task?.moduleName || '').toUpperCase();
      const taskName = (task?.taskName || '').toUpperCase();

      // Concurrently fetch generic task details to get the latest comments/attachments
      // specialized APIs often return only module-specific fields.
      const genericPromise = ProfileServices.getTaskRetrieve(taskId);
      let specializedPromise;

      if (taskName === 'KT' || 
          taskName === 'SYSTEM ACCESS' || 
          taskName === 'VACATION SETTLEMENT' || 
          title.includes('system access') || 
          title.includes('vacation settlement')) {
        specializedPromise = genericPromise;
      } else if (taskName === 'FLIGHT TICKET' || title.includes('flight ticket') || task?.taskType === 'FLIGHT_TICKET') {
        specializedPromise = ProfileServices.getFlightTicketInfo(taskId);
      } else if (taskName === 'LOAN' || title.includes('loan')) {
        specializedPromise = ProfileServices.getLoanDeductionDetails(taskId);
      } else if (taskName === 'FINAL SETTLEMENT' || title.includes('final settlement')) {
        specializedPromise = ProfileServices.getFinalSettlementDetails(taskId);
      } else {
        specializedPromise = ProfileServices.getTaskAssets(taskId);
      }

      // Wait for both results
      const [genericResponse, specializedResponse] = await Promise.all([
        genericPromise.catch(() => ({})), // Fallback if regular retrieve fails
        specializedPromise.catch(() => ({}))
      ]);

      // Merge results: specialized info takes precedence, but we keep core task fields
      const response = {
        ...genericResponse,
        ...specializedResponse,
        // Ensure core activity/attachments from generic task are always prioritized
        comments: genericResponse?.comments || specializedResponse?.comments || [],
        attachment_presigned_url: genericResponse?.attachment_presigned_url || specializedResponse?.attachment_presigned_url || [],
        attachment_url: genericResponse?.attachment_url || specializedResponse?.attachment_url || []
      };

      console.log(`Task Details API Merged Response (ID: ${taskId}, Module: ${moduleName}):`, JSON.stringify(response, null, 2));
      
      // Map assets if they exist in the response
      const assetList = response?.asset_tasks || response?.asset_details_list || [];
      const assets = assetList.map(asset => ({
        id: asset.id?.toString(),
        name: asset.asset_item_name || asset.asset_name || asset.task_name,
        code: asset.asset_code,
        serial: asset.serial_number,
        status: asset.status === 'OPEN' ? 'PENDING' : 
                asset.status === 'IN_PROGRESS' ? 'INPROGRESS' : 
                asset.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
        condition: asset.condition,
        deduction_amount: asset.deduction_amount?.toString() || '',
        reason: asset.reason || ''
      }));

      // Update the task with fresh details
      setTasks(prev => prev.map(t => {
        if (t.id === taskId?.toString()) {
          return { 
            ...t, 
            assets: assets.length > 0 ? assets : t.assets,
            reporter: response?.parent_tasks_data?.reporter || response?.reporter || t.reporter,
            currentAssignee: response?.assignee_details?.employee_name || response?.current_assignee_details?.employee_name || t.currentAssignee,
            comments: response?.comments || t.comments || [],
            attachment_presigned_url: response?.attachment_presigned_url || t.attachment_presigned_url || [],
            attachment_url: response?.attachment_url || t.attachment_url || [],
            details: response // Store the full response for type-specific rendering
          };
        }
        return t;
      }));
      
      return response;
    } catch (err) {
      console.error('Error fetching task details:', err);
      Toast.show({
        type: 'error',
        text1: t(tokens.messages.error || 'Error'),
        text2: t(tokens.messages.detailsFetchFailed || 'Failed to fetch task details')
      });
      return null;
    }
  };
  const completeTask = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId?.toString());
      if (!task) return { success: false, error: 'Task not found' };

      setLoading(true);

      // 1. Sync any locally updated assets to the server first
      const locallyUpdatedAssets = task.assets?.filter(a => a.isLocallyUpdated) || [];
      if (locallyUpdatedAssets.length > 0) {
        await Promise.all(locallyUpdatedAssets.map(a => {
          // Map internal status to API status for sub-tasks (Asset Assets)
          const apiStatus = a.status === 'PENDING' ? 'OPEN' : 
                           a.status === 'INPROGRESS' ? 'IN_PROGRESS' : 
                           a.status === 'COMPLETED' ? 'COMPLETED' : a.status;
          return ProfileServices.updateAssetStatusData(a.id, apiStatus);
        }));
      }

      // 2. Complete the main Parent Task (e.g. ID 27)
      // We ALWAYS use updateTaskStatus for the parent task, matching the /workflow/tasks/ endpoint
      const result = await updateTaskStatus(taskId, 'Completed');
      return result;
    } catch (err) {
      console.error('Error in completeTask:', err);
      const errorMsg = getErrorMessage(err, t(tokens.messages.updateFailed || 'Failed to complete task'));
      Toast.show({
        type: 'error',
        text1: t(tokens.messages.error || 'Error'),
        text2: errorMsg
      });
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      loading, 
      error, 
      fetchTasks, 
      addTask, 
      updateTaskStatus, 
      updateAssetTaskStatus,
      updateAssetStatus,
      fetchTaskDetails,
      completeTask 
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
