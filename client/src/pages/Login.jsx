import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // local demo users (previously on server)
  const demoUsers = [
    { id: 1, role: 'admin', name: 'Admin', username: 'admin', password: 'admin' },
    { id: 2, role: 'sales', name: 'Sales Person', username: 'sales', password: 'sales' },
    { id: 3, role: 'guest', name: 'Guest', username: 'guest', password: '' }
  ]

  function submit(e){
    e.preventDefault()
    setError('')
    setLoading(true)
    try{
      const user = demoUsers.find(u=>u.username === username)
      if(!user) throw new Error('Invalid credentials')
      if(user.role !== 'guest' && user.password !== password) throw new Error('Invalid credentials')
      localStorage.setItem('user', JSON.stringify({ id: user.id, role: user.role, name: user.name }))
      navigate('/')
    }catch(err){
      setError(err.message || 'Invalid credentials')
    }finally{ setLoading(false) }
  }

  function loginGuest(){
    const user = demoUsers.find(u=>u.role === 'guest')
    localStorage.setItem('user', JSON.stringify({ id: user.id, role: user.role, name: user.name }))
    navigate('/')
  }

  return (
    <div className='container'>
      <div className='card' style={{maxWidth:420, margin:'0 auto'}}>
        <h3>Login</h3>
        <form onSubmit={submit}>
          <div style={{marginBottom:8}}>
            <input className='input' placeholder='username' value={username} onChange={e=>setUsername(e.target.value)} />
          </div>
          <div style={{marginBottom:8}}>
            <input className='input' type='password' placeholder='password' value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          {error && <div style={{color:'red'}}>{error}</div>}
          <div style={{display:'flex', gap:8}}>
            <button className='button' style={{marginTop:8}} disabled={loading}>Login</button>
            <button type='button' className='button' style={{marginTop:8}} onClick={loginGuest} disabled={loading}>Login as Guest</button>
          </div>
        </form>
      </div>
    </div>
  )
}
