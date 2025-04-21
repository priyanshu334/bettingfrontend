'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Home,  Gamepad } from 'lucide-react';

const NavigationBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={` left-0 w-full  transition-all duration-300 ${
      scrolled ? 'bg-gradient-to-r from-blue-900 to-indigo-900 shadow-lg py-2' : 'bg-gradient-to-r from-blue-800/90 to-indigo-800/90 backdrop-blur-md py-4'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Home Link */}
          <Link
            href="/"
            className="flex items-center space-x-2 text-white font-bold text-xl group"
          >
            <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-all duration-300">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="group-hover:text-blue-200 transition-colors duration-300">HOME</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/cricket"
              className="relative px-4 py-2 text-white font-medium group overflow-hidden rounded-lg"
            >
              <span className="relative z-10 flex items-center space-x-2 transition-colors duration-300 group-hover:text-blue-900">
             
                <span>Cricket</span>
              </span>
              <span className="absolute inset-0 bg-white/0 group-hover:bg-white transition-all duration-300 transform translate-y-full group-hover:translate-y-0 rounded-lg"></span>
            </Link>
            
            <Link
              href="/games"
              className="relative px-4 py-2 text-white font-medium group overflow-hidden rounded-lg"
            >
              <span className="relative z-10 flex items-center space-x-2 transition-colors duration-300 group-hover:text-blue-900">
                <Gamepad className="w-4 h-4" />
                <span>Games</span>
              </span>
              <span className="absolute inset-0 bg-white/0 group-hover:bg-white transition-all duration-300 transform translate-y-full group-hover:translate-y-0 rounded-lg"></span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors duration-300 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 animate-fadeDown">
            <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden">
              <Link
                href="/cricket"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10 border-b border-white/10"
              >
                
                <span>Cricket</span>
              </Link>
              <Link
                href="/games"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-white hover:bg-white/10"
              >
                <Gamepad className="w-5 h-5 text-blue-200" />
                <span>Games</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar;