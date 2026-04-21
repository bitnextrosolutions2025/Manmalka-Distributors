import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Navbar from './components/Navbar'
import Order from './pages/Order'
import ProtectedRoute from './components/ProtectedRoute'
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
          <Route path='/register' element={<Register />} />

        </Routes>
      </BrowserRouter>

    </>
  )
}

export default App
