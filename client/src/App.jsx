import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLogin from './pages/AdminLogin'
import Navbar from './components/Navbar'
import Order from './pages/Order'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import AllOrderShow from './pages/AllOrderShow'
import UserAllOrder from './pages/UserAllOrder'
function App() {
  return (
    <>
      <BrowserRouter>
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
        </Routes>
      </BrowserRouter>
    </>
  )
}
export default App
