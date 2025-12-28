import { useState, useEffect } from 'react';
import { UserCircle, AlertTriangle, CreditCard, Bell, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';

export function Dashboard() {
  const { theme } = useTheme();

  const [stats, setStats] = useState({
    totalResidents: 0,
    activeResidents: 0,
    activeComplaints: 0,
    pendingComplaints: 0,
    totalBillsDue: 0,
    unpaidBillsCount: 0,
    activeNotices: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };
    fetchStats();
  }, []);

  // Using static graph data for now as per plan, but counters are real
  const platformActivityData = [
    { time: '00:00', activity: 45 },
    { time: '04:00', activity: 20 },
    { time: '08:00', activity: 120 },
    { time: '12:00', activity: 180 },
    { time: '16:00', activity: 240 },
    { time: '20:00', activity: 190 },
    { time: '23:59', activity: 80 },
  ];

  const complaintResolutionData = [
    { day: 'Mon', resolved: 12, pending: 3 },
    { day: 'Tue', resolved: 15, pending: 5 },
    { day: 'Wed', resolved: 8, pending: 2 },
    { day: 'Thu', resolved: 20, pending: 4 },
    { day: 'Fri', resolved: 18, pending: 6 },
    { day: 'Sat', resolved: 10, pending: 2 },
    { day: 'Sun', resolved: 14, pending: 3 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#00c878] to-[#00e68a] rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl mb-2">Good Evening, Admin!</h1>
            <p className="text-white/90 mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-white/80 italic">Convenience Meets Community</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <p className="text-white/80 text-sm mb-1">Active Residents</p>
              <p className="text-2xl">{stats.activeResidents}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4">
              <p className="text-white/80 text-sm mb-1">System Status</p>
              <p className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5" />
                All Good
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 ${theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-green-50'} rounded-xl`}>
              <UserCircle className={`w-6 h-6 ${theme === 'dark' ? 'text-white opacity-70' : 'text-[#00c878]'}`} />
            </div>
            {/* Trend placeholder */}
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>--</span>
            </div>
          </div>
          <p className={`text-3xl mb-1 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{stats.totalResidents}</p>
          <p className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Residents</p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{stats.activeResidents} Active Residents</p>
        </div>

        <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 ${theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-50'} rounded-xl`}>
              <AlertTriangle className={`w-6 h-6 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
            </div>
            {/* Trend placeholder */}
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <span>--</span>
            </div>
          </div>
          <p className={`text-3xl mb-1 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{stats.activeComplaints}</p>
          <p className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Active Complaints</p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{stats.pendingComplaints} Pending Complaints</p>
        </div>

        <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-50'} rounded-xl`}>
              <CreditCard className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
            {/* Trend placeholder */}
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <span>--</span>
            </div>
          </div>
          <p className={`text-3xl mb-1 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{stats.totalBillsDue.toLocaleString()} Rs</p>
          <p className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Bills Due Amount</p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{stats.unpaidBillsCount} Unpaid Bills</p>
        </div>

        <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-50'} rounded-xl`}>
              <Bell className={`w-6 h-6 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} />
            </div>
            {/* Trend placeholder */}
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <span>--</span>
            </div>
          </div>
          <p className={`text-3xl mb-1 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>{stats.activeNotices}</p>
          <p className={`mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Active Notices</p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>posted on board</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
          <h3 className={`text-lg mb-4 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Platform Activity (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={platformActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333333' : '#f0f0f0'} />
              <XAxis dataKey="time" stroke={theme === 'dark' ? '#999' : '#999'} />
              <YAxis stroke={theme === 'dark' ? '#999' : '#999'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F1F1F' : '#fff',
                  border: `1px solid ${theme === 'dark' ? '#333333' : '#e5e7eb'}`,
                  color: theme === 'dark' ? '#F2F2F2' : '#000'
                }}
              />
              <Line type="monotone" dataKey="activity" stroke="#00c878" strokeWidth={2} dot={{ fill: '#00c878', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`${theme === 'dark' ? 'bg-[#1F1F1F] border-[#333333]' : 'bg-white border-gray-100'} rounded-xl p-6 shadow-sm border`}>
          <h3 className={`text-lg mb-4 ${theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}`}>Complaint Resolution (Weekly)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={complaintResolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#333333' : '#f0f0f0'} />
              <XAxis dataKey="day" stroke={theme === 'dark' ? '#999' : '#999'} />
              <YAxis stroke={theme === 'dark' ? '#999' : '#999'} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F1F1F' : '#fff',
                  border: `1px solid ${theme === 'dark' ? '#333333' : '#e5e7eb'}`,
                  color: theme === 'dark' ? '#F2F2F2' : '#000'
                }}
              />
              <Bar dataKey="resolved" fill="#00c878" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pending" fill={theme === 'dark' ? '#333333' : '#e0e0e0'} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}