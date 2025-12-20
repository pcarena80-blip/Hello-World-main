import { useState, useEffect } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

export default function BillsScreen({ onNavigate }: { onNavigate: (screen: string, data?: any) => void }) {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const data = await api.bills.getAll();
      setBills(data);
    } catch (error: any) {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const upcomingBills = bills.filter((b: any) =>
    (b.status === 'due' || b.status === 'upcoming') &&
    b.type !== 'Electricity' && b.type !== 'Maintenance'
  );
  const billHistory = bills.filter((b: any) =>
    b.status === 'paid' &&
    b.type !== 'Electricity' && b.type !== 'Maintenance'
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 bg-white">
      {/* Header */}
      <div className="px-6 pt-12 pb-6" style={{
        background: 'linear-gradient(180deg, #003E2F 0%, #005C3C 50%, #027A4C 100%)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px'
      }}>
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => onNavigate('home')}>
            <ArrowLeft className="w-6 h-6 text-white" strokeWidth={1.5} />
          </button>
          <h1 className="text-white" style={{ fontSize: '24px', fontWeight: 600 }}>
            Bills & Payments
          </h1>
        </div>
        <p className="text-white/80 ml-10" style={{ fontSize: '14px' }}>
          Manage your utility payments
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <p>Loading bills...</p>
          </div>
        ) : (
          <>
            {/* Upcoming Bills */}
            <div>
              <h3 className="text-gray-900 mb-3" style={{ fontSize: '17px', fontWeight: 600 }}>
                Upcoming Bills
              </h3>
              <div className="space-y-3">
                {upcomingBills.map((bill) => (
                  <div key={bill.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-gray-900 mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                          {bill.type}
                        </h4>
                        <p className="text-gray-500" style={{ fontSize: '13px' }}>
                          {bill.month}
                        </p>
                      </div>
                      <span
                        className="px-3 py-1 rounded-full text-white"
                        style={{
                          backgroundColor: bill.status === 'due' ? '#F44336' : '#FF9800',
                          fontSize: '11px',
                          fontWeight: 500
                        }}
                      >
                        {bill.status === 'due' ? 'Due' : 'Upcoming'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                      <span className="text-gray-600" style={{ fontSize: '14px' }}>
                        Amount
                      </span>
                      <span className="text-gray-900" style={{ fontSize: '18px', fontWeight: 600 }}>
                        PKR {bill.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-600" style={{ fontSize: '13px' }}>
                        Due Date: {bill.dueDate}
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigate('bill-details', { bill })}
                      className="w-full py-3 rounded-xl text-white shadow-sm hover:shadow-md transition-all"
                      style={{
                        background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)',
                        fontSize: '15px',
                        fontWeight: 500
                      }}
                    >
                      Pay Now
                    </button>
                  </div>
                ))}
                {upcomingBills.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No upcoming bills</p>
                )}
              </div>
            </div>

            {/* Bills History */}
            <div>
              <h3 className="text-gray-900 mb-3" style={{ fontSize: '17px', fontWeight: 600 }}>
                Payment History
              </h3>
              <div className="space-y-3">
                {billHistory.map((bill) => (
                  <div key={bill.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-gray-900 mb-1" style={{ fontSize: '15px', fontWeight: 600 }}>
                          {bill.type}
                        </h4>
                        <p className="text-gray-500 mb-1" style={{ fontSize: '12px' }}>
                          Ref No: {bill.refNo}
                        </p>
                        <p className="text-gray-400" style={{ fontSize: '11px' }}>
                          {bill.method} • {bill.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-900 mb-2" style={{ fontSize: '15px', fontWeight: 600 }}>
                          PKR {bill.amount.toLocaleString()}
                        </p>
                        <button className="text-[#027A4C] flex items-center gap-1 ml-auto hover:underline" style={{ fontSize: '12px', fontWeight: 500 }}>
                          <Download className="w-3.5 h-3.5" strokeWidth={2} />
                          Receipt
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {billHistory.length === 0 && (
                  <p className="text-gray-400 text-center py-4">No payment history</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
