# Location Tracking Feature - Architecture & Flow Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MANMALKA DISTRIBUTORS                        │
│                   Real-Time Location Tracking System                 │
└─────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │  MongoDB Atlas  │
                              │   Locations DB  │
                              │    (TTL Index)  │
                              └────────┬────────┘
                                       ▲
                                       │
                ┌──────────────────────┼──────────────────────┐
                │                      │                      │
                │                      │                      │
            ┌───▼────┐            ┌───▼────┐            ┌───▼────┐
            │ Socket │            │ Socket │            │ Socket │
            │ Events │            │ Events │            │ Events │
            └───┬────┘            └───┬────┘            └───┬────┘
                │                      │                      │
                │    ┌──────────────────┼──────────────────┐  │
                │    │                  │                  │  │
         ┌──────▼────▼──┐        ┌──────▼────▼──┐   ┌─────▼──▼──────┐
         │ Node.js Server       │ REST API      │   │ Socket Handler
         │ + Express            │ Endpoints     │   │ + Broadcasts
         └──────┬────────┘      └───────────────┘   └───────────────┘
                │
                │ (TCP/WebSocket)
    ┌───────────┼──────────────────┐
    │           │                  │
┌───▼──────┐    │            ┌─────▼──────┐
│  React   │    │            │  React     │
│  User    │    │            │  Admin     │
│  App     │    │            │  Dashboard │
│          │    │            │  (Leaflet) │
└──────────┘    │            └────────────┘
    │           │
    │ (Socket.IO + REST)
    │
    └───────────┘
```

## User Login & Tracking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER LOGIN & TRACKING FLOW                    │
└─────────────────────────────────────────────────────────────────┘

1. USER LOGIN
   ┌──────────────┐
   │ User clicks  │
   │   LOGIN      │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────┐
   │ Enter credentials    │
   │ Submit form          │
   └──────┬───────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ Backend validates & issues JWT token │
   └──────┬───────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────┐
   │ Frontend:                            │
   │ - Store user in context              │
   │ - Store user in localStorage         │
   │ - Set httpOnly auth cookie           │
   └──────┬───────────────────────────────┘
          │
          ▼

2. PERMISSION PROMPT (LocationTracker component detects login)
   ┌──────────────────────────────────────┐
   │ Show permission modal:               │
   │ "May we track your location?"        │
   │ [Not Now] [Allow Location]           │
   └──────┬─────────────────────┬─────────┘
          │                     │
    [Deny]│                     │[Allow]
          │                     │
          ▼                     ▼
    ┌─────────────┐    ┌─────────────────────┐
    │ Stop (no    │    │ Browser requests    │
    │ tracking)   │    │ geolocation perm.   │
    │             │    │ [Allow] [Deny]      │
    └─────────────┘    └──────┬──────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                [Deny]                 [Allow]
                    │                     │
                    ▼                     ▼
            ┌─────────────────┐  ┌──────────────────┐
            │ Stop tracking   │  │ Start tracking   │
            │ No data sent    │  │ Begin geolocation│
            └─────────────────┘  └────────┬─────────┘
                                          │
                                          ▼

3. CONTINUOUS TRACKING (Every 5 minutes - throttled)
   ┌────────────────────────────────────────────┐
   │ navigator.geolocation.watchPosition        │
   │ - Gets latitude, longitude, accuracy       │
   │ - Runs every position change               │
   └────────┬───────────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────┐
   │ Throttle function (5 minute delay)   │
   │ Only send if 5 mins since last send  │
   └────────┬───────────────────────────┬─┘
            │                           │
         [Send]                      [Drop]
            │                           │
            ├───────────┬───────────────┘
            │           │
            ▼           ▼
   ┌─────────────────────────────────────────────┐
   │ Update location via:                        │
   │ 1. REST API: POST /api/v1/location/update   │
   │ 2. Socket.IO: emit 'location:update'        │
   └────────┬──────────────────────────────┬─────┘
            │                              │
            ▼                              ▼
   ┌──────────────────────┐    ┌─────────────────────┐
   │ Save to MongoDB      │    │ Broadcast to admins │
   │ (Location model)     │    │ Socket: location:   │
   │                      │    │ updated             │
   └──────────────────────┘    └─────────────────────┘

4. LOGOUT
   ┌──────────────┐
   │ User clicks  │
   │   LOGOUT     │
   └──────┬───────┘
          │
          ▼
   ┌──────────────────────────────────────────┐
   │ 1. Call locationAPI.logout()             │
   │    → POST /api/v1/location/logout        │
   │    → Mark user offline in DB             │
   │                                          │
   │ 2. socketService.logout(userId)          │
   │    → Emit 'location:logout' to server    │
   │                                          │
   │ 3. socketService.disconnect()            │
   │    → Close Socket.IO connection          │
   │                                          │
   │ 4. Stop geolocation tracking             │
   │    → navigator.geolocation.clearWatch()  │
   │                                          │
   │ 5. Clear state & localStorage            │
   │    → setUser(null), setIsLoggedIn(false) │
   │    → localStorage.removeItem('user')     │
   └──────┬───────────────────────────────────┘
          │
          ▼
   ┌──────────────────────┐
   │ Redirect to LOGIN    │
   └──────────────────────┘

5. ADMIN DASHBOARD (Real-time tracking)
   ┌──────────────────────────────────────────┐
   │ Admin navigates to /admin/dashboard      │
   └──────┬───────────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────────┐
   │ AdminLiveMap component:                  │
   │ 1. Request all users: location:request-all
   │ 2. Initialize Leaflet map                │
   │ 3. Add markers for each user             │
   └──────┬───────────────────────────────────┘
          │
          ▼
   ┌──────────────────────────────────────────┐
   │ Listen to Socket events:                 │
   │ - location:updated                       │
   │ - location:user-offline                  │
   │                                          │
   │ On each event:                           │
   │ - Update marker position                 │
   │ - Update user info popup                 │
   │ - Change color (green/gray)              │
   └──────────────────────────────────────────┘
```

