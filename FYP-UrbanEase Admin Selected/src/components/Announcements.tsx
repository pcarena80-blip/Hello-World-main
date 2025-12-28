import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

interface Notice {
  _id: string;
  title: string;
  description: string;
  expiryDate: string;
  createdAt: string;
}

export function Announcements() {
  const { theme } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const fetchNotices = async () => {
    try {
      const response = await api.get('/admin/notices');
      setNotices(response.data);
    } catch (error) {
      console.error("Failed to fetch notices", error);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async () => {
    if (!title || !description || !expiryDate) return alert('Please fill all fields');
    try {
      await api.post('/admin/notices', { title, description, expiryDate });
      setShowForm(false);
      setTitle('');
      setDescription('');
      setExpiryDate('');
      fetchNotices(); // Refresh list
    } catch (error) {
      console.error("Failed to create notice", error);
      alert("Failed to create notice");
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/admin/notices/${id}`);
      fetchNotices();
    } catch (error) {
      console.error("Failed to delete notice", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>E-Notice Board</h2>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Create and manage community announcements</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#00c878] to-[#00e68a] text-white rounded-xl hover:shadow-lg transition-shadow"
        >
          <Plus className="w-5 h-5" />
          Create Announcement
        </button>
      </div>

      {showForm && (
        <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
          <h3 className={`text-lg mb-4 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>New Announcement</h3>
          <div className="space-y-4">
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title"
                className={`w-full px-4 py-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#00c878]'
                    : 'bg-white border-gray-200 focus:border-[#00c878]'
                  } focus:outline-none focus:ring-2 focus:ring-[#00c878]/20`}
              />
            </div>
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter announcement details"
                className={`w-full px-4 py-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#00c878]'
                    : 'bg-white border-gray-200 focus:border-[#00c878]'
                  } focus:outline-none focus:ring-2 focus:ring-[#00c878]/20`}
              ></textarea>
            </div>
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${theme === 'dark'
                    ? 'bg-[#1A1A1A] border-[#333333] text-[#F2F2F2] focus:border-[#00c878]'
                    : 'bg-white border-gray-200 focus:border-[#00c878]'
                  } focus:outline-none focus:ring-2 focus:ring-[#00c878]/20`}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateNotice}
                className="px-6 py-3 bg-gradient-to-r from-[#00c878] to-[#00e68a] text-white rounded-lg hover:shadow-lg transition-shadow">
                Publish Announcement
              </button>
              <button
                onClick={() => setShowForm(false)}
                className={`px-6 py-3 ${theme === 'dark' ? 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333333]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg transition-colors`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {notices.map((announcement) => (
          <div key={announcement._id} className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className={`text-lg mb-2 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{announcement.title}</h3>
                <p className={`mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{announcement.description}</p>
                <div className={`flex items-center gap-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Expires: {new Date(announcement.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeleteNotice(announcement._id)}
                  className={`p-2 ${theme === 'dark' ? 'hover:bg-red-500/20' : 'hover:bg-red-50'} rounded-lg transition-colors`}>
                  <Trash2 className={`w-5 h-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}