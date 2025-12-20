import { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

export default function ComplaintsScreen({ onNavigate }: { onNavigate: (screen: string, data?: any) => void }) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const data = await api.complaints.getAll();
      setComplaints(data);
    } catch (error) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };
  const stats = {
    open: complaints.filter(c => c.status === 'pending').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    cancelled: complaints.filter(c => c.status === 'rejected').length
  };

  const filteredComplaints = complaints.filter(c => c.status === activeFilter);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { bg: '#FF9800', label: 'Open' };
      case 'in-progress':
        return { bg: '#2196F3', label: 'In Progress' };
      case 'resolved':
        return { bg: '#4CAF50', label: 'Resolved' };
      case 'rejected':
        return { bg: '#9E9E9E', label: 'Cancelled' };
      default:
        return { bg: '#9E9E9E', label: status };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#F44336', label: 'High' };
      case 'medium':
        return { bg: '#FF9800', label: 'Medium' };
      default:
        return { bg: '#9E9E9E', label: 'Low' };
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-12 pb-8" style={{
        background: 'linear-gradient(180deg, #003E2F 0%, #005C3C 50%, #027A4C 100%)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px'
      }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('home')}>
              <ArrowLeft className="w-6 h-6 text-white" strokeWidth={1.5} />
            </button>
            <h1 className="text-white" style={{ fontSize: '24px', fontWeight: 600 }}>
              Complaints
            </h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => setActiveFilter('pending')}
            className={`rounded-xl p-3 text-center transition-all ${activeFilter === 'pending' ? 'bg-white/20 ring-1 ring-white/50' : 'bg-white/10'
              }`}
          >
            <p className="text-white mb-1" style={{ fontSize: '20px', fontWeight: 600 }}>
              {stats.open}
            </p>
            <p className="text-white/80" style={{ fontSize: '11px' }}>
              Open
            </p>
          </button>
          <button
            onClick={() => setActiveFilter('in-progress')}
            className={`rounded-xl p-3 text-center transition-all ${activeFilter === 'in-progress' ? 'bg-white/20 ring-1 ring-white/50' : 'bg-white/10'
              }`}
          >
            <p className="text-white mb-1" style={{ fontSize: '20px', fontWeight: 600 }}>
              {stats.inProgress}
            </p>
            <p className="text-white/80" style={{ fontSize: '11px' }}>
              In Progress
            </p>
          </button>
          <button
            onClick={() => setActiveFilter('resolved')}
            className={`rounded-xl p-3 text-center transition-all ${activeFilter === 'resolved' ? 'bg-white/20 ring-1 ring-white/50' : 'bg-white/10'
              }`}
          >
            <p className="text-white mb-1" style={{ fontSize: '20px', fontWeight: 600 }}>
              {stats.resolved}
            </p>
            <p className="text-white/80" style={{ fontSize: '11px' }}>
              Resolved
            </p>
          </button>
          <button
            onClick={() => setActiveFilter('rejected')}
            className={`rounded-xl p-3 text-center transition-all ${activeFilter === 'rejected' ? 'bg-white/20 ring-1 ring-white/50' : 'bg-white/10'
              }`}
          >
            <p className="text-white mb-1" style={{ fontSize: '20px', fontWeight: 600 }}>
              {stats.cancelled}
            </p>
            <p className="text-white/80" style={{ fontSize: '11px' }}>
              Cancelled
            </p>
          </button>
        </div>
      </div>

      {/* New Complaint Button */}
      <div className="px-6 -mt-4 mb-4">
        <button
          onClick={() => onNavigate('new-complaint')}
          className="w-full py-3.5 rounded-xl text-white shadow-md flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)',
            fontSize: '15px',
            fontWeight: 500
          }}
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
          New Complaint
        </button>
      </div>

      {/* Complaints List */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-3">
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No complaints found in this category.
          </div>
        ) : (
          filteredComplaints.map((complaint) => {
            const priorityConfig = getPriorityConfig(complaint.priority);

            return (
              <div
                key={complaint.id}
                onClick={() => onNavigate('complaint-details', { complaint })}
                className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: priorityConfig.bg, fontSize: '10px', fontWeight: 500 }}
                    >
                      {priorityConfig.label}
                    </span>
                  </div>
                  <span className="text-gray-400" style={{ fontSize: '11px' }}>
                    {complaint.date}
                  </span>
                </div>

                <h3 className="text-gray-900 mb-1" style={{ fontSize: '15px', fontWeight: 600 }}>
                  {complaint.title || complaint.subject}
                </h3>
                <p className="text-gray-500 mb-2" style={{ fontSize: '12px' }}>
                  {complaint.category} • Ticket {complaint._id ? complaint._id.slice(-6).toUpperCase() : complaint.id}
                </p>

                {complaint.description && (
                  <p className="text-gray-600 mb-2 line-clamp-2" style={{ fontSize: '13px' }}>
                    {complaint.description}
                  </p>
                )}

                {complaint.response && (
                  <div className="mt-3 p-2.5 rounded-lg" style={{ background: '#E3F2FD' }}>
                    <p className="text-[#2196F3]" style={{ fontSize: '12px' }}>
                      {complaint.response}
                    </p>
                  </div>
                )}
              </div>
            );
          }))
        }
      </div>
    </div>
  );
}
