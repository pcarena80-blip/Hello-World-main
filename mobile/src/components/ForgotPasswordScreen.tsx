import { useState } from 'react';
import { ArrowLeft, Mail, Lock, Building2 } from 'lucide-react';

export default function ForgotPasswordScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="pt-12 pb-6 px-8">
        <button onClick={() => onNavigate('login')} className="mb-6">
          <ArrowLeft className="w-6 h-6 text-gray-700" strokeWidth={1.5} />
        </button>
        
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md" 
            style={{ background: 'linear-gradient(180deg, #003E2F 0%, #027A4C 100%)' }}>
            <Building2 className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-gray-900 mb-2" style={{ fontSize: '22px', fontWeight: 600 }}>
            Reset Password
          </h2>
          <p className="text-gray-500" style={{ fontSize: '14px' }}>
            {step === 'email' && 'Enter your email to receive reset code'}
            {step === 'otp' && 'Enter the code sent to your email'}
            {step === 'reset' && 'Create a new password'}
          </p>
        </div>
      </div>

      <div className="flex-1 px-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          {step === 'email' && (
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

              <button
                onClick={() => setStep('otp')}
                className="w-full py-3.5 rounded-xl text-white shadow-md hover:shadow-lg transition-all"
                style={{ 
                  background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                Send Reset Code
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-5">
              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C] text-center tracking-widest"
                  style={{ fontSize: '20px', fontWeight: 500 }}
                />
              </div>

              <button
                onClick={() => setStep('reset')}
                className="w-full py-3.5 rounded-xl text-white shadow-md hover:shadow-lg transition-all"
                style={{ 
                  background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                Verify Code
              </button>

              <button
                onClick={() => setStep('email')}
                className="text-[#027A4C] text-center w-full"
                style={{ fontSize: '14px', fontWeight: 500 }}
              >
                Resend Code
              </button>
            </div>
          )}

          {step === 'reset' && (
            <div className="space-y-5">
              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                    style={{ fontSize: '15px' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                    style={{ fontSize: '15px' }}
                  />
                </div>
              </div>

              <button
                onClick={() => onNavigate('login')}
                className="w-full py-3.5 rounded-xl text-white shadow-md hover:shadow-lg transition-all"
                style={{ 
                  background: 'linear-gradient(90deg, #003E2F 0%, #027A4C 100%)',
                  fontSize: '16px',
                  fontWeight: 500
                }}
              >
                Reset Password
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
