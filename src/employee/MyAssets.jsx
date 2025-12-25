import { useState, useEffect } from 'react';
import { assetAPI } from '../apis/assetAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const MyAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    console.log('MyAssets useEffect - user:', user);
    if (user && (user._id || user.id)) {
      fetchMyAssets();
    } else {
      console.log('No user data, setting loading to false');
      setLoading(false);
    }
  }, [user]);

  const fetchMyAssets = async () => {
    try {
      console.log('fetchMyAssets called');
      console.log('User object:', user);
      
      if (!user || (!user._id && !user.id)) {
        console.log('No user or user ID available');
        setLoading(false);
        return;
      }

      const userId = user._id || user.id;
      console.log('Fetching assets for user ID:', userId);
      const response = await assetAPI.getByEmployee(userId);
      console.log('Full API response:', response);
      
      if (response && response.data) {
        const assetsData = response.data.assets || [];
        console.log('Extracted assets data:', assetsData);
        setAssets(assetsData);
      } else {
        console.log('No response.data found');
        setAssets([]);
      }
    } catch (error) {
      console.error('Fetch assets error:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to fetch assets: ' + (error.message || 'Unknown error'));
      setAssets([]);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-lg">Loading assets...</div>
          <div className="text-sm text-gray-500 mt-2">User: {user ? (user._id || user.id) : 'No user'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Assets</h1>
        <div className="text-sm text-gray-600">
          Total Assets: {assets.length}
        </div>
      </div>

      {assets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">💻</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Assets Assigned</h3>
          <p className="text-gray-500">You don't have any assets assigned to you yet.</p>
          <div className="mt-4 text-xs text-gray-400">
            User ID: {user?._id || user?.id || 'Not available'}
          </div>
          <button 
            onClick={fetchMyAssets}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <div key={asset._id} className="bg-white rounded-lg shadow border hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{asset.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    asset.status === 'Assigned' ? 'bg-green-100 text-green-800' :
                    asset.status === 'Available' ? 'bg-blue-100 text-blue-800' :
                    asset.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {asset.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Asset ID:</span>
                    <span className="font-medium">{asset.assetId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span>{asset.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Serial Number:</span>
                    <span>{asset.serialNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Assigned Date:</span>
                    <span>{asset.assignedTo?.[0]?.assignedDate ? new Date(asset.assignedTo[0].assignedDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  {asset.description && (
                    <div className="mt-3">
                      <span className="text-gray-600 block mb-1">Description:</span>
                      <p className="text-gray-800 text-xs">{asset.description}</p>
                    </div>
                  )}
                </div>

                {asset.condition && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Condition:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        asset.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                        asset.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                        asset.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {asset.condition}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Summary */}
      {assets.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Asset Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {assets.filter(a => a.status === 'Assigned').length}
              </div>
              <div className="text-sm text-gray-600">Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {assets.filter(a => a.status === 'Maintenance').length}
              </div>
              <div className="text-sm text-gray-600">Maintenance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {assets.filter(a => a.status === 'Available').length}
              </div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {assets.length}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAssets;