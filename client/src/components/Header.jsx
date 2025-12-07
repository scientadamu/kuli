import React from 'react'
import { Link } from 'react-router-dom'

export default function Header(){
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  return (
    <header className='site-header site-header--small'>
      <div className='container'>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div className='logo'>Shukrullah</div>
          <div className='menu small'>Block 390, Talba Housing Estate</div>
        </div>
        <nav className='nav'>
          <Link to='/'>Home</Link>
          {user && <Link to='/sales'>Sales</Link>}
          {user && <Link to='/records'>Records</Link>}
          <Link to='/about'>About</Link>
          <Link to='/contact'>Contact</Link>
          {user ? (
            <button className='button' onClick={()=>{ localStorage.removeItem('user'); window.location.reload(); }}>Logout</button>
          ) : (
            <Link to='/login'>Login</Link>
          )}
        </nav>
      </div>
    </header>
  )
}
