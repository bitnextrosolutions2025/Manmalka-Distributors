# Location Tracking Feature - Quick Setup Guide

## ✅ What's Been Implemented

### Backend
- ✅ Location model with MongoDB schema
- ✅ Location REST API routes (create, read, logout)
- ✅ Socket.IO server with real-time broadcasting
- ✅ Automatic data cleanup (30-day TTL)
- ✅ Status tracking (online/offline)

### Frontend
- ✅ Geolocation hook for browser location access
- ✅ Socket.IO client service
- ✅ Location tracking component with permission handling
- ✅ Admin live map dashboard (Leaflet)
- ✅ Throttled location updates (every 5 minutes)
- ✅ Real-time map updates via Socket.IO

### Utilities & Services
- ✅ Throttle/debounce functions
- ✅ Distance calculation utility
- ✅ Location API service

---

## 🚀 Quick Start - 5 Steps to Enable Location Tracking

### Step 1: Environment Variables

**Server `.env`**
```
PORT=5000
mongoURI=your_mongodb_uri
JWT_SECRET=your_secret
FRONTEND_URL=http://localhost:5173
```

**Client `.env`**
```
VITE_API_URL=http://localhost:5000
```

### Step 2: Update App.jsx / Main Router

Add the LocationTracker component to your main App component:

```jsx
import { useContext } from 'react';
import LocationTracker from './components/LocationTracker';
import AdminDashboard from './pages/AdminDashboard';
import AdminProtectedRoute from './components/AdminProtectedRoute';

function App() {
  // Get isLoggedIn and userId from your existing context
  const { isLoggedIn, user } = useContext(UserContext); // or your auth context

  return (
    <>
      {/* Add LocationTracker at root level */}
      <LocationTracker 
        isLoggedIn={isLoggedIn} 
        userId={user?.userId}
        onPermissionDenied={() => {
          console.log('User denied location permission');
          // Optional: show a notification
        }}
      />

      <Navbar />
      <Routes>
        {/* Your existing routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Add admin dashboard route */}
        <Route
          path="/admin/dashboard"
          element={<AdminProtectedRoute element={<AdminDashboard />} />}
        />
        
        {/* Other routes... */}
      </Routes>
    </>
  );
}

export default App;
```

### Step 3: Update Login Component

Make sure your login page is properly setting user context:

```jsx
// In your Login.jsx
import { useContext } from 'react';
import UserDataContext from '../contexts/UserdataContext'; // or your context name

const Login = () => {
  const { setUser, setIsLoggedIn } = useContext(UserDataContext);

  const handleLoginSuccess = (userData) => {
    // Store user data in context
    setUser(userData);
    setIsLoggedIn(true);
    
    // Store in localStorage for socket.io service
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Navigate to dashboard
    navigate('/dashboard');
  };

  // ... rest of login logic
};
```

### Step 4: Update Logout Handler

Update your logout function to mark user as offline:

```jsx
import locationAPI from '../services/locationService';
import socketService from '../services/socketService';

const handleLogout = async () => {
  try {
    // Your existing logout logic
    await authService.logout();
    
    // Mark location as offline
    try {
      await locationAPI.logout();
    } catch (err) {
      console.error('Location logout error:', err);
    }
    
    // Notify socket server
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.userId) {
      socketService.logout(user.userId);
    }
    
    // Clear user data
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    
    // Redirect to login
    navigate('/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
```

### Step 5: Update AdminProtectedRoute

Ensure your AdminProtectedRoute is checking for admin role:

```jsx
// client/src/components/AdminProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import UserDataContext from '../contexts/UserdataContext'; // adjust path

const AdminProtectedRoute = ({ element }) => {
  const { user, isLoggedIn } = useContext(UserDataContext);

  // Check if user is logged in and is an admin
  // Adjust the admin check based on your User schema
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default AdminProtectedRoute;
```

---

## 📋 File Structure After Implementation

