import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetAPI } from '../apis/assetAPI';
import employeeAPI from '../apis/employeeAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { X, Send, History, Check, RefreshCw } from 'lucide-react';

const MyAssets = () => {
  const [assets, setAssets] = useState([]);
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadAll = async () => {
      if (user && (user._id || user.id)) {
        setLoading(true);
        await Promise.all([fetchMyAssets(), fetchIncomingTransfers()]);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    loadAll();
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchMyAssets(), fetchIncomingTransfers()]);
    setLoading(false);
  };

  const fetchIncomingTransfers = async () => {
    try {
      const response = await assetAPI.getIncomingTransfers();
      setIncomingTransfers(response.data.assets || []);
    } catch (error) {
      console.error('Fetch incoming transfers error:', error);
    }
  };

  const handleAcceptTransfer = async (assetId) => {
    try {
      setProcessingId(assetId);
      await assetAPI.acceptTransfer(assetId);
      toast.success('Asset transfer accepted');
      fetchAllData();
    } catch (error) {
      console.error('Accept error:', error);
      toast.error(error.response?.data?.message || 'Failed to accept transfer');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectTransfer = async (assetId) => {
    if (!window.confirm('Are you sure you want to reject this transfer?')) return;
    try {
      setProcessingId(assetId);
      await assetAPI.rejectTransfer(assetId);
      toast.success('Asset transfer rejected');
      fetchIncomingTransfers();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(error.response?.data?.message || 'Failed to reject transfer');
    } finally {
      setProcessingId(null);
    }
  };

  const fetchMyAssets = async () => {
    try {
      if (!user || (!user._id && !user.id)) return;
      const userId = user._id || user.id;
      const response = await assetAPI.getByEmployee(userId);
      if (response && response.data) {
        const allAssets = response.data.assets || [];
        const activeAssets = allAssets.filter(asset => {
          if (!asset.assignedTo || !Array.isArray(asset.assignedTo)) return false;
          return asset.assignedTo.some(assignment => 
            assignment.isActive && 
            assignment.employee && 
            (assignment.employee._id === userId || assignment.employee.id === userId)
          );
        });
        setAssets(activeAssets);
      }
    } catch (error) {
      console.error('Fetch assets error:', error);
      toast.error('Failed to fetch assets');
    }
  };
// ... rest of the component
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await employeeAPI.getColleagues();
      const colleagues = response.data?.colleagues || [];
      setEmployees(colleagues);
    } catch (error) {
      console.error('Error fetching colleagues:', error);
      toast.error('Failed to fetch colleagues');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleTransferClick = (asset) => {
    setSelectedAsset(asset);
    setShowTransferModal(true);
    setSelectedEmployee('');
    fetchEmployees();
  };

  const handleTransferAsset = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    try {
      setTransferring(true);
      await assetAPI.transferAsset(selectedAsset._id, selectedEmployee, 'transfer');
      toast.success('Transfer request sent successfully');
      setShowTransferModal(false);
      fetchAllData();
    } catch (error) {
      console.error('Transfer error:', error);
      toast.error(error.response?.data?.message || 'Failed to transfer asset');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-lg flex flex-col items-center gap-2">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             Loading assets...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Assets</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/transfer-history')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-sm transition"
          >
            <History size={18} />
            Transfer History
          </button>
          <button onClick={fetchAllData} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
             <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Incoming Transfers Section */}
      {incomingTransfers.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💼</span>
            <h2 className="text-lg font-bold text-orange-800">Incoming Transfer Requests ({incomingTransfers.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomingTransfers.map((req) => (
              <div key={req._id} className="bg-white rounded-lg border border-orange-200 p-4 shadow-sm hover:shadow-md transition">
                <div className="font-bold text-gray-800 mb-1">{req.name}</div>
                <div className="text-xs text-gray-500 mb-3">{req.assetId} • {req.category}</div>
                <div className="text-sm bg-gray-50 p-2 rounded mb-4 border border-gray-100">
                  <span className="text-gray-600">From: </span>
                  <span className="font-semibold">{req.pendingTransfer?.fromEmployee?.name?.first} {req.pendingTransfer?.fromEmployee?.name?.last}</span>
                  <div className="text-[10px] text-gray-400 mt-0.5">Type: {req.pendingTransfer?.transferType}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={processingId === req._id}
                    onClick={() => handleAcceptTransfer(req._id)}
                    className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-1.5 text-sm font-medium disabled:opacity-50"
                  >
                    {processingId === req._id ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div> : <Check size={16} />}
                    Accept
                  </button>
                  <button
                    disabled={processingId === req._id}
                    onClick={() => handleRejectTransfer(req._id)}
                    className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 flex items-center justify-center gap-1.5 text-sm font-medium disabled:opacity-50"
                  >
                    {processingId === req._id ? <div className="animate-spin h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full"></div> : <X size={16} />}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {assets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center border">
          <div className="text-gray-400 text-6xl mb-4">💻</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Assets Assigned</h3>
          <p className="text-gray-500 max-w-xs mx-auto">You don't have any active assets assigned to you at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <div key={asset._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative hover:shadow-lg transition-shadow">
              {asset.pendingTransfer && 
               (asset.pendingTransfer.fromEmployee?._id === (user._id || user.id) || 
                asset.pendingTransfer.fromEmployee === (user._id || user.id)) && (
                <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-200 z-10 flex items-center gap-1">
                   <div className="animate-pulse w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                   Transfer Pending
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{asset.name}</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500">Asset ID</span>
                    <span className="font-mono font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded">{asset.assetId}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium text-gray-700">{asset.category}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Condition</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      asset.condition === 'New' || asset.condition === 'Excellent' ? 'bg-green-100 text-green-700' :
                      asset.condition === 'Good' ? 'bg-blue-100 text-blue-700' :
                      asset.condition === 'Fair' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {asset.condition}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleTransferClick(asset)}
                  disabled={asset.pendingTransfer && (asset.pendingTransfer.fromEmployee?._id === (user._id || user.id) || asset.pendingTransfer.fromEmployee === (user._id || user.id))}
                  className={`w-full mt-5 px-4 py-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-bold text-sm ${
                    (asset.pendingTransfer && (asset.pendingTransfer.fromEmployee?._id === (user._id || user.id) || asset.pendingTransfer.fromEmployee === (user._id || user.id)))
                    ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                    : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  <Send size={16} />
                  {(asset.pendingTransfer && (asset.pendingTransfer.fromEmployee?._id === (user._id || user.id) || asset.pendingTransfer.fromEmployee === (user._id || user.id))) ? 'Transfer Requested' : 'Transfer Asset'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Transfer Asset</h2>
              <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Asset: {selectedAsset?.name}</h3>
                <p className="text-sm text-gray-600">ID: {selectedAsset?.assetId}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select Employee</label>
                {loadingEmployees ? (
                  <div className="text-center py-4">Loading employees...</div>
                ) : employees.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No employees found. Check console for details.
                  </div>
                ) : (
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Employee ({employees.length} available) --</option>
                    {employees.map((emp) => {
                      const empId = emp._id || emp.id;
                      const firstName = emp.name?.first || emp.firstName || '';
                      const lastName = emp.name?.last || emp.lastName || '';
                      const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
                      const employeeId = emp.employeeId || empId;
                      const department = emp.department?.name || emp.department || 'N/A';
                      
                      return (
                        <option key={empId} value={empId}>
                          {employeeId} - {fullName} ({department})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowTransferModal(false)}
                  disabled={transferring}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferAsset}
                  disabled={transferring || !selectedEmployee}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {transferring ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Transfer Asset
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
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
