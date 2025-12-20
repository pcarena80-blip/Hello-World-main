import { ArrowLeft, CheckCircle, Clock, Send } from 'lucide-react';
import { useState } from 'react';

export default function ComplaintDetails({
  complaint,
  onNavigate
}: {
  complaint: any;
  onNavigate: (screen: string) => void;
}) {
  if (!complaint) return null;

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

  const statusConfig = getStatusConfig(complaint.status);

  // Helper to determine active state in timeline
  const isAfter = (currentStatus: string, stepStatus: string) => {
    const order = ['pending', 'in-progress', 'resolved', 'rejected'];
    const currentIdx = order.indexOf(currentStatus);
    const stepIdx = order.indexOf(stepStatus);
    return currentIdx >= stepIdx;
  };

  const timeline = [
    {
      status: 'Submitted',
      date: complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : '',
      active: true
    },
    {
      status: 'In Progress',
      date: isAfter(complaint.status, 'in-progress') && complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleDateString() : null,
      active: isAfter(complaint.status, 'in-progress')
    },
    {
      status: 'Resolved',
      date: complaint.status === 'resolved' && complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleDateString() : null,
      active: complaint.status === 'resolved'
    },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-12 pb-6" style={{
        background: 'linear-gradient(180deg, #003E2F 0%, #005C3C 50%, #027A4C 100%)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px'
      }}>
        <button onClick={() => onNavigate('complaints')} className="mb-4">
          <ArrowLeft className="w-6 h-6 text-white" strokeWidth={1.5} />
        </button>
        <h1 className="text-white" style={{ fontSize: '24px', fontWeight: 600 }}>
          Complaint Details
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-4">
        {/* Header Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span
              className="px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: statusConfig.bg, fontSize: '12px', fontWeight: 500 }}
            >
              {statusConfig.label}
            </span>
            <span className="text-gray-400" style={{ fontSize: '12px' }}>
              Ticket {complaint.id}
            </span>
          </div>

          <h2 className="text-gray-900 mb-2" style={{ fontSize: '18px', fontWeight: 600 }}>
            {complaint.title || complaint.subject}
          </h2>
          <p className="text-gray-500 mb-4" style={{ fontSize: '13px' }}>
            {complaint.category} • Submitted {complaint.date}
          </p>

          <div className="p-3 rounded-lg bg-gray-50 mb-4">
            <p className="text-gray-700" style={{ fontSize: '14px' }}>
              {complaint.description}
            </p>
          </div>

          {complaint.image && (
            <div className="rounded-xl overflow-hidden mb-4 border border-gray-100">
              <img
                src={`http://localhost:5000${complaint.image}`}
                alt="Complaint Attachment"
                className="w-full h-auto object-cover"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}
        </div>

        {/* Status Timeline */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-gray-900 mb-4" style={{ fontSize: '16px', fontWeight: 600 }}>
            Status Timeline
          </h3>
          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${item.active ? 'bg-[#027A4C]' : 'bg-gray-200'
                      }`}
                  >
                    {item.active ? (
                      <CheckCircle className="w-5 h-5 text-white" strokeWidth={2} />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" strokeWidth={1.5} />
                    )}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className={`w-0.5 h-10 ${item.active ? 'bg-[#027A4C]' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className={item.active ? 'text-gray-900' : 'text-gray-400'} style={{ fontSize: '14px', fontWeight: 500 }}>
                    {item.status}
                  </p>
                  {item.date && (
                    <p className="text-gray-400" style={{ fontSize: '12px' }}>
                      {item.date}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
