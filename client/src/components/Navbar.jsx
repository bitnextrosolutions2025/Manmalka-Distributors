import React, { useState } from 'react'
import logo from '../assets/logo.png'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md border-b border-blue-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center flex-shrink-0">
            <img 
              src={logo} 
              alt="Logo" 
              className="h-10 w-auto"
            />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-6 lg:space-x-8">
            <a 
              href="#" 
              className="text-gray-700 hover:text-blue-600 font-medium transition duration-200 text-sm lg:text-base"
            >
              Home
            </a>
            <a 
              href="#" 
              className="text-gray-700 hover:text-blue-600 font-medium transition duration-200 text-sm lg:text-base"
            >
              About
            </a>
            <a 
              href="#" 
              className="text-gray-700 hover:text-blue-600 font-medium transition duration-200 text-sm lg:text-base"
            >
              Services
            </a>
            <a 
              href="#" 
              className="text-gray-700 hover:text-blue-600 font-medium transition duration-200 text-sm lg:text-base"
            >
              Contact
            </a>
          </div>

          {/* Desktop Login Button */}
          <div className="hidden md:block">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200 text-sm lg:text-base">
              Login
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button 
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 transition duration-200"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <a 
              href="#" 
              className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition duration-200 rounded"
            >
              Home
            </a>
            <a 
              href="#" 
              className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition duration-200 rounded"
            >
              About
            </a>
            <a 
              href="#" 
              className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition duration-200 rounded"
            >
              Services
            </a>
            <a 
              href="#" 
              className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition duration-200 rounded"
            >
              Contact
            </a>
            <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200">
              Login
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
