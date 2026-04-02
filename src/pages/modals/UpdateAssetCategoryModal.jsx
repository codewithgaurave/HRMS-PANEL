import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import assetCategoryAPI from "../../apis/assetCategoryAPI";
import { X } from "lucide-react";

const UpdateAssetCategoryModal = ({ isOpen, onClose, category, onCategoryUpdated }) => {
  const { themeColors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ name: "", description: "", status: "Active" });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        status: category.status || "Active",
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setError("Category name is required");

    try {
      setLoading(true);
      setError("");
      const { data } = await assetCategoryAPI.update(category._id, formData);
      onCategoryUpdated(data.category);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error updating category");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", description: "", status: "Active" });
    setError("");
    onClose();
  };

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-lg shadow-xl w-full max-w-md"
        style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}
      >
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: themeColors.border }}>
          <h2 className="text-xl font-semibold" style={{ color: themeColors.text }}>Update Asset Category</h2>
          <button onClick={handleClose} className="p-1 rounded-full transition-colors hover:opacity-70" style={{ color: themeColors.text }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: themeColors.danger + "20", color: themeColors.danger }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>Category Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter category name"
              className="w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter category description"
              rows="3"
              className="w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 rounded-lg border font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: themeColors.primary }}
            >
              {loading ? "Updating..." : "Update Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateAssetCategoryModal;
