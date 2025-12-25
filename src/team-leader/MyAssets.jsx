import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { Package, Laptop, Monitor, Smartphone, Headphones } from "lucide-react";
import assetAPI from "../apis/assetAPI";
import { useAuth } from "../context/AuthContext";

const MyAssets = () => {
  const { themeColors } = useTheme();
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAssets();
  }, []);

  const fetchMyAssets = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const { data } = await assetAPI.getByEmployee(user.id);
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      // Use mock data if API fails
      setAssets([
        {
          id: 1,
          name: "MacBook Pro 16-inch",
          category: "Laptop",
          assetId: "LAP001",
          assignedDate: "2024-01-15",
          status: "Active",
          condition: "Good"
        },
        {
          id: 2,
          name: "Dell UltraSharp Monitor",
          category: "Monitor",
          assetId: "MON001",
          assignedDate: "2024-01-15",
          status: "Active",
          condition: "Excellent"
        },
        {
          id: 3,
          name: "iPhone 14 Pro",
          category: "Mobile",
          assetId: "MOB001",
          assignedDate: "2024-01-10",
          status: "Active",
          condition: "Good"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getAssetIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'laptop':
        return <Laptop size={24} />;
      case 'monitor':
        return <Monitor size={24} />;
      case 'mobile':
        return <Smartphone size={24} />;
      case 'headphones':
        return <Headphones size={24} />;
      default:
        return <Package size={24} />;
    }
  };

  const getConditionColor = (condition) => {
    switch (condition.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800';
      case 'poor':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: themeColors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4" style={{ color: themeColors.text }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Assets</h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            View assets assigned to you
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.primary }}>{assets.length}</div>
          <div className="text-sm">Total Assets</div>
        </div>
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.success }}>{assets.filter(a => a.status === 'Active').length}</div>
          <div className="text-sm">Active</div>
        </div>
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.info }}>{assets.filter(a => a.condition === 'Excellent').length}</div>
          <div className="text-sm">Excellent Condition</div>
        </div>
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.warning }}>{new Set(assets.map(a => a.category)).size}</div>
          <div className="text-sm">Categories</div>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <div key={asset.id} className="p-6 rounded-lg shadow-sm" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 rounded-full" style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}>
                {getAssetIcon(asset.category)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{asset.name}</h3>
                <p className="text-sm" style={{ color: themeColors.textSecondary }}>{asset.assetId}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Category:</span>
                <span className="text-sm">{asset.category}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Assigned Date:</span>
                <span className="text-sm">{new Date(asset.assignedDate).toLocaleDateString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${asset.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {asset.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Condition:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${getConditionColor(asset.condition)}`}>
                  {asset.condition}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t" style={{ borderColor: themeColors.border }}>
              <button
                className="w-full px-3 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: themeColors.background, color: themeColors.text, border: `1px solid ${themeColors.border}` }}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {assets.length === 0 && (
        <div className="text-center py-12">
          <Package size={48} style={{ color: themeColors.textSecondary }} className="mx-auto mb-4" />
          <p style={{ color: themeColors.textSecondary }}>No assets assigned to you</p>
        </div>
      )}
    </div>
  );
};

export default MyAssets;