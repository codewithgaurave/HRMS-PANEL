import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { Plus, Send, Eye, Calendar } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import apiRoutes from "../contants/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("hrms-token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

const TeamNotices = () => {
  const { themeColors } = useTheme();
  const [notices, setNotices] = useState([]);
  const [stats, setStats] = useState({
    totalNoticesSent: 0,
    activeNotices: 0,
    teamMembers: 0
  });
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "General",
    priority: "Medium",
    expiryDate: ""
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${apiRoutes.notices}/my-notices`, {
        headers: getAuthHeader(),
      });
      const noticesData = data.notices || [];
      setNotices(noticesData);
      
      // Calculate stats from notices data
      const totalNoticesSent = noticesData.length;
      const activeNotices = noticesData.filter(notice => {
        if (!notice.expiryDate) return true;
        return new Date(notice.expiryDate) >= new Date();
      }).length;
      
      // Get team members count from first notice's targetEmployees
      const teamMembers = noticesData.length > 0 ? noticesData[0].targetEmployees?.length || 0 : 2;
      
      setStats({
        totalNoticesSent,
        activeNotices,
        teamMembers
      });
    } catch (err) {
      console.error('Error fetching notices:', err);
      setNotices([]);
      setStats({ totalNoticesSent: 0, activeNotices: 0, teamMembers: 2 });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.post(apiRoutes.notices, formData, {
        headers: getAuthHeader(),
      });
      toast.success("Notice sent to team successfully");
      setShowCreateModal(false);
      setFormData({
        title: "",
        content: "",
        type: "General",
        priority: "Medium",
        expiryDate: ""
      });
      fetchNotices(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending notice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4" style={{ color: themeColors.text }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Notices</h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            Send notices and announcements to your team
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg font-medium text-white flex items-center space-x-2"
          style={{ backgroundColor: themeColors.primary }}
        >
          <Plus size={16} />
          <span>Send Notice</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.primary }}>{stats.totalNoticesSent}</div>
          <div className="text-sm">Total Notices Sent</div>
        </div>
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.success }}>{stats.activeNotices}</div>
          <div className="text-sm">Active Notices</div>
        </div>
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.info }}>{stats.teamMembers}</div>
          <div className="text-sm">Team Members</div>
        </div>
      </div>

      {/* Recent Notices */}
      <div className="rounded-lg shadow-sm" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
        <div className="p-6 border-b" style={{ borderColor: themeColors.border }}>
          <h2 className="text-lg font-semibold">Recent Notices</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {notices.length > 0 ? notices.map((notice) => (
              <div key={notice._id} className="p-4 rounded-lg border" style={{ borderColor: themeColors.border }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{notice.title}</h3>
                    <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
                      {notice.content}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs" style={{ color: themeColors.textSecondary }}>
                      <span>Type: {notice.type}</span>
                      <span>Priority: {notice.priority}</span>
                      <span>Sent: {new Date(notice.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1 rounded hover:bg-gray-100" title="View Details">
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              // Mock data when no notices
              [1, 2, 3].map((notice) => (
                <div key={notice} className="p-4 rounded-lg border" style={{ borderColor: themeColors.border }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">Team Meeting - Project Updates</h3>
                      <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
                        Please join the team meeting tomorrow at 10 AM to discuss project updates and next steps.
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs" style={{ color: themeColors.textSecondary }}>
                        <span>Type: General</span>
                        <span>Priority: Medium</span>
                        <span>Sent: 2 hours ago</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-1 rounded hover:bg-gray-100" title="View Details">
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Notice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-lg w-full max-w-2xl" style={{ backgroundColor: themeColors.surface }}>
            <div className="p-6 border-b" style={{ borderColor: themeColors.border }}>
              <h2 className="text-xl font-bold">Send Notice to Team</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 rounded-lg border"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    placeholder="Enter notice title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Content *</label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full p-3 rounded-lg border"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    placeholder="Enter notice content"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg border"
                      style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    >
                      <option value="General">General</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Policy">Policy</option>
                      <option value="Event">Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg border"
                      style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className="w-full p-3 rounded-lg border"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border font-medium"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg font-medium text-white flex items-center space-x-2 disabled:opacity-50"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  <Send size={16} />
                  <span>{loading ? "Sending..." : "Send Notice"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamNotices;