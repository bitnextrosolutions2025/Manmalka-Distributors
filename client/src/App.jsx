import { useContext, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLogin from './pages/AdminLogin'
import Navbar from './components/Navbar'
import Order from './pages/Order'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import AllOrderShow from './pages/AllOrderShow'
import UserAllOrder from './pages/UserAllOrder'
import { useUserData } from './contexts/UserdataContext'
import LocationTracker from './components/LocationTracker';
import AdminDashboard from './pages/AdminDashboard';
// import UserDataContext from './contexts/UserdataContext'
function App() {
  const { useralldata } = useUserData();
  return (
    <>
      <BrowserRouter>
        <LocationTracker
          isLoggedIn={useralldata}
          userId={useralldata?.userId}
          onPermissionDenied={() => {
            // Optional: Show a notification that location tracking is disabled
            console.warn('User denied location permission');
          }}
        />

        <Navbar />
        <Routes>
          <Route path='/' element={
            <ProtectedRoute>
              <Order />
            </ProtectedRoute>
          } />
          <Route path='/login' element={
            <Login />
          } />
          <Route path='/register' element={
            <AdminProtectedRoute>
              <Register />
            </AdminProtectedRoute>
          } />
          <Route path='/admin-login' element={<AdminLogin />} />
          <Route path='/allorder' element={
            <AdminProtectedRoute>
              <AllOrderShow />
            </AdminProtectedRoute>
          } />
          <Route path='/order' element={
            <ProtectedRoute>
              <UserAllOrder />
            </ProtectedRoute>
          } /> 
          <Route
            path="/dashboard"
            element={ <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>}
          />
        </Routes>
      </BrowserRouter>
    </>
  )
}
export default App
