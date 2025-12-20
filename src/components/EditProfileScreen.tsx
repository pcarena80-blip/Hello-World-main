import { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, Mail, Camera, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

export default function EditProfileScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    propertyType: 'house',
    // House
    block: '',
    street: '',
    houseNo: '',
    // Apartment
    plazaName: '',
    floorNumber: '',
    flatNumber: ''
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.profile.get();
      setFormData(prev => ({
        ...prev,
        ...data,
        password: '' // Don't prefill password
      }));
    } catch (error) {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.auth.updateProfile(formData);
      toast.success('Profile updated successfully');
      onNavigate('profile');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-12 pb-6" style={{
        background: 'linear-gradient(180deg, #003E2F 0%, #005C3C 50%, #027A4C 100%)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px'
      }}>
        <button onClick={() => onNavigate('profile')} className="mb-4">
          <ArrowLeft className="w-6 h-6 text-white" strokeWidth={1.5} />
        </button>
        <h1 className="text-white mb-2" style={{ fontSize: '24px', fontWeight: 600 }}>
          Edit Profile
        </h1>
        <p className="text-white/80" style={{ fontSize: '14px' }}>
          Update your information
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-8">
        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: '#F1F8F4' }}>
              <User className="w-12 h-12 text-[#027A4C]" strokeWidth={1.5} />
            </div>
            <button className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)' }}>
              <Camera className="w-4 h-4 text-white" strokeWidth={1.5} />
            </button>
          </div>
          <p className="text-gray-600 mt-3" style={{ fontSize: '13px' }}>Change profile picture</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-gray-700 mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                style={{ fontSize: '15px' }}
                placeholder="Phone Number"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                style={{ fontSize: '15px' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-3" style={{ fontSize: '14px', fontWeight: 500 }}>
              Address ({formData.propertyType === 'apartment' ? 'Apartment' : 'House'})
            </label>

            {formData.propertyType === 'house' ? (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    placeholder="Block"
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                    style={{ fontSize: '14px' }}
                  />
                </div>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Street"
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                  style={{ fontSize: '14px' }}
                />
                <input
                  type="text"
                  value={formData.houseNo}
                  onChange={(e) => setFormData({ ...formData, houseNo: e.target.value })}
                  placeholder="House"
                  className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                  style={{ fontSize: '14px' }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={formData.plazaName}
                    onChange={(e) => setFormData({ ...formData, plazaName: e.target.value })}
                    placeholder="Plaza Name"
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                    style={{ fontSize: '14px' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.floorNumber}
                    onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                    placeholder="Floor"
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                    style={{ fontSize: '14px' }}
                  />
                  <input
                    type="text"
                    value={formData.flatNumber}
                    onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                    placeholder="Flat No."
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                    style={{ fontSize: '14px' }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3.5 rounded-xl text-white shadow-md hover:shadow-lg transition-all"
            style={{
              background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)',
              fontSize: '16px',
              fontWeight: 500
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
