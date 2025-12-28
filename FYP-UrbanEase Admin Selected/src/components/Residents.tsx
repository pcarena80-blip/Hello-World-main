import { useState, useEffect } from 'react';
import { Plus, MoreVertical, CheckCircle, XCircle, AlertCircle, Check, X, Eye } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cnic: string;
  propertyType: string;
  ownership: string;
  block?: string;
  street?: string;
  houseNo?: string;
  plazaName?: string;
  floorNumber?: string;
  flatNumber?: string;
  isVerified: boolean;
}

export function Residents() {
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users from /admin/users...');
      const response = await api.get('/admin/users');
      console.log('API Response:', response.data);
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('Data is not an array:', response.data);
        setError('Invalid data format received');
      }
    } catch (err: any) {
      console.error('Failed to fetch users', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleVerify = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/verify`);
      // Refresh list locally
      setUsers(users.map(user => user._id === userId ? { ...user, isVerified: true } : user));
    } catch (error) {
      console.error("Failed to verify user", error);
      alert("Failed to verify user");
    }
  };

  const getStatus = (user: User) => {
    return user.isVerified ? 'active' : 'pending';
  };

  const getStatusBadge = (isVerified: boolean) => {
    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          Verified
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          Pending
        </span>
      );
    }
  };

  const getAddress = (user: User) => {
    if (user.propertyType === 'house') {
      return `House ${user.houseNo}, Street ${user.street}, Block ${user.block}`;
    } else {
      return `Flat ${user.flatNumber}, Floor ${user.floorNumber}, Plaza ${user.plazaName}`;
    }
  };

  const getActionButtons = (user: User) => {
    if (!user.isVerified) {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleVerify(user._id)}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Check className="w-4 h-4" />
            Verify
          </button>
        </div>
      );
    }
    return null;
  };

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Residents Management</h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Manage all registered residents in the community</p>
          <p className="text-xs text-gray-400 mt-1">Debug: Loaded {users.length} users.</p>
        </div>
      </div>

      <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl shadow-sm border overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-gray-50 border-gray-200'} border-b`}>
              <tr>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Full Name</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Phone Number</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>CNIC</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Full Address</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Account Status</th>
                <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`${theme === 'dark' ? 'divide-[#333333]' : 'divide-gray-200'} divide-y`}>
              {loading ? (
                <tr><td colSpan={6} className="text-center p-4">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-4">No residents found.</td></tr>
              ) : users.map((user) => (
                <tr key={user._id} className={theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00c878] to-[#00e68a] flex items-center justify-center text-white">
                        {user.name ? user.name.charAt(0) : '?'}
                      </div>
                      <span className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>{user.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{user.phone || 'N/A'}</td>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{user.cnic || 'N/A'}</td>
                  <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {getAddress(user)}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(user.isVerified)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getActionButtons(user)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}