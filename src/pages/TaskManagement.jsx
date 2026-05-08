import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TaskDashboard from '../components/tasks/TaskDashboard';
import TaskList from '../components/tasks/TaskList';
import CreateTask from '../components/tasks/CreateTask';
import TaskTypeManager from '../components/tasks/TaskTypeManager';
import { taskTypeAPI } from '../apis/taskAPI';
import { toast } from 'sonner';
import { LayoutDashboard, ListTodo, User, Plus, Tag, X, AlertCircle } from 'lucide-react';

const CreateTaskTypeModal = ({ open, onClose, onCreated }) => {
  const { themeColors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setLoading(true);
      setError('');
      await taskTypeAPI.create({ name: name.trim(), description: description.trim() });
      toast.success('Task type created successfully');
      setName('');
      setDescription('');
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task type');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="rounded-xl shadow-lg w-full max-w-sm"
        style={{ backgroundColor: themeColors.surface }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: themeColors.border }}>
          <h2 className="text-lg font-semibold" style={{ color: themeColors.text }}>Create Task Type</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:opacity-80" style={{ backgroundColor: themeColors.background, color: themeColors.text }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && (
            <div className="p-3 rounded-lg border flex items-center gap-2 text-sm"
              style={{ backgroundColor: themeColors.danger + '20', borderColor: themeColors.danger, color: themeColors.danger }}>
              <AlertCircle size={15} />{error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: themeColors.text }}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Bug Fix, Feature, Review..."
              required
              className="w-full p-2.5 rounded-lg border text-sm focus:outline-none"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: themeColors.text }}>Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description..."
              className="w-full p-2.5 rounded-lg border text-sm focus:outline-none"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border text-sm font-medium hover:opacity-80"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: themeColors.primary }}>
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Plus size={15} />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const TaskManagement = () => {
  const { user } = useAuth();
  const { themeColors } = useTheme();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTypeOpen, setCreateTypeOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [typeRefreshTrigger, setTypeRefreshTrigger] = useState(0);

  const isManager = user?.role === 'HR_Manager' || user?.role === 'Team_Leader';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(isManager ? [{ id: 'all', label: 'All Tasks', icon: ListTodo }] : []),
    { id: 'my', label: 'My Tasks', icon: User },
    ...(isManager ? [{ id: 'task-types', label: 'Task Types', icon: Tag }] : []),
  ];

  const handleTaskCreated = () => {
    setCreateDialogOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTypeCreated = () => {
    setTypeRefreshTrigger(prev => prev + 1);
  };

  const getTabStyle = (tabId) => {
    const isActive = currentTab === tabId;
    return {
      backgroundColor: isActive ? themeColors.primary : 'transparent',
      color: isActive ? 'white' : themeColors.text,
      borderColor: isActive ? themeColors.primary : themeColors.border,
    };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeColors.background }}>
      <div className="border-b" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: themeColors.text }}>Task Management</h1>
              <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>Manage and track team tasks efficiently</p>
            </div>

            {isManager && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCreateTypeOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 border"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                >
                  <Tag size={16} />
                  Add Task Type
                </button>
                <button
                  onClick={() => setCreateDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
                  style={{ backgroundColor: themeColors.primary, color: 'white' }}
                >
                  <Plus size={18} />
                  Create Task
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-6 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                  style={getTabStyle(tab.id)}
                >
                  <IconComponent size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {currentTab === 'dashboard' && <TaskDashboard />}
        {currentTab === 'all' && <TaskList isManager={isManager} refresh={refreshTrigger} />}
        {currentTab === 'my' && <TaskList isManager={false} refresh={refreshTrigger} />}
        {currentTab === 'task-types' && <TaskTypeManager refresh={typeRefreshTrigger} />}
      </div>

      {isManager && (
        <CreateTask
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}

      {isManager && (
        <CreateTaskTypeModal
          open={createTypeOpen}
          onClose={() => setCreateTypeOpen(false)}
          onCreated={handleTypeCreated}
        />
      )}
    </div>
  );
};

export default TaskManagement;
