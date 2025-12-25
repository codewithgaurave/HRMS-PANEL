import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const EmployeeNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_API}/api/notices`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hrms-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Notices data:', data);
        setNotices(data.notices || []);
      } else {
        console.error('Failed to fetch notices:', response.status);
        toast.error('Failed to fetch notices');
      }
    } catch (error) {
      console.error('Fetch notices error:', error);
      toast.error('Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notices & Announcements</h1>
        <div className="text-sm text-gray-600">
          Total: {notices.length} notices
        </div>
      </div>

      {notices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📢</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Notices Available</h3>
          <p className="text-gray-500">There are no notices or announcements at the moment.</p>
          <button 
            onClick={fetchNotices}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div key={notice._id} className="bg-white rounded-lg shadow border hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{notice.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    notice.priority === 'High' ? 'bg-red-100 text-red-800' :
                    notice.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {notice.priority || 'Normal'}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {notice.content || notice.message}
                </p>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>📅 {formatDate(notice.createdAt)}</span>
                    {notice.category && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {notice.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedNotice(notice)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Read More
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedNotice.title}</h2>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>📅 {formatDate(selectedNotice.createdAt)}</span>
                {selectedNotice.category && (
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    {selectedNotice.category}
                  </span>
                )}
                {selectedNotice.priority && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedNotice.priority === 'High' ? 'bg-red-100 text-red-800' :
                    selectedNotice.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedNotice.priority}
                  </span>
                )}
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedNotice.content || selectedNotice.message}
                </p>
              </div>
              
              {selectedNotice.createdBy && (
                <div className="border-t pt-4 text-sm text-gray-600">
                  <span>Published by: {selectedNotice.createdBy.name || 'HR Department'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeNotices;