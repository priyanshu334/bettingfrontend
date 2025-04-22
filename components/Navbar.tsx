"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores/authStore";

const Navbar: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get auth state from store
  const { token, user, isAuthenticated, logout } = useAuthStore();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <nav className="bg-gradient-to-r from-orange-600 to-red-800 shadow-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white p-0.5 ring-2 ring-white/30">
              <Image
                src="/img.jpeg"
                alt="Logo"
                width={64}
                height={64}
                className="object-cover w-full h-full rounded-full"
              />
            </div>
            <Link href="/" className="flex flex-col md:flex-row md:items-baseline">
              <span className="text-xl font-bold text-white">Samrat</span>
              <span className="hidden md:block text-lg text-blue-200 ml-1">Online Booking</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/rules" className="text-blue-100 hover:text-white transition-colors font-medium">
              Rules
            </Link>
            
            {/* Balance Card - Only show if authenticated */}
            {isAuthenticated && (
              <div className="flex items-center space-x-1 p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="px-3 py-1.5 rounded-md bg-indigo-900/60">
                  <div className="flex flex-col">
                    <span className="text-xs text-blue-200">Balance</span>
                    <span className="text-white font-medium">₹{user?.money?.toFixed(2) ?? "0.00"}</span>
                  </div>
                </div>
                <div className="px-3 py-1.5 rounded-md bg-indigo-900/60">
                  <div className="flex flex-col">
                    <span className="text-xs text-blue-200">Exposure</span>
                    <span className="text-white font-medium">₹0.00</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-1 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
                  >
                    <span className="text-white">{user?.fullName ?? "User"}</span>
                    <svg
                      className={`w-4 h-4 text-blue-200 transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-100 animate-fadeIn">
                      <div className="py-2 px-4 bg-gray-50 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                        <p className="text-xs text-gray-500">{user?.phone}</p>
                      </div>
                      <div className="py-1">
                        <Link 
                          href="/accounts" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Account Statement
                        </Link>
                        <Link 
                          href="/betHistory" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Bet History
                        </Link>
                        <Link 
                          href="/rules" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Rules
                        </Link>
                      </div>
                      <div className="py-1 border-t border-gray-100">
                        <Link 
                          href="/changePassword" 
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Change Password
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link 
                  href="/login" 
                  className="py-2 px-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/20 text-white"
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md bg-white/10 hover:bg-white/20 transition-colors focus:outline-none"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20 animate-fadeIn">
            {isAuthenticated && (
              <>
                <div className="flex justify-between items-center px-4 py-3 bg-white/10 rounded-lg mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-blue-200">Balance</span>
                    <span className="text-white font-medium">₹{user?.money?.toFixed(2) ?? "0.00"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-blue-200">Exposure</span>
                    <span className="text-white font-medium">₹0.00</span>
                  </div>
                </div>
                
                <div className="space-y-1 px-2">
                  <Link 
                    href="/rules" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Rules
                  </Link>
                  <Link 
                    href="/accounts" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Account Statement
                  </Link>
                  <Link 
                    href="/betHistory" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Bet History
                  </Link>
                  <Link 
                    href="/changePassword" 
                    className="block px-3 py-2 rounded-md text-base font-medium text-red-200 hover:bg-white/10 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Change Password
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-200 hover:bg-white/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
                
                <div className="px-4 py-3 mt-4">
                  <p className="text-white font-medium">{user?.fullName}</p>
                  <p className="text-xs text-blue-200">{user?.phone}</p>
                </div>
              </>
            )}
            
            {!isAuthenticated && (
              <div className="space-y-2 px-2">
                <Link 
                  href="/login" 
                  className="block w-full text-center px-4 py-2 rounded-md bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  href="/register" 
                  className="block w-full text-center px-4 py-2 rounded-md bg-white/20 text-white font-medium hover:bg-white/30 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;