## Socket.IO Event Flow

```
CLIENT SIDE                          SERVER SIDE
═══════════════════════════════════════════════════════════════

┌─────────────────┐
│  User Updates   │
│  Location       │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐     ┌──────────────────────────────┐
│ emit('location:update', {    │────►│ on('location:update', (data) │
│   userId,                    │     │ {                             │
│   latitude,                  │     │   Save to MongoDB             │
│   longitude,                 │     │   Add to activeUsers map      │
│   accuracy                   │     │   Broadcast to all clients    │
│ })                           │     │ })                            │
└──────────────────────────────┘     └──────────────────────────────┘


┌──────────────────────────────┐     ┌──────────────────────────────┐
│ listen                       │     │ emit('location:updated', {   │
│ ('location:updated', (data)  │◄────│   userId,                    │
│  => update marker position)  │     │   username,                  │
└──────────────────────────────┘     │   latitude,                  │
                                     │   longitude,                 │
                                     │   lastUpdated,               │
                                     │   status                     │
                                     │ })                           │
                                     │ // To all connected clients   │
                                     └──────────────────────────────┘


┌──────────────────────────────┐     ┌──────────────────────────────┐
│ emit('location:logout', {    │────►│ on('location:logout', (data) │
│   userId                     │     │ {                             │
│ })                           │     │   Mark offline in DB          │
└──────────────────────────────┘     │   Remove from activeUsers     │
                                     │   Broadcast user:offline      │
                                     │ })                            │
                                     └──────────────────────────────┘


┌──────────────────────────────┐     ┌──────────────────────────────┐
│ listen                       │     │ emit('location:user-offline',│
│ ('location:user-offline',    │◄────│ {                             │
│  (data) => remove marker)    │     │   userId,                    │
└──────────────────────────────┘     │   lastUpdated                │
                                     │ })                           │
                                     │ // To all connected clients   │
                                     └──────────────────────────────┘


AUTOMATIC ON DISCONNECT
═════════════════════════════════════════════════════════════════

Client disconnects (close tab, logout, network loss)
                    │
                    ▼
Server 'disconnect' event
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼────┐           ┌────▼────┐
    │ Find    │           │ Broadcast
    │ userId  │           │ user:
    │ from    │           │ offline
    │ socket  │           │ event
    │ map     │           │ to all
    └────┬────┘           └────┬────┘
         │                     │
         ▼                     ▼
    ┌──────────────────┐  ┌──────────────────┐
    │ Mark offline in  │  │ Admin dashboard  │
    │ MongoDB          │  │ removes marker   │
    └──────────────────┘  └──────────────────┘
```

## Database Schema Relationships

```
┌───────────────────────────────────────────┐
│              User Collection              │
├───────────────────────────────────────────┤
│ _id: ObjectId                             │
│ username: String                          │
│ email: String                             │
│ password: String (hashed)                 │
│ role: String (user/admin)                 │
│ createdAt: Date                           │
└───────────────────────────────────────────┘
            │
            │ One-to-Many
            │ (through Location.user)
            │
            ▼
┌───────────────────────────────────────────┐
│         Location Collection               │
├───────────────────────────────────────────┤
│ _id: ObjectId                             │
│ user: ObjectId (ref: User)  ◄─────────┐   │
│ latitude: Number                       │   │
│ longitude: Number                      │   │
│ accuracy: Number                       │   │
│ status: String (online/offline)        │   │
│ lastUpdated: Date                      │   │
│ createdAt: Date (TTL: 30 days)         │   │
│ __v: Number                            │   │
│                                        │   │
│ Indexes:                               │   │
│ - user (for quick user lookup)         │   │
│ - user + lastUpdated (compound)        │   │
│ - createdAt (TTL auto-delete)          │   │
└────────────────────────────────────────┘
```

