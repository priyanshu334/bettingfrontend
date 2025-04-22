'use client';

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, Smartphone, Lock, Trophy } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Get the login function from the auth store
  const login = useAuthStore((state) => state.login);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      if (!data.token) {
        throw new Error('Authentication token not received');
      }

      // Use the auth store to handle login
      login({
        token: data.token,
        user: {
          _id: data._id,
          fullName: data.fullName,
          phone: data.phone,
          money: data.money
        }
      });

      toast.success('Login successful! Redirecting...');
      router.push('/');

    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-r from-orange-700 to-orange-500">
      {/* Left side - Cricket/IPL themed image */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative z-10 p-8 max-w-md text-white">
          <div className="flex items-center mb-8">
            <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center shadow-lg mr-4">
              <Trophy className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold">Samrat Online Booking</h1>
          </div>
          
          <h2 className="text-4xl font-bold mb-6">Cricket Betting Made Easy</h2>
          <p className="text-xl mb-8">Place your bets on IPL matches and win big rewards. The most trusted cricket betting platform in India.</p>
          
          <div className="flex items-center mt-8 space-x-4">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">24/7</span>
              <span className="text-sm">Support</span>
            </div>
            <div className="h-12 w-px bg-orange-300"></div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">100%</span>
              <span className="text-sm">Secure</span>
            </div>
            <div className="h-12 w-px bg-orange-300"></div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold">Fast</span>
              <span className="text-sm">Payouts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="md:hidden flex flex-col items-center mb-8">
            <div className="h-16 w-16 bg-orange-600 rounded-full flex items-center justify-center shadow-lg mb-4">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-orange-600">Samrat Online Booking</h1>
            <p className="text-sm text-gray-500">IPL Cricket Betting</p>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Login to Your Account</h2>
          <p className="text-gray-500 mb-8">The IPL season is on! Don't miss out on the action.</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Smartphone className="h-5 w-5 text-orange-500" />
                </div>
                <Input 
                  id="phone"
                  type="tel" 
                  name="phone"
                  placeholder="Enter your 10-digit number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 py-3 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg" 
                  required
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit phone number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                <a href="/forgot-password" className="text-sm font-medium text-orange-600 hover:text-orange-500">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-5 w-5 text-orange-500" />
                </div>
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 py-3 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-lg"
                  required
                  minLength={6}
                />
                <button 
                  type="button" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <Checkbox 
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded" 
              /> 
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me for 30 days
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium text-base shadow-md transition-colors disabled:opacity-70"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-500">New to Samrat Online Booking?</span>
            <a href="/signup" className="text-sm font-medium text-orange-600 hover:text-orange-500 ml-1">
              Create an account
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-2">Need assistance?</div>
              <div className="flex items-center justify-center text-orange-600 font-bold">
                <Smartphone className="h-4 w-4 mr-2" />
                <span>+91-8602966827</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;