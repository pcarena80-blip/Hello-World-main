import { Search, Sun, Moon, Bell, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useRole } from '../contexts/RoleContext';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { role, toggleRole } = useRole();
  
  return (
    <header className={`${theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-white opacity-40' : 'text-gray-400'} w-5 h-5`} />
            <input
              type="text"
              placeholder="Search residents, bills, or complaints…"
              className={`w-full pl-12 pr-4 py-3 rounded-xl border ${
                theme === 'dark'
                  ? 'bg-[#1F1F1F] border-[#333333] text-[#F2F2F2] placeholder-gray-500 focus:border-[#00c878]'
                  : 'bg-white border-gray-200 focus:border-[#00c878]'
              } focus:outline-none focus:ring-2 focus:ring-[#00c878]/20`}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 ml-6">
          <button 
            onClick={toggleTheme}
            className={`p-3 rounded-xl ${theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-100'} transition-colors`}
          >
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-gray-600" />
            ) : (
              <Moon className="w-5 h-5 text-white opacity-70" />
            )}
          </button>
          <button className={`p-3 rounded-xl ${theme === 'dark' ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-100'} transition-colors relative`}>
            <Bell className={`w-5 h-5 ${theme === 'dark' ? 'text-white opacity-70' : 'text-gray-600'}`} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div 
            onClick={toggleRole}
            className={`flex items-center gap-3 pl-4 ${theme === 'dark' ? 'border-[#333333]' : 'border-gray-200'} border-l cursor-pointer`}
            title="Click to toggle role (Demo)"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#00c878] to-[#00e68a] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={theme === 'dark' ? 'text-[#F2F2F2]' : 'text-gray-900'}>
                {role === 'superadmin' ? 'Super Admin' : 'Admin'}
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {role === 'superadmin' ? 'City Manager' : 'City Staff'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}