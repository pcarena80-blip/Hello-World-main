import { useState, useEffect } from 'react';
import { User, Lock, LogOut, Mail, Phone, Plus, Ban, KeyRound, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useRole } from '../contexts/RoleContext';
import api from '../services/api';

export function Settings() {
  const { theme } = useTheme();
  const { role } = useRole();
  const [adminAccounts, setAdminAccounts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false); // Quick robust modal (or inline form)

  // New Admin Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role === 'superadmin') {
      fetchAdmins();
    }
  }, [role]);

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/admin/admins');
      setAdminAccounts(response.data);
    } catch (error) {
      console.error('Failed to fetch admins');
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/admins', {
        name: newName,
        email: newEmail,
        password: newPassword,
        phone: '+92 000 0000000' // Default or add input
      });
      setShowAddModal(false);
      fetchAdmins();
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      alert('Admin added successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;
    try {
      await api.delete(`/admin/admins/${id}`);
      fetchAdmins();
    } catch (error) {
      alert('Failed to delete admin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Settings</h2>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Manage your admin profile and preferences</p>
      </div>

      {/* Super Admin Only Section */}
      {role === 'superadmin' && (
        <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
                Admin Accounts Management
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Super Admin Only
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(!showAddModal)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#00c878] to-[#00e68a] text-white rounded-xl hover:shadow-lg transition-shadow">
              <Plus className="w-5 h-5" />
              {showAddModal ? 'Cancel' : 'Add New Admin'}
            </button>
          </div>

          {showAddModal && (
            <div className={`mb-6 p-4 rounded-xl border ${theme === 'dark' ? 'border-[#333333] bg-[#2A2A2A]' : 'border-gray-200 bg-gray-50'}`}>
              <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  required
                  placeholder="Full Name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="p-2 rounded border"
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="p-2 rounded border"
                />
                <input
                  required
                  type="password"
                  placeholder="Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="p-2 rounded border"
                />
                <div className="md:col-span-3">
                  <button disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">
                    {loading ? 'Adding...' : 'Save New Admin'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className={`${theme === 'dark' ? 'border-[#333333]' : 'border-gray-100'} border rounded-xl overflow-hidden`}>
            <table className="w-full">
              <thead className={`${theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-gray-50 border-gray-200'} border-b`}>
                <tr>
                  <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Full Name</th>
                  <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Email</th>
                  <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Phone</th>
                  <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Role</th>
                  <th className={`px-6 py-4 text-left ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`${theme === 'dark' ? 'divide-[#333333]' : 'divide-gray-200'} divide-y`}>
                {adminAccounts.map((admin) => (
                  <tr key={admin._id} className={theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00c878] to-[#00e68a] flex items-center justify-center text-white">
                          {admin.name.charAt(0)}
                        </div>
                        <span className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>{admin.name}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{admin.email}</td>
                    <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{admin.phone}</td>
                    <td className={`px-6 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{admin.role}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteAdmin(admin._id)}
                          className={`flex items-center gap-1 px-3 py-2 text-sm ${theme === 'dark' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-700 hover:bg-red-200'} rounded-lg transition-colors`}>
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
        <h3 className={`text-lg mb-4 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>
          {role === 'superadmin' ? 'Super Admin Profile' : 'Admin Profile'}
        </h3>
        <div className="flex items-start gap-6 mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#00c878] to-[#00e68a] flex items-center justify-center text-white text-3xl">
            {role === 'superadmin' ? 'SA' : 'A'}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
                <input
                  type="text"
                  defaultValue={role === 'superadmin' ? 'Super Admin User' : 'Admin User'}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                      ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] focus:border-[#00c878]'
                      : 'bg-white border-gray-200 focus:border-[#00c878]'
                    } focus:outline-none focus:ring-2 focus:ring-[#00c878]/20`}
                />
              </div>
            </div>
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
                <input
                  type="email"
                  defaultValue={role === 'superadmin' ? 'superadmin@urbanease.com' : 'admin@urbanease.com'}
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                      ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] focus:border-[#00c878]'
                      : 'bg-white border-gray-200 focus:border-[#00c878]'
                    } focus:outline-none focus:ring-2 focus:ring-[#00c878]/20`}
                />
              </div>
            </div>
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Phone</label>
              <div className="relative">
                <Phone className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
                <input
                  type="tel"
                  defaultValue="+92 300 0000000"
                  className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                      ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] focus:border-[#00c878]'
                      : 'bg-white border-gray-200 focus:border-[#00c878]'
                    } focus:outline-none focus:ring-2 focus:ring-[#00c878]/20`}
                />
              </div>
            </div>
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Role</label>
              <input
                type="text"
                defaultValue={role === 'superadmin' ? 'Super Admin — City Manager' : 'Admin — City Staff'}
                disabled
                className={`w-full px-4 py-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
              />
            </div>
          </div>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-[#00c878] to-[#00e68a] text-white rounded-lg hover:shadow-lg transition-shadow">
          Save Changes
        </button>
      </div>

      <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
        <h3 className={`text-lg mb-4 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Change Password</h3>
        <div className="space-y-4 max-w-lg">
          <div>
            <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Current Password</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
              <input
                type="password"
                placeholder="Enter current password"
                className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#00c878]'
                    : 'bg-white border-gray-200 focus:border-[#00c878]'
                  } focus:outline-none focus:ring-2 focus:ring-[#00c878]/20`}
              />
            </div>
          </div>
          <div>
            <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>New Password</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
              <input
                type="password"
                placeholder="Enter new password"
                className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#00c878]'
                    : 'bg-white border-gray-200 focus:border-[#00c878]'
                  } focus:outline-none focus:ring-2 focus:ring-[#00c878]/20`}
              />
            </div>
          </div>
          <div>
            <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Confirm New Password</label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'}`} />
              <input
                type="password"
                placeholder="Confirm new password"
                className={`w-full pl-12 pr-4 py-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#00c878]'
                    : 'bg-white border-gray-200 focus:border-[#00c878]'
                  } focus:outline-none focus:ring-2 focus:ring-[#00c878]/20`}
              />
            </div>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-[#00c878] to-[#00e68a] text-white rounded-lg hover:shadow-lg transition-shadow">
            Update Password
          </button>
        </div>
      </div>

      <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
        <h3 className={`text-lg mb-4 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Danger Zone</h3>
        <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Logging out will end your current session. You will need to log in again to access the admin panel.
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}