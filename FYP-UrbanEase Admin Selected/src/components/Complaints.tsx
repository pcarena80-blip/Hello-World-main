import { useState, useEffect } from 'react';
import { Filter, CheckCircle, Clock, AlertCircle, Eye, XCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

interface Complaint {
  _id: string;
  userId: {
    name: string;
    email: string;
    houseNo?: string;
    block?: string;
  };
  subject: string;
  category: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  response?: string;
  image?: string;
}

export function Complaints() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/admin/complaints');
      setComplaints(response.data);
    } catch (error) {
      console.error('Failed to fetch complaints', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/admin/complaints/${id}/status`, { status: newStatus });
      // Refresh list locally
      setComplaints(complaints.map(c => c._id === id ? { ...c, status: newStatus } : c));
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update status');
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            Pending
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm">
            <Clock className="w-4 h-4" />
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            Resolved
          </span>
        );
      case 'rejected':
      case 'canceled':
        return (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'} text-sm`}>
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Complaints Management</h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Track and resolve resident complaints</p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className={`w-5 h-5 ${theme === 'dark' ? 'text-white opacity-70' : 'text-gray-600'}`} />
          <div className="flex gap-2">
            {['all', 'pending', 'in-progress', 'resolved', 'rejected'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-colors capitalize ${filter === f
                  ? 'bg-gradient-to-r from-[#00c878] to-[#00e68a] text-white'
                  : theme === 'dark'
                    ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {f.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? <p className="text-center">Loading complaints...</p> : filteredComplaints.map((complaint) => (
          <div key={complaint._id} className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00c878] to-[#00e68a] flex items-center justify-center text-white">
                    {complaint.userId?.name.charAt(0)}
                  </div>
                  <div>
                    <p className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>{complaint.userId?.name}</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(complaint.createdAt)}</p>
                  </div>
                </div>
                <div className="mb-2">
                  <span className={`inline-block px-3 py-1 ${theme === 'dark' ? 'bg-[#2A2A2A] text-gray-300' : 'bg-gray-100 text-gray-700'} rounded-full text-sm`}>
                    {complaint.category}
                  </span>
                </div>
                <h4 className={`font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>{complaint.subject}</h4>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{complaint.description}</p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(complaint.status)}
                <button
                  onClick={() =>
                    setSelectedComplaint(selectedComplaint === complaint._id ? null : complaint._id)
                  }
                  className={`flex items-center gap-2 px-4 py-2 ${theme === 'dark' ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg transition-colors`}
                >
                  <Eye className="w-4 h-4" />
                  {selectedComplaint === complaint._id ? 'Hide Details' : 'View Details'}
                </button>
              </div>
            </div>
            {selectedComplaint === complaint._id && (
              <div className={`mt-4 pt-4 ${theme === 'dark' ? 'border-[#333333]' : 'border-gray-200'} border-t`}>
                {/* Simplified Timeline based on available data */}
                <h4 className={`mb-3 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>History</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#00c878] mt-2"></div>
                    <div>
                      <p className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>Submitted</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(complaint.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {complaint.image && (
                  <div className="mt-4">
                    <h5 className={`mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Attachment</h5>
                    <div className="rounded-lg overflow-hidden border border-gray-200 inline-block">
                      <img
                        src={complaint.image.startsWith('http') ? complaint.image : `http://localhost:5000/${complaint.image.replace(/\\/g, '/')}`}
                        alt="Complaint Attachment"
                        className="max-w-full h-auto max-h-64 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className={`mt-4 pt-4 ${theme === 'dark' ? 'border-[#333333]' : 'border-gray-200'} border-t`}>
                  <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Change Status:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(complaint._id, 'pending')}
                      className={`px-4 py-2 ${theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'} rounded-lg transition-colors text-sm`}>
                      Mark Pending
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(complaint._id, 'in-progress')}
                      className={`px-4 py-2 ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'} rounded-lg transition-colors text-sm`}>
                      In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(complaint._id, 'resolved')}
                      className={`px-4 py-2 ${theme === 'dark' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-100 text-green-700 hover:bg-green-200'} rounded-lg transition-colors text-sm`}>
                      Resolve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(complaint._id, 'rejected')}
                      className={`px-4 py-2 ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg transition-colors text-sm`}>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {!loading && filteredComplaints.length === 0 && (
          <p className="text-center text-gray-500">No complaints found.</p>
        )}
      </div>
    </div>
  );
}