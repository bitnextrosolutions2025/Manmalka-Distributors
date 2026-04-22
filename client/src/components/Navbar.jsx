import React, { useEffect, useState } from 'react'
import logo from '../assets/logo.png'
import { Menu, X, User, LogOut } from 'lucide-react' // Imported User and LogOut icons
import { useUserData } from '../contexts/UserdataContext.jsx';
import { authService } from '../services/authService.js';
import { Link, useNavigate } from 'react-router';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false) // State for modal
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false) // State for admin modal
  const { useralldata, setUseralldata } = useUserData()
  const navigate = useNavigate()

  useEffect(() => {
    console.log(useralldata)
  }, [useralldata])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen)
  }

  const toggleAdminModal = () => {
    setIsAdminModalOpen(!isAdminModalOpen)
  }

  const handleLogout = async() => {
    await authService.logout();
    window.location.href = "/login";
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('adminauth');
    setIsAdminModalOpen(false);
    navigate('/admin-login', { replace: true });
  }

  // Boolean check to see if user data exists
  const isLoggedIn = !!useralldata;
  const isAdminLoggedIn = !!localStorage.getItem('adminauth');

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md border-b border-blue-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center shrink-0">
              <img
                src={logo}
                alt="Logo"
                className="h-10 w-auto"
              />
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex space-x-6 lg:space-x-8">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition duration-200 text-sm lg:text-base">
                Home
              </Link>
              <Link to="/order" className="text-gray-700 hover:text-blue-600 font-medium transition duration-200 text-sm lg:text-base">
                 Check Order
              </Link>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition duration-200 text-sm lg:text-base">
                Services
              </a>
              <a href="#" className="text-gray-700 hover:text-blue-600 font-medium transition duration-200 text-sm lg:text-base">
                Contact
              </a>
            </div>

            {/* Desktop Login / Profile Button */}
            <div className="hidden md:flex gap-2">
              {isAdminLoggedIn ? (
                <button
                  onClick={toggleAdminModal}
                  className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 hover:text-purple-800 rounded-full transition duration-200 flex items-center justify-center"
                  title="Admin"
                >
                  <User size={24} />
                </button>
              ) : isLoggedIn ? (
                <button
                  onClick={toggleModal}
                  className="p-2 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-full transition duration-200 flex items-center justify-center"
                >
                  <User size={24} />
                </button>
              ) : (
                <Link to="/login">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200 text-sm lg:text-base">
                    Login
                  </button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
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
              <Link to="/" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition duration-200 rounded">
                Home
              </Link>
              <Link to='/order' className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition duration-200 rounded">
                Check Order
              </Link>
              <a href="#" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition duration-200 rounded">
                Services
              </a>
              <a href="#" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium transition duration-200 rounded">
                Contact
              </a>

              {/* Mobile Login / Profile Button */}
              {isLoggedIn ? (
                <button
                  onClick={toggleModal}
                  className="w-full mt-3 flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded transition duration-200"
                >
                  <User size={20} />
                  <span>View Profile</span>
                </button>
              ) : (
                <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200">
                  Login
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* User Profile Modal */}
      {isModalOpen && isLoggedIn && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50 px-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            {/* Close Modal Button */}
            <button
              onClick={toggleModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-200"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6 mt-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-3">
                <User size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">User Profile</h2>
            </div>

            {/* User Data Display */}
            <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</p>
                <p className="text-gray-900 font-medium">{useralldata.username}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</p>
                <p className="text-gray-900 font-medium">{useralldata.email}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">User ID</p>
                <p className="text-gray-900 font-mono text-sm break-all">{useralldata.userId}</p>
              </div>
            </div>

            {/* Logout Button */}
            <Link to='/order'><button
              className="w-full bg-blue-500 my-2 hover:bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200"
            >
              Check your Oder
            </button></Link>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {isAdminModalOpen && isAdminLoggedIn && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50 px-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            {/* Close Modal Button */}
            <button
              onClick={toggleAdminModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition duration-200"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-6 mt-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-3">
                <User size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
            </div>

            {/* Admin Info */}
            <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</p>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                  Admin Logged In
                </p>
              </div>
            </div>

            {/* Admin Navigation */}
            <Link to='/allorder'><button
              onClick={toggleAdminModal}
              className="w-full bg-purple-500 my-2 hover:bg-purple-600 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200"
            >
              View All Orders
            </button></Link>

            {/* Logout Button */}
            <button
              onClick={handleAdminLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  )
}