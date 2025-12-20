import { useState } from 'react';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

export default function LoginScreen({
  onNavigate,
  onLogin
}: {
  onNavigate: (screen: string) => void;
  onLogin: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.auth.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success('Login successful!');
      onLogin();
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top Section with Icon */}
      <div className="pt-16 pb-8 px-8 text-center">
        <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(180deg, #003E2F 0%, #027A4C 100%)' }}>
          <Building2 className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="text-gray-900 mb-2" style={{ fontSize: '24px', fontWeight: 600 }}>
          UrbanEase
        </h2>
        <p className="text-gray-500" style={{ fontSize: '14px' }}>
          Welcome back! Please login to continue
        </p>
      </div>

      {/* Login Card */}
      <div className="flex-1 px-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="space-y-5">
            <div>
              <label className="block text-gray-700 mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                  style={{ fontSize: '15px' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                  style={{ fontSize: '15px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#027A4C] focus:ring-[#027A4C]"
                />
                <span className="text-gray-600" style={{ fontSize: '14px' }}>Remember me</span>
              </label>
              <button
                onClick={() => onNavigate('forgot-password')}
                className="text-[#027A4C]"
                style={{ fontSize: '14px', fontWeight: 500 }}
              >
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)',
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              {isLoading ? 'Logging in...' : 'Login'}
              {!isLoading && <ArrowRight className="w-5 h-5" strokeWidth={2} />}
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-gray-600" style={{ fontSize: '14px' }}>
          Don't have an account?{' '}
          <button onClick={() => onNavigate('signup')} className="text-[#027A4C]" style={{ fontWeight: 500 }}>
            Sign Up Now
          </button>
        </p>
      </div>
    </div>
  );
}