## REST API Call Sequence

```
1. Update Location
   ───────────────────────────────────────────────────
   Client                       Backend         DB
   │                            │              │
   │ POST /api/v1/location/update
   │ {latitude, longitude}      │              │
   ├──────────────────────────►│              │
   │                            │              │
   │                            │ findOneAndUpdate({user: userId})
   │                            ├─────────────►│
   │                            │◄─────────────┤
   │◄──────────────────────────┤              │
   │ {success, data}            │              │

2. Get All Locations (Admin)
   ───────────────────────────────────────────────────
   Client                       Backend         DB
   │                            │              │
   │ GET /api/v1/location/all-users
   ├──────────────────────────►│              │
   │                            │              │
   │                            │ find({status: 'online'})
   │                            │ .populate('user')
   │                            ├─────────────►│
   │                            │◄─────────────┤
   │◄──────────────────────────┤              │
   │ {success, data[], count}   │              │

3. Logout
   ───────────────────────────────────────────────────
   Client                       Backend         DB
   │                            │              │
   │ POST /api/v1/location/logout
   ├──────────────────────────►│              │
   │                            │              │
   │                            │ findOneAndUpdate({user: userId},
   │                            │ {status: 'offline'})
   │                            ├─────────────►│
   │                            │◄─────────────┤
   │◄──────────────────────────┤              │
   │ {success}                  │              │
```

## Component Communication

```
┌────────────────────────────────────────────────────┐
│                    App.jsx                         │
│              (Root Component)                      │
└──────────────┬──────────────────────────────────────┘
               │
        ┌──────┴──────┬──────────┬──────────┐
        │             │          │          │
        ▼             ▼          ▼          ▼
    ┌────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐
    │Navbar  │  │Location  │  │Routes  │  │UserContext
    │        │  │Tracker   │  │        │  │(State)
    └────────┘  └────┬─────┘  └───┬────┘  └──────────┘
                     │            │
         ┌───────────┘            │
         │                        │
         ▼                        ▼
    ┌─────────────┐      ┌──────────────────┐
    │Permission   │      │AdminDashboard    │
    │Modal        │      │                  │
    │             │      │ ┌──────────────┐ │
    └─────────────┘      │ │AdminLiveMap  │ │
                         │ │              │ │
                         │ │ ┌──────────┐ │ │
                         │ │ │Leaflet   │ │ │
                         │ │ │Map       │ │ │
                         │ │ │(Markers) │ │ │
                         │ │ └──────────┘ │ │
                         │ └──────────────┘ │
                         └──────────────────┘

Data Flow:
──────────

UserContext
    │
    ├─► LocationTracker component
    │   ├─► useGeolocation hook (gets coords)
    │   ├─► locationAPI.updateLocation() (REST)
    │   └─► socketService.updateLocation() (Socket)
    │
    └─► Navbar component
        └─► handleLogout() calls:
            ├─► locationAPI.logout()
            ├─► socketService.logout()
            └─► socketService.disconnect()

Socket.IO Service (Singleton)
    │
    ├─► AdminLiveMap component
    │   ├─► socketService.requestAllLocations()
    │   ├─► socketService.onLocationUpdated() listener
    │   ├─► socketService.onUserOffline() listener
    │   └─► Update Leaflet markers
    │
    └─► LocationTracker component
        └─► socketService.updateLocation() emitter
```

## Performance Flow

```
User Location Update (5-minute throttle)
═════════════════════════════════════════════════════════════════

Time: 0:00
  ├─ User position changes
  ├─ watchPosition callback triggered
  ├─ throttle() checks: 5 mins passed? NO
  └─ Drop event (no API call)

Time: 3:00
  ├─ User position changes
  ├─ watchPosition callback triggered
  ├─ throttle() checks: 5 mins passed? NO
  └─ Drop event (no API call)

Time: 5:00
  ├─ User position changes
  ├─ watchPosition callback triggered
  ├─ throttle() checks: 5 mins passed? YES
  ├─ Call locationAPI.updateLocation()
  │  └─ POST to /api/v1/location/update
  ├─ Call socketService.updateLocation()
  │  └─ emit 'location:update' to server
  └─ Last call time = 5:00

Time: 7:00
  ├─ User position changes
  ├─ watchPosition callback triggered
  ├─ throttle() checks: 5 mins passed? NO (2 mins only)
  └─ Drop event (no API call)

Result: Only 1 API call in 7 minutes instead of 3+
        Reduces server load by 60-70%
```

---

**This architecture ensures:**
- ✅ Real-time updates without flooding the server
- ✅ Efficient database queries with proper indexing
- ✅ Secure authentication and authorization
- ✅ Scalable Socket.IO broadcasting
- ✅ Clean separation of concerns
- ✅ Production-ready performance
