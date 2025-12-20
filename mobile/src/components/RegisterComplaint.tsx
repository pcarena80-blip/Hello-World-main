import { useState } from 'react';
import { ArrowLeft, Upload, Image } from 'lucide-react';

export default function RegisterComplaint({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = [
    'Maintenance',
    'Water Supply',
    'Electricity',
    'Security',
    'Garbage Collection',
    'Noise Complaint',
    'Other'
  ];

  const handleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => {
      onNavigate('complaints');
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 bg-white">
        <div className="w-20 h-20 rounded-full bg-[#00c878]/10 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-[#00c878]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-gray-900 mb-3 text-center">Complaint Registered!</h2>
        <p className="text-gray-600 text-center">
          Your complaint has been submitted successfully. You will be notified of updates.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-6" style={{
        background: 'linear-gradient(135deg, #00c878 0%, #00e68a 100%)'
      }}>
        <button onClick={() => onNavigate('complaints')} className="text-white mb-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white mb-2">Register Complaint</h1>
        <p className="text-white/90">Submit your issue</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
        <div className="bg-white rounded-3xl p-6 space-y-5">
          <div>
            <label className="block text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00c878]/20 focus:border-[#00c878] bg-white"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the issue"
              className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00c878]/20 focus:border-[#00c878]"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide detailed information about your complaint"
              rows={5}
              className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#00c878]/20 focus:border-[#00c878] resize-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-3">Attach Image (Optional)</label>
            <button className="w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center gap-3 hover:border-[#00c878] transition-colors">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Image className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-600">Tap to upload image</p>
                <p className="text-gray-400">JPG, PNG (Max 5MB)</p>
              </div>
            </button>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, #00c878 0%, #00e68a 100%)'
            }}
          >
            Submit Complaint
          </button>
        </div>
      </div>
    </div>
  );
}
