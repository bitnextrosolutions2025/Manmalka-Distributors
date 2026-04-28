import React, { useEffect, useState } from 'react';
import { Clock, LogIn, LogOut, Users, TrendingUp, Calendar } from 'lucide-react';
import loginService from '../services/loginService';

/**
 * UserLoginTracker Component
 * Displays login/logout history and statistics for admin
 * Shows all users' login and logout times with session duration
 */
export default function UserLoginTracker() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, today, active
  const [sortBy, setSortBy] = useState('recent'); // recent, oldest, duration

  useEffect(() => {
    fetchLoginData();
  }, []);

  const fetchLoginData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch both records and stats
      const [recordsData, statsData] = await Promise.all([
        loginService.getAllLoginRecords(),
        loginService.getLoginStats()
      ]);

      if (recordsData.success) {
        setRecords(recordsData.records);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch login data');
      console.error('Error fetching login data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRecords = () => {
    let filtered = [...records];

    // Apply filter
    if (filter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(r => new Date(r.loginTime) >= today);
    } else if (filter === 'active') {
      filtered = filtered.filter(r => !r.logoutTime);
    }

    // Apply sorting
    if (sortBy === 'duration') {
      filtered.sort((a, b) => (b.sessionDuration || 0) - (a.sessionDuration || 0));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.loginTime) - new Date(b.loginTime));
    }
    // 'recent' is already sorted by default

    return filtered;
  };

  const filteredRecords = getFilteredRecords();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading login records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br mt-11 from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-8 h-8 text-blue-600" />
            User Login & Logout Tracker
          </h1>
          <p className="text-gray-600 mt-2">Monitor user login sessions and activity</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Logins</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalLogins}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">This Week</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.weekLogins}</p>
                </div>
                <Calendar className="w-8 h-8 text-indigo-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-cyan-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Today</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stats.todayLogins}
                  </p>
                </div>
                <LogIn className="w-8 h-8 text-cyan-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Users Today</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stats.uniqueUsersToday}</p>
                </div>
                <Users className="w-8 h-8 text-teal-600 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded-lg">
            <p className="text-red-800 font-medium">{error}</p>
            <button
              onClick={fetchLoginData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="all">All Records</option>
                <option value="today">Today Only</option>
                <option value="active">Currently Active</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="duration">Longest Session</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchLoginData}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Login Records Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No login records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Username</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Login Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Logout Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{record.username}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-600 text-sm">{record.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <LogIn className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">
                            {loginService.formatDateTime(record.loginTime)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {record.logoutTime ? (
                          <div className="flex items-center gap-2">
                            <LogOut className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-gray-700">
                              {loginService.formatDateTime(record.logoutTime)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-orange-600 font-medium">Ongoing...</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-700">
                          {loginService.formatDuration(record.sessionDuration)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {record.logoutTime ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Logged Out
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredRecords.length}</span> of{' '}
              <span className="font-medium">{records.length}</span> records
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
