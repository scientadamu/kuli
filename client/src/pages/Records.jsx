import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'

export default function Records(){
  const [sales, setSales] = useState([])
  const [filter, setFilter] = useState('daily')
  const [query, setQuery] = useState('')
  const [sheetUrl, setSheetUrl] = useState(localStorage.getItem('sheetUrl') || '')
  const [connStatus, setConnStatus] = useState('')

  useEffect(()=>{ fetchAll() }, [])
  function fetchAll(){
    try{
      const local = JSON.parse(localStorage.getItem('sales') || '[]')
      setSales(local)
    }catch(e){ setSales([]) }
    // If a Google Sheets webapp URL is configured, try to fetch remote records (best-effort)
    try{
      const url = sheetUrl || localStorage.getItem('sheetUrl')
      if(url){
        fetch(url, { method: 'GET' }).then(r=> r.json()).then(remote => {
          if(Array.isArray(remote)) setSales(remote)
        }).catch(e=>{
          console.warn('Could not fetch remote sheet records', e)
        })
      }
    }catch(e){}
  }

  function saveSheetUrl(){
    try{
      if(!sheetUrl) return setConnStatus('Enter a valid URL')
      localStorage.setItem('sheetUrl', sheetUrl)
      setConnStatus('Saved')
      // attempt quick test
      testConnection()
    }catch(e){ setConnStatus('Save failed') }
  }

  function removeSheetUrl(){
    try{
      localStorage.removeItem('sheetUrl')
      setSheetUrl('')
      setConnStatus('Removed')
      fetchAll()
    }catch(e){ setConnStatus('Remove failed') }
  }

  function testConnection(){
    const url = sheetUrl || localStorage.getItem('sheetUrl')
    if(!url) return setConnStatus('No URL configured')
    setConnStatus('Testing...')
    fetch(url, { method: 'GET' }).then(async r=>{
      if(!r.ok) throw new Error('Bad response')
      const data = await r.json()
      if(Array.isArray(data)){
        setConnStatus('OK — ' + data.length + ' rows')
        setSales(data)
      } else {
        setConnStatus('OK')
      }
    }).catch(e=>{
      console.warn(e)
      setConnStatus('Failed: ' + (e.message || e))
    })
  }

  async function bulkSync(){
    const url = sheetUrl || localStorage.getItem('sheetUrl')
    if(!url) return setConnStatus('No URL configured')
    setConnStatus('Syncing...')
    try{
      // fetch remote to get existing ids
      const r = await fetch(url)
      const remote = await r.json().catch(()=>[])
      const remoteIds = new Set((remote || []).map(x => String(x.id)))
      const local = JSON.parse(localStorage.getItem('sales') || '[]')
      const toSync = local.filter(s => !remoteIds.has(String(s.id)))
      if(toSync.length === 0){
        setConnStatus('No local-only sales to sync')
        return
      }
      let success = 0, failed = 0
      for(const sale of toSync){
        try{
          const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sale) })
          const j = await res.json().catch(()=>null)
          if(res.ok && (!j || j.success !== false)){
            success++
            sale._synced = true
          } else {
            failed++
          }
        }catch(e){ failed++ }
      }
      // persist any _synced flags
      try{ localStorage.setItem('sales', JSON.stringify(local)) }catch(e){}
      setConnStatus(`Sync complete — attempted:${toSync.length} success:${success} failed:${failed}`)
      fetchAll()
    }catch(err){
      console.warn(err)
      setConnStatus('Sync failed: ' + (err.message || err))
    }
  }

  function filtered(){
    const now = dayjs()
    return sales.filter(s=>{
      const d = dayjs(s.createdAt)
      if(filter==='daily') return d.isSame(now, 'day')
      if(filter==='weekly') return d.isSame(now, 'week')
      if(filter==='monthly') return d.isSame(now, 'month')
      return true
    }).filter(s=>{
      if(!query) return true
      const q = query.toLowerCase()
      return (s.customerName || '').toLowerCase().includes(q) || (s.total||'').toString().includes(q) || (s.createdAt||'').includes(q)
    })
  }

  function downloadCSV(){
    const rows = [['id','createdAt','customerName','total']].concat(filtered().map(s=>[s.id,s.createdAt,s.customerName || '',s.total]))
    const csv = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sales.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function downloadPDF(){
    const rows = filtered()
    const win = window.open('', '_blank', 'width=900,height=700')
    const header = `<h2>Shukrullah - Sales Records</h2><div>${new Date().toLocaleString()}</div><br/>`
    const styles = `<style>body{font-family:Arial,Helvetica,sans-serif;padding:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f3f4f6}</style>`
    const body = `<table><thead><tr><th>ID</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th></tr></thead><tbody>${rows.map(s=>{
      const items = (s.items || []).map(it=> `${it.name} x${it.qty}`).join('; ')
      return `<tr><td>${s.id}</td><td>${s.createdAt}</td><td>${s.customerName || 'Walk-in'}</td><td>${items}</td><td>₦${s.total}</td></tr>`
    }).join('')}</tbody></table>`
    win.document.write(`<html><head>${styles}</head><body>${header}${body}</body></html>`)
    win.document.close()
    win.focus()
    // give browser a moment to render then print
    setTimeout(()=> win.print(), 500)
  }

  return (
    <div className='container'>
      <div className='header'>
        <h2>Sales Records</h2>
      </div>

      <div className='card'>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <input className='input' style={{width:420}} placeholder='Google Sheets webapp URL (optional)' value={sheetUrl} onChange={e=>setSheetUrl(e.target.value)} />
            <button className='button' onClick={saveSheetUrl}>Save URL</button>
            <button className='button' onClick={removeSheetUrl}>Remove</button>
            <button className='button' onClick={testConnection}>Test</button>
          </div>
          <div style={{marginLeft:8, color:'#666'}}>{connStatus}</div>
          <div style={{marginLeft:12}}>
            <button className='button' onClick={bulkSync}>Sync Local Sales</button>
          </div>

        </div>
        <div style={{display:'flex', gap:8}}>
          <select value={filter} onChange={e=>setFilter(e.target.value)} className='input'>
            <option value='daily'>Daily</option>
            <option value='weekly'>Weekly</option>
            <option value='monthly'>Monthly</option>
            <option value='all'>All</option>
          </select>
          <input className='input' placeholder='search by name/date/amount' value={query} onChange={e=>setQuery(e.target.value)} />
          <button className='button' onClick={downloadPDF}>Export PDF</button>
        </div>

        <div style={{marginTop:12}}>
          {filtered().map(s=> (
            <div key={s.id} style={{padding:8, borderBottom:'1px solid #eef', display:'flex', justifyContent:'space-between'}}>
              <div>
                <div><strong>{s.customerName || 'Walk-in'}</strong></div>
                <div className='small'>{s.createdAt}</div>
              </div>
              <div>₦{s.total}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