```
server/
├── models/
│   ├── User.js
│   ├── Order.js
│   └── Location.js  ✨ NEW
├── routes/
│   ├── auth.js
│   ├── order.js
│   └── location.js  ✨ NEW
├── socket/
│   └── locationHandler.js  ✨ NEW
└── index.js  (UPDATED with Socket.IO)

client/src/
├── components/
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   ├── AdminProtectedRoute.jsx
│   ├── LocationTracker.jsx  ✨ NEW
│   └── AdminLiveMap.jsx  ✨ NEW
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   └── AdminDashboard.jsx  ✨ NEW
├── services/
│   ├── authService.js
│   ├── socketService.js  ✨ NEW
│   └── locationService.js  ✨ NEW
├── hooks/
│   └── useGeolocation.js  ✨ NEW
└── utils/
    └── locationUtils.js  ✨ NEW
```

---

## 🧪 Testing the Implementation

### Test 1: Permission Prompt
1. Login to the app
2. Should see location permission prompt
3. Click "Allow Location" to enable tracking
4. Check browser console for "Socket.IO connected"

### Test 2: Location Updates
1. After allowing permission, location should update every 5 minutes
2. Check MongoDB: `db.locations.findOne()` should have your data
3. Admin can see location in real-time on map

### Test 3: Admin Dashboard
1. Login as admin user
2. Navigate to `/admin/dashboard`
3. Should see Leaflet map with user markers
4. Markers should update in real-time as users move

### Test 4: Logout
1. Logout from the app
2. Your marker should become gray/offline on admin map
3. After a few seconds, marker should disappear

### Test 5: Multiple Users
1. Open app in multiple windows/browsers
2. Login as different users
3. Admin dashboard should show all users
4. Each location updates independently

---

## 🔧 Customization Options

### Change Update Interval
In `LocationTracker.jsx`, modify the throttle delay:

```jsx
// Default: 300000ms (5 minutes)
const throttledLocationUpdate = throttle(
  async (latitude, longitude, accuracy) => {
    // ...
  },
  600000 // Change to 10 minutes
);
```

### Change Map Style
In `AdminLiveMap.jsx`, modify Leaflet tile provider:

```jsx
// Other providers:
// MapBox: https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/...
// Stadia: https://tiles.stadiamaps.com/tiles/stamen_terrain/...
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);
```

### Disable Location Tracking for Specific Users
Add a flag to User model and check in LocationTracker:

```jsx
if (user?.disableTracking) {
  return null; // Don't show permission prompt
}
```

### Add Location History
Extend Location API to fetch historical locations:

```jsx
const locationHistory = await locationAPI.getUserLocationHistory(userId, days: 7);
```

---

## 🐛 Common Issues & Solutions

### Issue: Map doesn't load
- Clear browser cache
- Ensure Leaflet CSS is imported
- Check browser console for errors

### Issue: No real-time updates
- Check Socket.IO connection status in browser DevTools
- Verify FRONTEND_URL in server .env
- Check firewall blocking WebSocket

### Issue: Location permission keeps prompting
- Browser cache issue - clear browser data
- Check permissions in browser settings
- May need HTTPS (browsers require it for geo in production)

### Issue: Admin can't see users
- Verify user is marked as admin in database
- Check AdminProtectedRoute logic
- Check Socket.IO server logs for broadcasts

---

## 📚 Additional Resources

- **Full Documentation**: See `LOCATION_TRACKING_GUIDE.md`
- **Leaflet Docs**: https://leafletjs.com/
- **Socket.IO Docs**: https://socket.io/docs/
- **Geolocation API**: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API

---

## ✨ Next Steps (Optional Enhancements)

1. **Add role field to User model**
   ```javascript
   role: { type: String, enum: ['user', 'admin'], default: 'user' }
   ```

2. **Add location history tracking**
   - Create LocationHistory model
   - Store all location updates (not just latest)

3. **Add geofencing alerts**
   - Alert admins when user leaves delivery zone
   - Automatic status updates

4. **Add route optimization**
   - Calculate efficient delivery routes
   - Estimate delivery times

5. **Mobile app version**
   - React Native with expo-location
   - Background location tracking

---

## 💡 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review `LOCATION_TRACKING_GUIDE.md` for detailed information
3. Check server logs: `console.log` output in terminal
4. Check browser console: Developer Tools → Console tab
5. Check MongoDB: Verify Location collection exists and has data

**Happy tracking! 🚀**
