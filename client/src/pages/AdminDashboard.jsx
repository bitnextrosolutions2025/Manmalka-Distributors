import { AdminLiveMap } from '../components/AdminLiveMap';

/**
 * Admin Dashboard page
 * Protected route - only accessible to admins
 * Displays real-time user locations on a live map
 */
export const AdminDashboard = () => {
    return (
        <div className="w-full">
            <AdminLiveMap />
        </div>
    );
};

export default AdminDashboard;
