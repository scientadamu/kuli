import React, { useState } from 'react'
import axios from 'axios'

export default function Contact(){
  const [type, setType] = useState('complaint')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')

  async function submit(e){
    e.preventDefault()
    try{
      await axios.post('http://localhost:4000/api/contact', { type, name, email, message })
      setStatus('Sent — thank you!')
      setName(''); setEmail(''); setMessage('')
    }catch(err){
      setStatus('Error sending — try again')
    }
  }

  return (
    <div className='container'>
      <div className='card' style={{maxWidth:700, margin:'0 auto'}}>
        <h2>Contact Us</h2>
        <form onSubmit={submit}>
          <div style={{marginBottom:8}}>
            <select className='input' value={type} onChange={e=>setType(e.target.value)}>
              <option value='complaint'>Complaint</option>
              <option value='suggestion'>Suggestion</option>
              <option value='recommendation'>Recommendation</option>
              <option value='other'>Other</option>
            </select>
          </div>
          <div style={{marginBottom:8}}>
            <input className='input' placeholder='Your name' value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div style={{marginBottom:8}}>
            <input className='input' placeholder='Your email' value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div style={{marginBottom:8}}>
            <textarea className='input' placeholder='Message' value={message} onChange={e=>setMessage(e.target.value)} rows={6} />
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className='button'>Send</button>
            <div style={{alignSelf:'center'}} className='small'>{status}</div>
          </div>
        </form>
      </div>
    </div>
  )
}
