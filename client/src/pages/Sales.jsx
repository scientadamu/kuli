import React, { useState, useRef, useEffect } from 'react'
import { products, deliveryAreas, outsideLocations } from '../data/products'
// removed server axios usage; sales persisted to localStorage
import { Link, useNavigate } from 'react-router-dom'
// Header/Footer are provided by `main.jsx`; avoid rendering them here to prevent duplicates

function calcExtraCosts(total, baseWaybill = 0, baseLogistics = 0, packaging){
  // chunks per 80,000
  const chunk = 80000
  const chunks = Math.max(1, Math.ceil(total / chunk))
  const waybill = (baseWaybill || 0) * chunks
  // logistics scales with diminishing additions: base + base/2 + base/4 + ... for each chunk
  // total multiplier = 2 * (1 - 0.5^chunks)
  const logisticMultiplier = 2 * (1 - Math.pow(0.5, chunks))
  const logistics = Math.round((baseLogistics || 0) * logisticMultiplier)
  const packagingCost = packaging === 'carton' ? 1500 * chunks : 0
  return { waybill, logistics, packagingCost }
}

function formatCurrency(n){
  try { return '₦' + Number(n || 0).toLocaleString(); } catch(e){ return '₦' + (n||0) }
}

export default function Sales(){
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const navigate = useNavigate()
  const lastAddedId = useRef(null)
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [delivery, setDelivery] = useState('pickup')
  const [withinMinna, setWithinMinna] = useState(true)
  const [area, setArea] = useState(deliveryAreas[0].area)
  const [outsideLoc, setOutsideLoc] = useState('Abuja')
  const [customArea, setCustomArea] = useState('')
  const [customWaybill, setCustomWaybill] = useState('')
  const [customLogistics, setCustomLogistics] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  // include contact number for deliveries (name, contact, address)
  const [receiver, setReceiver] = useState({ name: '', contact: '', address: '' })
  const [packaging, setPackaging] = useState('sack')
  const [discount, setDiscount] = useState(0)
  const refs = useRef({})

  // persist cart to localStorage so sales people can resume
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart')
      if (raw) setCart(JSON.parse(raw))
    } catch (e) { /* ignore parse errors */ }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart))
    } catch (e) {}
  }, [cart])

  const allowedDiscountPercent = user && user.role === 'admin' ? 10 : user && user.role === 'sales' ? 7 : 0

  function add(p){
    // remember the last added id so we can scroll/focus it after state updates
    lastAddedId.current = p.id
    setCart(prev => {
      const found = prev.find(i=>i.id===p.id)
      if(found) return prev.map(i=>i.id===p.id?{...i, qty: i.qty+1}:i)
      return [...prev, { ...p, qty:1 }]
    })
  }

  // redirect to login if not authenticated
  useEffect(() => {
    if(!user){
      navigate('/login')
    }
  }, [user, navigate])

  // when cart updates, if we have a lastAddedId, scroll that item into view and focus quantity input
  useEffect(() => {
    const id = lastAddedId.current
    if(!id) return
    const el = refs.current[id]
    if(el && el.scrollIntoView){
      try{ el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }catch(e){}
      // try focusing the qty input inside the cart item
      const input = el.querySelector && el.querySelector('input.qty')
      if(input) try{ input.focus(); input.select && input.select() }catch(e){}
    }
    lastAddedId.current = null
  }, [cart])

  function updateQty(id, qty){
    setCart(prev => prev.map(i=> i.id===id ? {...i, qty: Math.max(1, Number(qty) || 1)} : i))
  }

  function removeItem(id){ setCart(prev => prev.filter(i=>i.id!==id)) }

  useEffect(()=>{ if(cart.length===0) setCustomerName('') },[cart])

  const cartSubtotal = cart.reduce((s,i)=>s + (Number(i.qty||0) * Number(i.price||0)), 0)
  // live preview calculations
  const chunks = Math.max(1, Math.ceil(cartSubtotal / 80000))
  let previewWaybill = 0, previewLogistics = 0, previewPackaging = 0
  if(delivery === 'delivery'){
    if(withinMinna){
      const d = deliveryAreas.find(d=>d.area===area) || { price:0, logistics:0 }
      if(area === 'Other' && customWaybill !== ''){
        const extras = calcExtraCosts(cartSubtotal, Number(customWaybill) || 0, Number(customLogistics) || 0, packaging)
        previewWaybill = extras.waybill
        previewLogistics = extras.logistics
      } else {
        const extras = calcExtraCosts(cartSubtotal, d.price || 0, d.logistics || 0, packaging)
        previewWaybill = extras.waybill
        previewLogistics = extras.logistics
      }
    } else {
      const locObj = outsideLocations.find(o=>o.name === outsideLoc) || { waybill: 0, logistics: 0 }
      if(outsideLoc === 'Other' && customWaybill !== ''){
        const extras = calcExtraCosts(cartSubtotal, Number(customWaybill) || 0, Number(customLogistics) || 0, packaging)
        previewWaybill = extras.waybill
        previewLogistics = extras.logistics
      } else {
        const extras = calcExtraCosts(cartSubtotal, locObj.waybill || 0, locObj.logistics || 0, packaging)
        previewWaybill = extras.waybill
        previewLogistics = extras.logistics
      }
    }
    previewPackaging = packaging === 'carton' ? 1500 * chunks : 0
  }
  const discountValue = Math.max(0, Number(discount) || 0)
  const capped = Math.min(discountValue, allowedDiscountPercent)
  const previewDiscountAmount = capped / 100 * cartSubtotal
  const previewTotal = cartSubtotal - previewDiscountAmount + previewWaybill + previewLogistics + previewPackaging

  async function makeSale(){
    if(!user || (user.role !== 'admin' && user.role !== 'sales')){
      alert('Only admin or sales users can complete sales here. Guests can place orders from Home.')
      return navigate('/')
    }

    const subtotal = cart.reduce((s,i)=>s+i.qty*i.price,0)
    let waybill = 0, logistics = 0, packagingCost = 0
      if(delivery === 'delivery'){
      if(withinMinna){
          const d = deliveryAreas.find(d=>d.area===area) || { price:0, logistics:0 }
          if(area === 'Other' && customWaybill !== ''){
            const extras = calcExtraCosts(subtotal, Number(customWaybill) || 0, Number(customLogistics) || 0, packaging)
            waybill = extras.waybill
            logistics = extras.logistics
            packagingCost = extras.packagingCost
          } else {
            const extras = calcExtraCosts(subtotal, d.price || 0, d.logistics || 0, packaging)
            waybill = extras.waybill
            logistics = extras.logistics
            packagingCost = extras.packagingCost
          }
      } else {
        // if outside and user selected Other, require customArea
          const locName = outsideLoc === 'Other' ? customArea : outsideLoc
          const locObj = outsideLocations.find(o=>o.name === outsideLoc) || { waybill: 0, logistics: 0 }
          if(outsideLoc === 'Other' && customWaybill !== ''){
            const extras = calcExtraCosts(subtotal, Number(customWaybill) || 0, Number(customLogistics) || 0, packaging)
            waybill = extras.waybill
            logistics = extras.logistics
            packagingCost = extras.packagingCost
          } else {
            const extras = calcExtraCosts(subtotal, locObj.waybill, locObj.logistics, packaging)
            waybill = extras.waybill
            logistics = extras.logistics
            packagingCost = extras.packagingCost
          }
      }
    }

    // validate receiver info for deliveries
    if(delivery === 'delivery'){
      if(!receiver.name || receiver.name.trim().length < 2){
        setErrorMessage('Please enter receiver name')
        return
      }
      if(!receiver.contact || receiver.contact.trim().length < 7){
        setErrorMessage('Please enter receiver contact number')
        return
      }
      if(!receiver.address || receiver.address.trim().length < 5){
        setErrorMessage('Please enter receiver address')
        return
      }
      if(!withinMinna && outsideLoc === 'Other' && (!customArea || customArea.trim().length < 3)){
        setErrorMessage('Please specify the delivery area for outside Minna')
        return
      }
    }
    setErrorMessage('')

    // apply discount if present (enforce allowed percent)
    const discountValue = Math.max(0, Number(discount) || 0)
    const capped = Math.min(discountValue, allowedDiscountPercent)
    const discountAmount = capped / 100 * subtotal
    const total = subtotal - discountAmount + waybill + logistics + packagingCost
    const sale = {
      items: cart,
      subtotal,
      total,
      customerName,
      delivery,
      // area: for within Minna use selected area; for outside Minna use selected city or customArea
      area: withinMinna ? area : (outsideLoc === 'Other' ? customArea : outsideLoc),
      // include customArea explicitly so server-side validation has the raw value when needed
      customArea: (withinMinna && area === 'Other') || (!withinMinna && outsideLoc === 'Other') ? customArea : undefined,
      // include manual prices if provided for Other
      customWaybill: (customWaybill && customWaybill !== '') ? Number(customWaybill) : undefined,
      customLogistics: (customLogistics && customLogistics !== '') ? Number(customLogistics) : undefined,
      receiver,
      packaging,
      waybill,
      logistics,
      packagingCost,
      // discount stored as monetary amount
      discount: discountAmount,
      // include user role so the server can enforce discount caps
      userRole: user?.role || 'guest',
    }

    // flatten receiver fields so Apps Script can store them in separate columns
    sale.receiverName = receiver?.name || ''
    sale.receiverContact = receiver?.contact || ''
    sale.receiverAddress = receiver?.address || ''

    try {
      // assign id and timestamp
      sale.id = Date.now()
      sale.createdAt = new Date().toISOString()
      // store sale locally
      const existing = JSON.parse(localStorage.getItem('sales') || '[]')
      existing.push(sale)
      localStorage.setItem('sales', JSON.stringify(existing))

      // if a Google Sheets webapp URL is configured in localStorage, try to POST the sale and await result
      try{
        const sheetUrl = localStorage.getItem('sheetUrl')
        if(sheetUrl){
          try{
            const res = await fetch(sheetUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sale)
            })
            let data = null
            try{ data = await res.json() }catch(e){}
            if(!res.ok || (data && data.success === false)){
              const errMsg = (data && data.error) || res.statusText || 'Failed to save to sheet'
              alert('Sale saved locally, but failed to save to Google Sheet: ' + errMsg)
            } else {
              // success
              try{ alert('Sale saved to Google Sheet — invoice id: ' + sale.id) }catch(e){}
            }
          }catch(err){
            console.warn('Failed to send sale to sheets:', err)
            alert('Sale saved locally, but failed to save to Google Sheet: ' + (err.message || err))
          }
        } else {
          // no sheet configured
          // silently proceed — user can configure sheet URL in Records page
        }
      }catch(e){ console.warn(e) }

      alert('Sale created, invoice id: ' + sale.id)
      navigate('/invoice/' + sale.id, { state: { sale } })
      setCart([])
      try { localStorage.removeItem('cart') } catch (e) {}
    } catch (err) {
      const msg = err?.message || 'Sale failed'
      setErrorMessage(msg)
    }
  }

  function printInvoice(){
    if(cart.length===0) return alert('No items in cart to print')
    const subtotal = cart.reduce((s,i)=>s+i.qty*i.price,0)
    let waybill = 0, logistics = 0, packagingCost = 0
    if(delivery === 'delivery'){
      if(withinMinna){
        const d = deliveryAreas.find(d=>d.area===area)
        if(area === 'Other' && customWaybill !== ''){
          const extras = calcExtraCosts(subtotal, Number(customWaybill) || 0, Number(customLogistics) || 0, packaging)
          waybill = extras.waybill
          logistics = extras.logistics
          packagingCost = extras.packagingCost
        } else {
          const baseWay = d?.price || 0
          const baseLog = d?.logistics || 0
          const extras = calcExtraCosts(subtotal, baseWay, baseLog, packaging)
          waybill = extras.waybill
          logistics = extras.logistics
          packagingCost = extras.packagingCost
        }
      } else {
        const locObj = outsideLocations.find(o=>o.name === outsideLoc) || { waybill: 0, logistics: 0 }
        if(outsideLoc === 'Other' && customWaybill !== ''){
          const extras = calcExtraCosts(subtotal, Number(customWaybill) || 0, Number(customLogistics) || 0, packaging)
          waybill = extras.waybill
          logistics = extras.logistics
          packagingCost = extras.packagingCost
        } else {
          const extras = calcExtraCosts(subtotal, locObj.waybill, locObj.logistics, packaging)
          waybill = extras.waybill
          logistics = extras.logistics
          packagingCost = extras.packagingCost
        }
      }
    }
    const discountValue = Math.max(0, Number(discount) || 0)
    const capped = Math.min(discountValue, allowedDiscountPercent)
    const discountAmount = capped / 100 * subtotal
    const total = subtotal - discountAmount + waybill + logistics + packagingCost

    // build printable HTML
    const win = window.open('', '_blank', 'width=800,height=900')
    const areaDisplay = delivery === 'delivery' ? (withinMinna ? (area === 'Other' ? customArea || 'Other' : area) : (outsideLoc === 'Other' ? customArea || 'Other' : outsideLoc)) : ''
    const html = `
      <html>
      <head>
        <title>Invoice Preview</title>
        <style>
          body{font-family: Arial, Helvetica, sans-serif; padding:20px}
          table{width:100%; border-collapse:collapse}
          th,td{border:1px solid #ccc; padding:8px; text-align:left}
          .right{text-align:right}
        </style>
      </head>
      <body>
        <h2>Shukrullah - Invoice</h2>
        <div>Customer: ${customerName || receiver.name || 'Walk-in'}</div>
        <div>Delivery: ${delivery}${delivery==='delivery' ? ' (' + areaDisplay + ')' : ''}</div>
        ${delivery==='delivery' ? `<div>Contact: ${receiver.contact || ''}</div><div>Address: ${receiver.address || ''}</div>` : ''}
        <hr/>
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th class='right'>Total</th></tr></thead>
          <tbody>
            ${cart.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>₦${i.price}</td><td class='right'>₦${i.qty*i.price}</td></tr>`).join('')}
          </tbody>
        </table>
        <hr/>
        <div style='text-align:right'>
          <div>Subtotal: ${formatCurrency(subtotal)}</div>
          <div>Waybill: ${formatCurrency(waybill)}</div>
          <div>Logistics: ${formatCurrency(logistics)}</div>
          <div>Packaging: ${formatCurrency(packagingCost)}</div>
          <div>Discount: -${formatCurrency(discountAmount)}</div>
          <h3>Total: ${formatCurrency(total)}</h3>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `
    win.document.write(html)
    win.document.close()
  }

  return (
    <div className='container'>
        <div className='card'>
          <h3>Products</h3>
          <div className='product-grid'>
            {products.map(p=> (
              <div className='product' key={p.id}>
                <img src={p.image} alt={p.name} />
                <h4>{p.name}</h4>
                <p>₦{p.price}</p>
                <button className='button' onClick={()=>add(p)}>Add</button>
              </div>
            ))}
          </div>
        </div>

        <div className='card' style={{marginTop:16}}>
          <h3>Checkout</h3>
          <input className='input' placeholder='Customer name' value={customerName} onChange={e=>setCustomerName(e.target.value)} />
          <div style={{marginTop:8}}>
            <label><input type='radio' checked={delivery==='pickup'} onChange={()=>setDelivery('pickup')} /> Pickup (Free)</label>
            <label style={{marginLeft:8}}><input type='radio' checked={delivery==='delivery'} onChange={()=>setDelivery('delivery')} /> Home Delivery</label>
          </div>

          {delivery==='delivery' && (
            <div style={{marginTop:8}}>
              <div>
                <label><input type='radio' checked={withinMinna} onChange={()=>setWithinMinna(true)} /> Within Minna</label>
                <label style={{marginLeft:8}}><input type='radio' checked={!withinMinna} onChange={()=>setWithinMinna(false)} /> Outside Minna</label>
              </div>

              {withinMinna ? (
                <div style={{marginTop:8}}>
                  <select className='input' value={area} onChange={e=>setArea(e.target.value)}>
                    {deliveryAreas.map(d=> <option key={d.area} value={d.area}>{d.area} - Delivery ₦{d.price} / Logistics ₦{d.logistics}</option>)}
                    <option value='Other'>Other - specify area</option>
                  </select>
                  {area === 'Other' && (
                    <div>
                      <input className='input' placeholder='Specify Minna area' style={{marginTop:8}} value={customArea} onChange={e=>setCustomArea(e.target.value)} />
                      <div style={{display:'flex', gap:8, marginTop:8}}>
                        <input className='input' placeholder='Manual waybill (₦) - optional' value={customWaybill} onChange={e=>setCustomWaybill(e.target.value)} />
                        <input className='input' placeholder='Manual logistics (₦) - optional' value={customLogistics} onChange={e=>setCustomLogistics(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{marginTop:8}}>
                  <select className='input' value={outsideLoc} onChange={e=>setOutsideLoc(e.target.value)}>
                    {outsideLocations.map(o=> <option key={o.name} value={o.name}>{o.name} - Waybill ₦{o.waybill} / Logistics ₦{o.logistics}</option>)}
                    <option value='Other'>Other - specify area</option>
                  </select>
                  {outsideLoc === 'Other' && (
                    <div>
                      <input className='input' placeholder='Specify delivery city/area' style={{marginTop:8}} value={customArea} onChange={e=>setCustomArea(e.target.value)} />
                      <div style={{display:'flex', gap:8, marginTop:8}}>
                        <input className='input' placeholder='Manual waybill (₦) - optional' value={customWaybill} onChange={e=>setCustomWaybill(e.target.value)} />
                        <input className='input' placeholder='Manual logistics (₦) - optional' value={customLogistics} onChange={e=>setCustomLogistics(e.target.value)} />
                      </div>
                    </div>
                  )}
                  
                </div>
              )}

              <div style={{marginTop:8}}>
                <h4>Receiver Info</h4>
                <input className='input' placeholder='Receiver name' value={receiver.name} onChange={e=>setReceiver(r=>({...r, name: e.target.value}))} />
                <input className='input' placeholder='Contact number' style={{marginTop:8}} value={receiver.contact} onChange={e=>setReceiver(r=>({...r, contact: e.target.value}))} />
                <input className='input' placeholder='Receiver address' style={{marginTop:8}} value={receiver.address} onChange={e=>setReceiver(r=>({...r, address: e.target.value}))} />
              </div>

              <div style={{marginTop:8}}>
                <label>Packaging: </label>
                <label style={{marginLeft:8}}><input type='radio' checked={packaging==='sack'} onChange={()=>setPackaging('sack')} /> Sack (Free)</label>
                <label style={{marginLeft:8}}><input type='radio' checked={packaging==='carton'} onChange={()=>setPackaging('carton')} /> Carton (₦1500 per 80,000 value)</label>
              </div>
            </div>
          )}

          <div style={{marginTop:12}}>
            <h4>Cart</h4>
            {cart.length===0 && <div className='small'>No items added</div>}
            {cart.map(i=> (
              <div key={i.id} className='cart-item' ref={el=> refs.current[i.id]=el} style={{alignItems:'center'}}>
                  <img src={i.image} alt={i.name} />
                  <div style={{flex:1, paddingLeft:12}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                        <strong>{i.name}</strong>
                        <div className='small'>each {formatCurrency(i.price)}</div>
                      </div>
                      <div style={{textAlign:'right'}}>{formatCurrency(i.qty * i.price)}</div>
                    </div>
                    <div style={{marginTop:8, display:'flex', gap:8, alignItems:'center'}}>
                      <div style={{display:'flex', alignItems:'center', gap:6}}>
                        <button className='button small' onClick={()=> updateQty(i.id, Math.max(1, Number(i.qty) - 1))}>-</button>
                        <input className='input qty' type='number' value={i.qty} onChange={e=> updateQty(i.id, e.target.value)} style={{width:64, textAlign:'center'}} />
                        <button className='button small' onClick={()=> updateQty(i.id, Number(i.qty) + 1)}>+</button>
                      </div>
                      <div style={{marginLeft:'auto'}}>
                        <button className='button' onClick={()=> removeItem(i.id)}>Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
            ))}
            {cart.length>0 && (
              <div style={{marginTop:12}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6}}>
                  <div>
                    <div className='small'>Items: {cart.reduce((c,i)=>c+Number(i.qty||0),0)}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className='small'>Estimated Total</div>
                    <div style={{fontSize:18, fontWeight:700, marginTop:6}}>{formatCurrency(previewTotal)}</div>
                  </div>
                </div>

                <div style={{marginTop:10, padding:12, borderRadius:8, background:'#fff8f0', border:'1px solid rgba(194,65,12,0.06)'}}>
                  <div style={{display:'flex', justifyContent:'space-between'}}><div className='small'>Products total</div><div>{formatCurrency(cartSubtotal)}</div></div>
                  <div style={{height:6}} />
                  <div style={{display:'flex', justifyContent:'space-between'}}><div className='small'>Waybill</div><div>{formatCurrency(previewWaybill)}</div></div>
                  <div style={{display:'flex', justifyContent:'space-between', marginTop:6}}><div className='small'>Logistics</div><div>{formatCurrency(previewLogistics)}</div></div>
                  <div style={{display:'flex', justifyContent:'space-between', marginTop:6}}><div className='small'>Packaging</div><div>{formatCurrency(previewPackaging)}</div></div>
                  <div style={{display:'flex', justifyContent:'space-between', marginTop:6}}><div className='small'>Discount ({capped}%)</div><div>-{formatCurrency(previewDiscountAmount)}</div></div>
                  <div style={{display:'flex', justifyContent:'space-between', marginTop:10, fontSize:18, fontWeight:700}}><div>Total</div><div>{formatCurrency(previewTotal)}</div></div>
                </div>
              </div>
            )}
          </div>

          <div style={{marginTop:12}}>
            <label>Discount %: </label>
            <input className='input' style={{width:120, display:'inline-block', marginLeft:8}} value={discount} onChange={e=> setDiscount(e.target.value)} />
            <div className='small' style={{marginTop:6}}>Allowed discount: {allowedDiscountPercent}%</div>
          </div>

          {errorMessage && <div style={{color:'red', marginTop:8}}>{errorMessage}</div>}

          <div style={{marginTop:12, textAlign:'right'}}>
            <button className='button' onClick={printInvoice}>Print Invoice</button>
            <button className='button' style={{marginLeft:8}} onClick={makeSale}>Make Sale</button>
          </div>
        </div>

        <div style={{marginTop:12}} className='small'>
          Note: Only users with role <strong>admin</strong> or <strong>sales</strong> can complete sales here. Guests may place orders from the Home page.
          <div><Link to='/'>Go to Home</Link></div>
        </div>
    </div>
  )
}
