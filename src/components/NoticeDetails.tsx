import { ArrowLeft, Calendar } from 'lucide-react';

export default function NoticeDetails({ 
  notice, 
  onNavigate 
}: { 
  notice: any;
  onNavigate: (screen: string) => void;
}) {
  if (!notice) return null;

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#F44336', label: 'High Priority' };
      case 'medium':
        return { bg: '#FF9800', label: 'Medium' };
      default:
        return { bg: '#9E9E9E', label: 'Low' };
    }
  };

  const config = getPriorityConfig(notice.priority);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-12 pb-6" style={{
        background: 'linear-gradient(180deg, #003E2F 0%, #005C3C 50%, #027A4C 100%)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px'
      }}>
        <button onClick={() => onNavigate('notices')} className="mb-4">
          <ArrowLeft className="w-6 h-6 text-white" strokeWidth={1.5} />
        </button>
        <h1 className="text-white" style={{ fontSize: '24px', fontWeight: 600 }}>
          Notice Details
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-white mb-4"
            style={{ backgroundColor: config.bg, fontSize: '12px', fontWeight: 500 }}
          >
            {config.label}
          </span>

          <h2 className="text-gray-900 mb-4" style={{ fontSize: '20px', fontWeight: 600 }}>
            {notice.title}
          </h2>

          <div className="flex items-center gap-2 text-gray-500 mb-6 pb-6 border-b border-gray-100">
            <Calendar className="w-4 h-4" strokeWidth={1.5} />
            <span style={{ fontSize: '13px' }}>Posted {notice.date}</span>
          </div>

          <div className="text-gray-700 leading-relaxed" style={{ fontSize: '15px' }}>
            <p className="mb-4">
              {notice.description}
            </p>
            <p>
              {notice.title === 'Urgent: Water Supply Maintenance' && (
                <>
                  We apologize for any inconvenience this may cause. Please make necessary arrangements to store water in advance. Emergency water tankers will be available on standby if needed.
                  <br /><br />
                  For any queries, please contact the maintenance office.
                  <br /><br />
                  Thank you for your cooperation.
                  <br />
                  - Management Team
                </>
              )}
              {notice.title === 'Community Meeting This Friday' && (
                <>
                  The meeting will be held at 6:00 PM at the main clubhouse. Topics include upcoming maintenance projects, security updates, and community event planning.
                  <br /><br />
                  Your presence and participation are highly valued.
                  <br /><br />
                  - Community Committee
                </>
              )}
              {!notice.title.includes('Water Supply') && !notice.title.includes('Community Meeting') && (
                <>
                  Additional details about this notice will be shared soon. Please stay tuned for further updates.
                  <br /><br />
                  For more information, please contact the administration office during working hours.
                  <br /><br />
                  - Administration
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
