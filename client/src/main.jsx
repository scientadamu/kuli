import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Sales from './pages/Sales'
import Records from './pages/Records'
import Upload from './pages/Upload'
import Invoice from './pages/Invoice'
import Header from './components/Header'
import Footer from './components/Footer'
import './styles.css'
import About from './pages/About'
import Contact from './pages/Contact'

function App(){
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path='/' element={<Landing/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/sales' element={<Sales/>} />
        <Route path='/records' element={<Records/>} />
        <Route path='/upload' element={<Upload/>} />
        <Route path='/about' element={<About/>} />
        <Route path='/contact' element={<Contact/>} />
        <Route path='/invoice/:id' element={<Invoice/>} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
