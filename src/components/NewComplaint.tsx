import { useState } from 'react';
import { ArrowLeft, Upload, Image } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

export default function NewComplaint({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'low'
  });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const categories = [
    'General',
    'Maintenance',
    'Security',
    'Noise',
    'Cleanliness'
  ];

  const handleSubmit = async () => {
    if (!formData.category || !formData.subject || !formData.description) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('subject', formData.subject);
      data.append('description', formData.description);
      data.append('priority', formData.priority);
      if (file) {
        data.append('image', file);
      }

      await api.complaints.create(data);
      toast.success('Complaint submitted successfully');
      onNavigate('complaints');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit complaint');
    } finally {
      setIsLoading(false);
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
        <button onClick={() => onNavigate('complaints')} className="mb-4">
          <ArrowLeft className="w-6 h-6 text-white" strokeWidth={1.5} />
        </button>
        <h1 className="text-white mb-2" style={{ fontSize: '24px', fontWeight: 600 }}>
          New Complaint
        </h1>
        <p className="text-white/80" style={{ fontSize: '14px' }}>
          Submit your issue
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-gray-700 mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C] bg-white"
              style={{ fontSize: '15px' }}
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>



          <div>
            <label className="block text-gray-700 mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of the issue"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
              style={{ fontSize: '15px' }}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide detailed information about your complaint"
              rows={5}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C] resize-none"
              style={{ fontSize: '15px' }}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-3" style={{ fontSize: '14px', fontWeight: 500 }}>
              Attach Photo (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className={`w-full p-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-3 cursor-pointer transition-colors ${file ? 'border-[#027A4C] bg-[#F1F8F4]' : 'border-gray-300 hover:border-[#027A4C]'}`}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: file ? '#E8F5E9' : '#F1F8F4' }}>
                  <Image className="w-7 h-7 text-[#027A4C]" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-gray-700 mb-1" style={{ fontSize: '14px', fontWeight: 500 }}>
                    {file ? file.name : 'Tap to upload image'}
                  </p>
                  <p className="text-gray-400" style={{ fontSize: '12px' }}>
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'JPG, PNG (Max 5MB)'}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl text-white shadow-md hover:shadow-lg transition-all"
            style={{
              background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)',
              fontSize: '16px',
              fontWeight: 500
            }}
          >
            Submit Complaint
          </button>
        </div>
      </div>
    </div>
  );
}
