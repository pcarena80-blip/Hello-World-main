
import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit, LogOut, Lock, Save, X, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'sonner';

export default function ProfileScreen({ onNavigate, onLogout }: { onNavigate: (screen: string) => void, onLogout: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    password: '',
    block: '',
    street: '',
    houseNo: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.profile.get();
      setProfile(data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading profile...</div>;
  if (!profile) return <div className="p-10 text-center">Failed to load profile</div>;

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto pb-24">
      {/* Header */}
      <div
        className="px-6 pt-12 pb-16"
        style={{
          background:
            "linear-gradient(180deg, #003E2F 0%, #005C3C 50%, #027A4C 100%)",
          borderBottomLeftRadius: "32px",
          borderBottomRightRadius: "32px",
        }}
      >
        <h1
          className="text-white mb-8"
          style={{ fontSize: "24px", fontWeight: 600 }}
        >
          Profile
        </h1>

        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
            <User
              className="w-12 h-12 text-white"
              strokeWidth={1.5}
            />
          </div>
          <h2
            className="text-white mb-2"
            style={{ fontSize: "20px", fontWeight: 600 }}
          >
            {profile.name}
          </h2>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-[#4CAF50]"></div>
            <span
              className="text-white"
              style={{ fontSize: "13px" }}
            >
              Verified Resident
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-4">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3
            className="text-gray-900 mb-4"
            style={{ fontSize: "16px", fontWeight: 600 }}
          >
            Personal Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "#F1F8F4" }}
              >
                <Phone
                  className="w-5 h-5 text-[#027A4C]"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1">
                <p
                  className="text-gray-500 mb-1"
                  style={{ fontSize: "12px" }}
                >
                  Phone
                </p>
                <p
                  className="text-gray-900"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  {profile.phone || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "#F1F8F4" }}
              >
                <Mail
                  className="w-5 h-5 text-[#027A4C]"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1">
                <p
                  className="text-gray-500 mb-1"
                  style={{ fontSize: "12px" }}
                >
                  Email
                </p>
                <p
                  className="text-gray-900"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  {profile.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "#F1F8F4" }}
              >
                <MapPin
                  className="w-5 h-5 text-[#027A4C]"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex-1">
                <p
                  className="text-gray-500 mb-1"
                  style={{ fontSize: "12px" }}
                >
                  Address
                </p>
                <p
                  className="text-gray-900"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  {profile.propertyType === 'house'
                    ? `${profile.houseNo || ''} ${profile.street ? `Street ${profile.street}` : ''} ${profile.block ? `Block ${profile.block}` : ''}`
                    : `${profile.flatNumber || ''} ${profile.floorNumber ? `Floor ${profile.floorNumber}` : ''} ${profile.plazaName || ''}`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl p-2 shadow-sm">
          <button
            onClick={() => onNavigate("edit-profile")}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "#E3F2FD" }}
            >
              <Edit
                className="w-5 h-5 text-[#2196F3]"
                strokeWidth={1.5}
              />
            </div>
            <span
              className="flex-1 text-left text-gray-900"
              style={{ fontSize: "15px", fontWeight: 500 }}
            >
              Edit Profile
            </span>
            <ChevronRight
              className="w-5 h-5 text-gray-400"
              strokeWidth={1.5}
            />
          </button>

          <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "#F3E5F5" }}
            >
              <Lock
                className="w-5 h-5 text-[#9C27B0]"
                strokeWidth={1.5}
              />
            </div>
            <span
              className="flex-1 text-left text-gray-900"
              style={{ fontSize: "15px", fontWeight: 500 }}
            >
              Change Password
            </span>
            <ChevronRight
              className="w-5 h-5 text-gray-400"
              strokeWidth={1.5}
            />
          </button>

          <button
            onClick={() => {
              api.auth.logout();
              onLogout();
            }}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "#FFEBEE" }}
            >
              <LogOut
                className="w-5 h-5 text-[#F44336]"
                strokeWidth={1.5}
              />
            </div>
            <span
              className="flex-1 text-left text-[#F44336]"
              style={{ fontSize: "15px", fontWeight: 500 }}
            >
              Logout
            </span>
          </button>
        </div>

        {/* App Info */}
        <div className="text-center py-4">
          <p
            className="text-gray-400"
            style={{ fontSize: "13px" }}
          >
            UrbanEase v1.0.0
          </p>
          <p
            className="text-gray-400"
            style={{ fontSize: "12px" }}
          >
            UrbanEase
          </p>
        </div>
      </div>
    </div>
  );
}