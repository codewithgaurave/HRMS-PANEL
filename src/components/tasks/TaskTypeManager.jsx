import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { taskTypeAPI } from '../../apis/taskAPI';
import { Plus, Trash2, Tag, AlertCircle, RefreshCw, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const TaskTypeManager = ({ refresh }) => {
  const { themeColors } = useTheme();
  const [taskTypes, setTaskTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchTaskTypes = async () => {
    try {
      setLoading(true);
      const res = await taskTypeAPI.getAll();
      setTaskTypes(res.data.taskTypes || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch task types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTaskTypes(); }, [refresh]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setAdding(true);
      setError('');
      const res = await taskTypeAPI.create({ name: name.trim(), description: description.trim() });
      setTaskTypes(prev => [res.data.taskType, ...prev]);
      setName('');
      setDescription('');
      toast.success('Task type added successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add task type');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task type?')) return;
    try {
      await taskTypeAPI.delete(id);
      setTaskTypes(prev => prev.filter(t => t._id !== id));
      toast.success('Task type deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task type');
    }
  };

  const startEdit = (type) => {
    setEditingId(type._id);
    setEditName(type.name);
    setEditDescription(type.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  const handleUpdate = async (id) => {
    if (!editName.trim()) return;
    try {
      setEditSaving(true);
      const res = await taskTypeAPI.update(id, { name: editName.trim(), description: editDescription.trim() });
      setTaskTypes(prev => prev.map(t => t._id === id ? res.data.taskType : t));
      cancelEdit();
      toast.success('Task type updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task type');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: themeColors.text }}>Task Types</h2>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            Manage task categories for your team
          </p>
        </div>
        <button
          onClick={fetchTaskTypes}
          className="p-2 rounded-lg border transition-colors hover:opacity-90"
          style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
        >
          <RefreshCw size={16} style={{ color: themeColors.text }} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Add Form */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-xl border h-full" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: themeColors.text }}>Add New Task Type</h3>
            {error && (
              <div className="p-3 rounded-lg border flex items-center gap-2 mb-4 text-sm"
                style={{ backgroundColor: themeColors.danger + '20', borderColor: themeColors.danger, color: themeColors.danger }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: themeColors.text }}>Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Bug Fix, Feature, Review..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full p-3 rounded-lg border text-sm focus:outline-none"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: themeColors.text }}>Description</label>
                <input
                  type="text"
                  placeholder="Short description (optional)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 rounded-lg border text-sm focus:outline-none"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                />
              </div>
              <button
                type="submit"
                disabled={adding || !name.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: themeColors.primary }}
              >
                {adding ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Plus size={16} />}
                Add Task Type
              </button>
            </form>
          </div>
        </div>

        {/* Task Types List */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-xl border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: themeColors.text }}>All Task Types</h3>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
                {taskTypes.length} total
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }} />
              </div>
            ) : taskTypes.length === 0 ? (
              <div className="text-center py-12" style={{ color: themeColors.textSecondary }}>
                <Tag size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium mb-1" style={{ color: themeColors.text }}>No task types yet</p>
                <p className="text-sm">Add your first task type using the form on the left.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {taskTypes.map(type => (
                  <div
                    key={type._id}
                    className="p-4 rounded-lg border transition-all hover:shadow-sm"
                    style={{ backgroundColor: themeColors.background, borderColor: editingId === type._id ? themeColors.primary : themeColors.border }}
                  >
                    {editingId === type._id ? (
                      /* Edit Mode */
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder="Name *"
                          autoFocus
                          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.primary, color: themeColors.text }}
                        />
                        <input
                          type="text"
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          placeholder="Description (optional)"
                          className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
                        />
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleUpdate(type._id)}
                            disabled={editSaving || !editName.trim()}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50 hover:opacity-90"
                            style={{ backgroundColor: themeColors.success }}
                          >
                            {editSaving ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> : <Check size={13} />}
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border hover:opacity-90"
                            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
                          >
                            <X size={13} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: themeColors.primary + '20' }}>
                            <Tag size={15} style={{ color: themeColors.primary }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: themeColors.text }}>{type.name}</p>
                            <p className="text-xs mt-0.5 truncate" style={{ color: themeColors.textSecondary }}>
                              {type.description || 'No description'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => startEdit(type)}
                            className="p-1.5 rounded-lg transition-colors hover:opacity-90"
                            style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(type._id)}
                            className="p-1.5 rounded-lg transition-colors hover:opacity-90"
                            style={{ backgroundColor: themeColors.danger + '20', color: themeColors.danger }}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskTypeManager;
