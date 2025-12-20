import { ArrowLeft } from 'lucide-react';
import easypaisaLogo from 'figma:asset/d8fa48915f7ca85fb35a329d55abe0e155bed460.png';
import jazzcashLogo from 'figma:asset/dd4d89617cf981b049c896f83e1d391a901c183c.png';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '../services/api';

export default function BillDetails({
  bill,
  onNavigate
}: {
  bill: any;
  onNavigate: (screen: string) => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [cnic, setCnic] = useState('');
  const [loading, setLoading] = useState(false);

  if (!bill) return null;

  const breakdown = [
    { label: 'Dhobi Fee', amount: 3500 },
    { label: 'Water Charges', amount: 800 },
    { label: 'Garbage Collection', amount: 400 },
    { label: 'Security Charges', amount: 300 },
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }
    if (!mobileNumber || !cnic) {
      toast.error('Please enter Mobile Number and CNIC');
      return;
    }

    setLoading(true);
    try {
      const response = await api.payment.initiate({
        method: selectedMethod,
        amount: bill.amount,
        mobileNumber,
        cnic,
        billId: bill.id
      });
      toast.success(response.message);
      // Maybe navigate back or show success state
    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-12 pb-6" style={{
        background: 'linear-gradient(180deg, #003E2F 0%, #005C3C 50%, #027A4C 100%)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px'
      }}>
        <button onClick={() => onNavigate('bills')} className="mb-4">
          <ArrowLeft className="w-6 h-6 text-white" strokeWidth={1.5} />
        </button>
        <h1 className="text-white mb-2" style={{ fontSize: '24px', fontWeight: 600 }}>
          Bill Details
        </h1>
        <p className="text-white/80" style={{ fontSize: '14px' }}>
          {bill.type} - {bill.month}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32 space-y-4">
        {/* Amount Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-gray-500 mb-2" style={{ fontSize: '14px' }}>
            Total Amount
          </p>
          <h2 className="text-gray-900 mb-4" style={{ fontSize: '32px', fontWeight: 600 }}>
            PKR {bill.amount.toLocaleString()}
          </h2>
          <div
            className="px-4 py-2 rounded-lg inline-block"
            style={{
              background: bill.status === 'due' ? '#FFEBEE' : '#FFF4E6'
            }}
          >
            <span
              style={{
                color: bill.status === 'due' ? '#F44336' : '#FF9800',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              {bill.status === 'due' ? `Due: ${bill.dueDate}` : `Due: ${bill.dueDate}`}
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-gray-900 mb-4" style={{ fontSize: '16px', fontWeight: 600 }}>
            Amount Breakdown
          </h3>
          <div className="space-y-3">
            {breakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <span className="text-gray-600" style={{ fontSize: '14px' }}>
                  {item.label}
                </span>
                <span className="text-gray-900" style={{ fontSize: '14px', fontWeight: 500 }}>
                  PKR {item.amount.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-900" style={{ fontSize: '15px', fontWeight: 600 }}>
                  Total
                </span>
                <span className="text-gray-900" style={{ fontSize: '15px', fontWeight: 600 }}>
                  PKR {bill.amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-gray-900 mb-4" style={{ fontSize: '16px', fontWeight: 600 }}>
            Payment Methods
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => setSelectedMethod('Easypaisa')}
              className={`w-full p-4 border-2 rounded-xl flex items-center gap-4 transition-colors ${selectedMethod === 'Easypaisa' ? 'border-[#027A4C]' : 'border-gray-200 hover:border-[#027A4C]'}`}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden p-2" style={{ background: '#E8F5E9' }}>
                <img
                  src={easypaisaLogo}
                  alt="Easypaisa"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Easypaisa
                </p>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  Mobile wallet
                </p>
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod('JazzCash')}
              className={`w-full p-4 border-2 rounded-xl flex items-center gap-4 transition-colors ${selectedMethod === 'JazzCash' ? 'border-[#027A4C]' : 'border-gray-200 hover:border-[#027A4C]'}`}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden p-2" style={{ background: '#FFEBEE' }}>
                <img
                  src={jazzcashLogo}
                  alt="JazzCash"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 text-left">
                <p className="text-gray-900" style={{ fontSize: '14px', fontWeight: 500 }}>
                  JazzCash
                </p>
                <p className="text-gray-500" style={{ fontSize: '12px' }}>
                  Mobile wallet
                </p>
              </div>
            </button>
          </div>

          {selectedMethod && (
            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Mobile Number</label>
                <input
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="03XXXXXXXXX"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#027A4C]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">CNIC</label>
                <input
                  type="text"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="XXXXX-XXXXXXX-X"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#027A4C]"
                />
              </div>
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full mt-5 py-3.5 rounded-xl text-white shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)',
              fontSize: '16px',
              fontWeight: 500
            }}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}