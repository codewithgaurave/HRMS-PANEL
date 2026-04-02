import { useState, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import assetCategoryAPI from "../apis/assetCategoryAPI";
import CreateAssetCategoryModal from "./modals/CreateAssetCategoryModal";
import UpdateAssetCategoryModal from "./modals/UpdateAssetCategoryModal";
import { Eye, EyeOff, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { calculatePageNumbers } from "../utils/paginationHelpers";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const AssetCategories = () => {
  const { themeColors } = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 10,
  });

  const debouncedSearch = useDebounce(filters.search, 500);
  const [isSearching, setIsSearching] = useState(false);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchCategories = useCallback(async () => {
    try {
      setIsSearching(true);
      setError(null);
      const { data } = await assetCategoryAPI.getAll({ ...filters, search: debouncedSearch });
      setCategories(data.categories || []);
      setPagination(data.pagination || {});
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error fetching asset categories");
    } finally {
      setIsSearching(false);
    }
  }, [debouncedSearch, filters.status, filters.sortBy, filters.sortOrder, filters.page, filters.limit]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (field) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "desc" ? "asc" : "desc",
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleToggleStatus = async (id) => {
    try {
      const category = categories.find((c) => c._id === id);
      if (!category) return;
      const newStatus = category.status === "Active" ? "Inactive" : "Active";
      await assetCategoryAPI.update(id, { ...category, status: newStatus });
      setCategories(categories.map((c) => (c._id === id ? { ...c, status: newStatus } : c)));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error updating status");
    }
  };

  const handleDelete = async (id) => {
    const category = categories.find((c) => c._id === id);
    if (!category) return;
    if (!window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) return;
    try {
      await assetCategoryAPI.delete(id);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error deleting category");
    }
  };

  const handleCategoryCreated = () => {
    setShowCreateModal(false);
    fetchCategories();
  };

  const handleCategoryUpdated = () => {
    setShowUpdateModal(false);
    setSelectedCategory(null);
    fetchCategories();
  };

  const startEditing = (category) => {
    setSelectedCategory(category);
    setShowUpdateModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatCreatedByName = (createdBy) => {
    if (!createdBy) return "N/A";
    return `${createdBy.name?.first} ${createdBy.name?.last}`;
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "", sortBy: "createdAt", sortOrder: "desc", page: 1, limit: 10 });
  };

  const getSortIcon = (field) => {
    if (filters.sortBy !== field) return <ArrowUpDown size={14} />;
    return filters.sortOrder === "asc" ? "↑" : "↓";
  };

  const categoryStats = useMemo(() => ({
    active: categories.filter((c) => c.status === "Active").length,
    inactive: categories.filter((c) => c.status === "Inactive").length,
  }), [categories]);

  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        const { data } = await assetCategoryAPI.getAll({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" });
        setCategories(data.categories || []);
        setPagination(data.pagination || {});
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Error fetching asset categories");
      } finally {
        setLoading(false);
      }
    };
    initialLoad();
  }, []);

  useEffect(() => {
    if (!loading) fetchCategories();
  }, [fetchCategories, loading]);

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: themeColors.text }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: themeColors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4" style={{ color: themeColors.text }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Categories Management</h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            Manage asset categories for your organization
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-lg border font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
          >
            Clear Filters
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: themeColors.primary }}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg border" style={{ backgroundColor: themeColors.danger + "20", borderColor: themeColors.danger, color: themeColors.danger }}>
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-sm font-medium">Dismiss</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.primary }}>{pagination.totalCount}</div>
          <div className="text-sm">Total Categories</div>
        </div>
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.success }}>{categoryStats.active}</div>
          <div className="text-sm">Active Categories</div>
        </div>
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.warning }}>{categoryStats.inactive}</div>
          <div className="text-sm">Inactive Categories</div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 rounded-lg shadow-sm" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
        <h2 className="text-lg font-semibold mb-4">Filters & Search</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full p-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 pr-8"
                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              />
              {isSearching && (
                <div className="absolute right-2 top-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: themeColors.primary }}></div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full p-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full p-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="createdAt">Created Date</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Items Per Page</label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange("limit", parseInt(e.target.value))}
              className="w-full p-2 rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6 rounded-lg shadow-sm overflow-x-auto" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Asset Categories List</h2>
          <div className="text-sm" style={{ color: themeColors.textSecondary }}>
            Showing {categories.length} of {pagination.totalCount} categories
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12" style={{ color: themeColors.textSecondary }}>
            <p className="text-lg mb-2">No asset categories found</p>
            <p className="text-sm mb-4">Get started by creating your first asset category.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: themeColors.primary }}
            >
              Create Category
            </button>
          </div>
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ backgroundColor: themeColors.background }}>
                  <th className="p-3 text-left border-b text-sm font-medium cursor-pointer" style={{ borderColor: themeColors.border }} onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">Category Name <span className="text-xs">{getSortIcon("name")}</span></div>
                  </th>
                  <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Description</th>
                  <th className="p-3 text-left border-b text-sm font-medium cursor-pointer" style={{ borderColor: themeColors.border }} onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">Status <span className="text-xs">{getSortIcon("status")}</span></div>
                  </th>
                  <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Created By</th>
                  <th className="p-3 text-left border-b text-sm font-medium cursor-pointer" style={{ borderColor: themeColors.border }} onClick={() => handleSort("createdAt")}>
                    <div className="flex items-center gap-1">Created Date <span className="text-xs">{getSortIcon("createdAt")}</span></div>
                  </th>
                  <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id} className="border-b transition-colors hover:opacity-90" style={{ borderColor: themeColors.border }}>
                    <td className="p-3 text-sm font-medium">{category.name}</td>
                    <td className="p-3 text-sm">
                      <div className="max-w-xs truncate" title={category.description}>{category.description || "No description"}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${category.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {category.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      <div>
                        <div className="font-medium">{formatCreatedByName(category.createdBy)}</div>
                        <div className="text-xs" style={{ color: themeColors.textSecondary }}>{category.createdBy?.employeeId || "N/A"}</div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{formatDate(category.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(category)}
                          className="p-2 rounded text-white transition-colors hover:opacity-90 cursor-pointer flex items-center gap-1"
                          style={{ backgroundColor: themeColors.primary }}
                          title="Edit Category"
                        >
                          <Edit size={14} />
                          <span className="text-xs">Edit</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(category._id)}
                          className="p-2 rounded text-white transition-colors hover:opacity-90 cursor-pointer flex items-center gap-1"
                          style={{ backgroundColor: category.status === "Active" ? themeColors.warning : themeColors.success }}
                          title={category.status === "Active" ? "Deactivate" : "Activate"}
                        >
                          {category.status === "Active" ? <EyeOff size={14} /> : <Eye size={14} />}
                          <span className="text-xs">{category.status === "Active" ? "Deactivate" : "Activate"}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(category._id)}
                          className="p-2 rounded text-white transition-colors hover:opacity-90 cursor-pointer flex items-center gap-1"
                          style={{ backgroundColor: themeColors.danger }}
                          title="Delete Category"
                        >
                          <Trash2 size={14} />
                          <span className="text-xs">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t" style={{ borderColor: themeColors.border }}>
                <div className="text-sm" style={{ color: themeColors.textSecondary }}>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:opacity-90"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {calculatePageNumbers(pagination.currentPage, pagination.totalPages).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded text-sm transition-colors hover:opacity-90 ${pagination.currentPage === pageNum ? "text-white" : ""}`}
                      style={{
                        backgroundColor: pagination.currentPage === pageNum ? themeColors.primary : themeColors.background,
                        border: `1px solid ${themeColors.border}`,
                        color: pagination.currentPage === pageNum ? "white" : themeColors.text,
                      }}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:opacity-90"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CreateAssetCategoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCategoryCreated={handleCategoryCreated}
      />
      <UpdateAssetCategoryModal
        isOpen={showUpdateModal}
        onClose={() => { setShowUpdateModal(false); setSelectedCategory(null); }}
        category={selectedCategory}
        onCategoryUpdated={handleCategoryUpdated}
      />
    </div>
  );
};

export default AssetCategories;
