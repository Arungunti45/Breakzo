import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function LoginOTP() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');

  // TEMP OTP: hardcoded to "1234" for development
  const TEMP_OTP = '1234';

  const handleSendOTP = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    toast.success('OTP sent! (Use temp OTP: 1234)');
    setStep('otp');
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error('Please enter a valid OTP');
      return;
    }
    if (otp === TEMP_OTP) {
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('role', role);
      toast.success('Login successful!');
      navigate(role === 'admin' ? '/admin' : '/user');
    } else {
      toast.error('Invalid OTP. Hint: use 1234');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <img src="/breakzo.png" alt="Breakzo Logo" className="h-20 w-auto mx-auto object-contain rounded-2xl drop-shadow-md" />
          <p className="text-gray-500 mt-2">Login with your phone number</p>
        </div>

        {/* Role selector */}
        <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setRole('student')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${role === 'student' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            Student
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${role === 'admin' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            Admin
          </button>
          <button
            onClick={() => setRole('kitchen')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${role === 'kitchen' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
          >
            Kitchen
          </button>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                maxLength={10}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 4-digit OTP"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                maxLength={4}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              Change phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
