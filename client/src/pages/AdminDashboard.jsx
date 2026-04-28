import { AdminLiveMap } from '../components/AdminLiveMap';
import UserLoginTracker from '../components/UserLoginTracker';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Admin Dashboard page
 * Protected route - only accessible to admins
 * Displays real-time user locations on a live map and login/logout tracking
 */
export const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('map'); // 'map' or 'loginTracker'

    return (
        <div className="w-full">
            {/* Tab Navigation */}
            <div className="sticky top-16 z-40 bg-white border-b border-blue-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-0">
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`flex-1 sm:flex-none px-6 py-4 font-medium transition-colors border-b-2 ${
                                activeTab === 'map'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <Eye className="inline w-5 h-5 mr-2" />
                            Live Map
                        </button>
                        <button
                            onClick={() => setActiveTab('loginTracker')}
                            className={`flex-1 sm:flex-none px-6 py-4 font-medium transition-colors border-b-2 ${
                                activeTab === 'loginTracker'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <EyeOff className="inline w-5 h-5 mr-2" />
                            Login Tracker
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'map' && <AdminLiveMap />}
                {activeTab === 'loginTracker' && <UserLoginTracker />}
            </div>
        </div>
    );
};

export default AdminDashboard;
