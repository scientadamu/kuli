import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Upload(){
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if(!user || user.role !== 'admin'){
    return (
      <div className='container'>
        <div className='card'>
          <h3>Upload CSV</h3>
          <p>Admin access required.</p>
        </div>
      </div>
    )
  }

  async function submit(e){
    e.preventDefault()
    if(!file) return setMessage('Please choose a CSV file')
    const fd = new FormData()
    fd.append('file', file)
    try{
      const res = await axios.post('http://localhost:4000/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMessage('Upload complete: ' + (res.data.added || 0) + ' records')
      setTimeout(()=> navigate('/records'), 1200)
    }catch(err){
      setMessage(err?.response?.data?.error || err.message)
    }
  }

  return (
    <div className='container'>
      <div className='card'>
        <h3>Upload Sales CSV</h3>
        <form onSubmit={submit}>
          <input type='file' accept='.csv' onChange={e=> setFile(e.target.files[0])} />
          <div style={{marginTop:12}}>
            <button className='button' type='submit'>Upload</button>
          </div>
        </form>
        {message && <div style={{marginTop:12}} className='small'>{message}</div>}
      </div>
    </div>
  )
}
