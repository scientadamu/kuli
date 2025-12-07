import React, { useState, useRef, useEffect } from 'react'
import { products, deliveryAreas, outsideLocations } from '../data/products'
import { useNavigate } from 'react-router-dom'
import Slider from '../components/Slider'
// Header/Footer are provided by `main.jsx`; avoid rendering them here to prevent duplicates

function calcLandingExtras(total, baseWaybill = 0, baseLogistics = 0, packaging){
	const chunk = 80000
	const chunks = Math.max(1, Math.ceil(total / chunk))
	const waybill = (baseWaybill || 0) * chunks
	const logisticMultiplier = 2 * (1 - Math.pow(0.5, chunks))
	const logistics = Math.round((baseLogistics || 0) * logisticMultiplier)
	const packagingCost = packaging === 'carton' ? 1500 * chunks : 0
	return { waybill, logistics, packagingCost }
}

function formatCurrency(n){
	try { return '₦' + Number(n || 0).toLocaleString(); } catch(e){ return '₦' + (n||0) }
}

export default function Landing(){
	const navigate = useNavigate()
	const refs = useRef({})
	const [cart, setCart] = useState([])
	const [deliveryType, setDeliveryType] = useState('pickup')
	const [landingArea, setLandingArea] = useState(deliveryAreas[0]?.area || '')
	const [landingOutsideLoc, setLandingOutsideLoc] = useState(outsideLocations[0]?.name || '')
	const [landingCustomArea, setLandingCustomArea] = useState('')
	const [landingCustomWaybill, setLandingCustomWaybill] = useState('')
	const [landingCustomLogistics, setLandingCustomLogistics] = useState('')
	const [packaging, setPackaging] = useState('sack')
	const [landingReceiver, setLandingReceiver] = useState({ name:'', contact:'', address:'' })

	useEffect(()=>{ try{ const raw = localStorage.getItem('landingCart'); if(raw) setCart(JSON.parse(raw)) }catch(e){} }, [])
	useEffect(()=>{ try{ localStorage.setItem('landingCart', JSON.stringify(cart)) }catch(e){} }, [cart])

	function add(p){ setCart(prev => { const found = prev.find(i=>i.id===p.id); if(found) return prev.map(i=>i.id===p.id?{...i, qty: i.qty+1}:i); return [...prev, {...p, qty:1}] }) }
	function updateQty(id, qty){ setCart(prev => prev.map(i=> i.id===id ? {...i, qty: Math.max(1, Number(qty) || 1)} : i)) }
	function removeItem(id){ setCart(prev => prev.filter(i=>i.id!==id)) }

	const cartSubtotal = cart.reduce((s,i)=>s + (Number(i.qty||0) * Number(i.price||0)), 0)
	// live preview extras
	let landingWaybill = 0, landingLogistics = 0, packagingCostLive = 0
	if(deliveryType !== 'pickup'){
		if(deliveryType === 'minna'){
			const d = deliveryAreas.find(d=>d.area===landingArea) || { price:0, logistics:0 }
			if(landingArea === 'Other' && landingCustomWaybill !== ''){
				const extras = calcLandingExtras(cartSubtotal, Number(landingCustomWaybill) || 0, Number(landingCustomLogistics) || 0, packaging)
				landingWaybill = extras.waybill
				landingLogistics = extras.logistics
				packagingCostLive = extras.packagingCost
			} else {
				const extras = calcLandingExtras(cartSubtotal, d.price || 0, d.logistics || 0, packaging)
				landingWaybill = extras.waybill
				landingLogistics = extras.logistics
				packagingCostLive = extras.packagingCost
			}
		} else if(deliveryType === 'outside'){
			const o = outsideLocations.find(o=>o.name === landingOutsideLoc) || { waybill:0, logistics:0 }
			if(landingOutsideLoc === 'Other' && landingCustomWaybill !== ''){
				const extras = calcLandingExtras(cartSubtotal, Number(landingCustomWaybill) || 0, Number(landingCustomLogistics) || 0, packaging)
				landingWaybill = extras.waybill
				landingLogistics = extras.logistics
				packagingCostLive = extras.packagingCost
			} else {
				const extras = calcLandingExtras(cartSubtotal, o.waybill || 0, o.logistics || 0, packaging)
				landingWaybill = extras.waybill
				landingLogistics = extras.logistics
				packagingCostLive = extras.packagingCost
			}
		}
	}

	const landingPackagingCount = Math.max(0, Math.ceil(cartSubtotal / 80000))
	const landingTotal = cartSubtotal + landingWaybill + landingLogistics + packagingCostLive

	async function checkout(){
		if(cart.length===0) return alert('No items in cart')
		const subtotal = cart.reduce((s,i)=>s+i.qty*i.price,0)
		let waybill = 0, logistics = 0, packagingCost = 0

		if(deliveryType !== 'pickup'){
			// compute extras based on area/type
			if(deliveryType === 'minna'){
				const d = deliveryAreas.find(d=>d.area===landingArea) || { price:0, logistics:0 }
				if(landingArea === 'Other' && landingCustomWaybill !== ''){
					const extras = calcLandingExtras(subtotal, Number(landingCustomWaybill) || 0, Number(landingCustomLogistics) || 0, packaging)
					waybill = extras.waybill
					logistics = extras.logistics
					packagingCost = extras.packagingCost
				} else {
					const extras = calcLandingExtras(subtotal, d.price || 0, d.logistics || 0, packaging)
					waybill = extras.waybill
					logistics = extras.logistics
					packagingCost = extras.packagingCost
				}
			} else if(deliveryType === 'outside'){
				const o = outsideLocations.find(o=>o.name === landingOutsideLoc) || { waybill:0, logistics:0 }
				if(landingOutsideLoc === 'Other' && landingCustomWaybill !== ''){
					const extras = calcLandingExtras(subtotal, Number(landingCustomWaybill) || 0, Number(landingCustomLogistics) || 0, packaging)
					waybill = extras.waybill
					logistics = extras.logistics
					packagingCost = extras.packagingCost
				} else {
					const extras = calcLandingExtras(subtotal, o.waybill || 0, o.logistics || 0, packaging)
					waybill = extras.waybill
					logistics = extras.logistics
					packagingCost = extras.packagingCost
				}
			}

			// validate receiver info
			if(!landingReceiver.name || landingReceiver.name.trim().length < 2) return alert('Please enter name for delivery')
			if(!landingReceiver.contact || landingReceiver.contact.trim().length < 7) return alert('Please enter contact number for delivery')
			if(!landingReceiver.address || landingReceiver.address.trim().length < 5) return alert('Please enter address for delivery')
		}

		const total = subtotal + packagingCost + waybill + logistics
		const sale = {
			items: cart,
			subtotal,
			total,
			customerName: landingReceiver.name || 'Walk-in customer',
			delivery: deliveryType === 'pickup' ? 'pickup' : 'delivery',
			area: deliveryType === 'minna' ? (landingArea === 'Other' ? landingCustomArea : landingArea) : (deliveryType === 'outside' ? (landingOutsideLoc === 'Other' ? landingCustomArea : landingOutsideLoc) : undefined),
			customArea: (deliveryType === 'minna' && landingArea === 'Other') || (deliveryType === 'outside' && landingOutsideLoc === 'Other') ? landingCustomArea : undefined,
			customWaybill: (landingCustomWaybill && landingCustomWaybill !== '') ? Number(landingCustomWaybill) : undefined,
			customLogistics: (landingCustomLogistics && landingCustomLogistics !== '') ? Number(landingCustomLogistics) : undefined,
			packaging,
			waybill,
			logistics,
			packagingCost,
			receiver: landingReceiver,
			userRole: 'guest'
		}

		try{
			// assign id and timestamp
			sale.id = Date.now()
			sale.createdAt = new Date().toISOString()
			// store sale locally in browser (frontend-only mode)
			const existing = JSON.parse(localStorage.getItem('sales') || '[]')
			existing.push(sale)
			localStorage.setItem('sales', JSON.stringify(existing))
			// navigate to invoice using sale id
			navigate('/invoice/' + sale.id, { state: { sale } })
			setCart([])
			try{ localStorage.removeItem('landingCart') }catch(e){}
		} catch (err){
			alert('Order failed: ' + (err?.message || 'unknown'))
		}
	}

	function printInvoice(){
		if(cart.length===0) return alert('No items in cart to print')
		const subtotal = cart.reduce((s,i)=>s+i.qty*i.price,0)
		const areaDisplay = deliveryType === 'minna' ? (landingArea === 'Other' ? landingCustomArea || 'Other' : landingArea) : (deliveryType === 'outside' ? (landingOutsideLoc === 'Other' ? landingCustomArea || 'Other' : landingOutsideLoc) : '')
		const win = window.open('', '_blank', 'width=800,height=900')
		const html = `
			<html>
			<head>
				<title>Invoice Preview</title>
				<style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}.right{text-align:right}</style>
			</head>
			<body>
				<h2>Shukrullah - Invoice</h2>
				<div>Customer: ${landingReceiver.name || 'Walk-in'}</div>
				<div>Delivery: ${deliveryType}${deliveryType === 'minna' || deliveryType === 'outside' ? ' (' + areaDisplay + ')' : ''}</div>
				${deliveryType !== 'pickup' ? `<div>Contact: ${landingReceiver.contact || ''}</div><div>Address: ${landingReceiver.address || ''}</div>` : ''}
				<div>Packaging: ${packaging}${packaging === 'carton' ? ' (' + landingPackagingCount + ' carton' + (landingPackagingCount>1? 's':'') + ')' : ''}</div>
				<hr/>
				<table>
					<thead><tr><th>Item</th><th>Qty</th><th>Price</th><th class='right'>Total</th></tr></thead>
					<tbody>
						${cart.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>₦${i.price}</td><td class='right'>₦${i.qty*i.price}</td></tr>`).join('')}
					</tbody>
				</table>
				<hr/>
				<div style='text-align:right'><div>Products total: ${formatCurrency(subtotal)}</div><div>Waybill: ${formatCurrency(landingWaybill)}</div><div>Logistics: ${formatCurrency(landingLogistics)}</div><div>Packaging: ${formatCurrency(packagingCostLive)}</div><h3>Total: ${formatCurrency(landingTotal)}</h3></div>
				<script>window.print();</script>
			</body>
			</html>
		`
		win.document.write(html)
		win.document.close()
	}

	return (
		<div className='container'>
				<Slider />

				<div className='card'>
					<h3>Products</h3>
					<div className='product-grid'>
						{products.map(p=> (
							<div className='product' key={p.id}>
								<img src={p.image} alt={p.name} />
								<h4>{p.name}</h4>
								<p>{formatCurrency(p.price)}</p>
								<button className='button' onClick={()=>add(p)}>Add</button>
							</div>
						))}
					</div>
				</div>

				<div className='card cart'>
					<h3>Cart</h3>
					{cart.length===0 && <p>No items</p>}
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
							<div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'flex-start'}}>
								<label style={{minWidth:110}}>Delivery:</label>
								<select className='input' value={deliveryType} onChange={e=> setDeliveryType(e.target.value)}>
									<option value='pickup'>Pickup (Free)</option>
									<option value='minna'>Home delivery (within Minna)</option>
									<option value='outside'>Home delivery (outside Minna)</option>
								</select>
								{deliveryType === 'minna' && (
									<div style={{marginTop:8}}>
										<select className='input' value={landingArea} onChange={e=> setLandingArea(e.target.value)}>
											{deliveryAreas.map(d=> <option key={d.area} value={d.area}>{d.area} - Delivery ₦{d.price} / Logistics ₦{d.logistics}</option>)}
											<option value='Other'>Other - specify area</option>
										</select>
										{landingArea === 'Other' && (
											<div style={{marginTop:8}}>
												<input className='input' placeholder='Specify Minna area' value={landingCustomArea} onChange={e=> setLandingCustomArea(e.target.value)} />
												<div style={{display:'flex', gap:8, marginTop:8}}>
													<input className='input' placeholder='Manual waybill (₦) - optional' value={landingCustomWaybill} onChange={e=> setLandingCustomWaybill(e.target.value)} />
													<input className='input' placeholder='Manual logistics (₦) - optional' value={landingCustomLogistics} onChange={e=> setLandingCustomLogistics(e.target.value)} />
												</div>
											</div>
										)}
									</div>
								)}
								{deliveryType === 'outside' && (
									<div style={{marginTop:8}}>
										<select className='input' value={landingOutsideLoc} onChange={e=> setLandingOutsideLoc(e.target.value)}>
											{outsideLocations.map(o=> <option key={o.name} value={o.name}>{o.name} - Waybill ₦{o.waybill} / Logistics ₦{o.logistics}</option>)}
											<option value='Other'>Other - specify area</option>
										</select>
										{landingOutsideLoc === 'Other' && (
											<div style={{marginTop:8}}>
												<input className='input' placeholder='Specify outside area' value={landingCustomArea} onChange={e=> setLandingCustomArea(e.target.value)} />
												<div style={{display:'flex', gap:8, marginTop:8}}>
													<input className='input' placeholder='Manual waybill (₦) - optional' value={landingCustomWaybill} onChange={e=> setLandingCustomWaybill(e.target.value)} />
													<input className='input' placeholder='Manual logistics (₦) - optional' value={landingCustomLogistics} onChange={e=> setLandingCustomLogistics(e.target.value)} />
												</div>
											</div>
										)}
									</div>
								)}

								<label style={{marginLeft:12}}>Packaging:</label>
								<select className='input' value={packaging} onChange={e=> setPackaging(e.target.value)}>
									<option value='sack'>Sack (Free)</option>
									<option value='carton'>Carton (₦1500)</option>
								</select>
							</div>

							{deliveryType !== 'pickup' && (
								<div style={{marginTop:8}}>
									<h4>Delivery details</h4>
									<input className='input' placeholder='Name' value={landingReceiver.name} onChange={e=> setLandingReceiver(r=>({...r, name: e.target.value}))} />
									<input className='input' placeholder='Contact number' style={{marginTop:8}} value={landingReceiver.contact} onChange={e=> setLandingReceiver(r=>({...r, contact: e.target.value}))} />
									<input className='input' placeholder='Address' style={{marginTop:8}} value={landingReceiver.address} onChange={e=> setLandingReceiver(r=>({...r, address: e.target.value}))} />
								</div>
							)}

							<div style={{textAlign:'right', marginTop:12}}>
								<div style={{marginBottom:8, textAlign:'right'}}>
									<div className='small'>Items: {cart.reduce((c,i)=>c+Number(i.qty||0),0)}</div>
								</div>

								<div style={{marginTop:10, padding:12, borderRadius:8, background:'#fff8f0', border:'1px solid rgba(194,65,12,0.06)'}}>
									<div style={{display:'flex', justifyContent:'space-between'}}><div className='small'>Products total</div><div>{formatCurrency(cartSubtotal)}</div></div>
									<div style={{display:'flex', justifyContent:'space-between', marginTop:6}}><div className='small'>Waybill</div><div>{formatCurrency(landingWaybill)}</div></div>
									<div style={{display:'flex', justifyContent:'space-between', marginTop:6}}><div className='small'>Logistics</div><div>{formatCurrency(landingLogistics)}</div></div>
									<div style={{display:'flex', justifyContent:'space-between', marginTop:6}}><div className='small'>Packaging</div><div>{formatCurrency(packagingCostLive)}</div></div>
									<div style={{display:'flex', justifyContent:'space-between', marginTop:10, fontSize:18, fontWeight:700}}><div>Total</div><div>{formatCurrency(landingTotal)}</div></div>
								</div>

								<div style={{marginTop:10}}>
									<button className='button' onClick={() => printInvoice()}>Print Invoice</button>
									<button className='button' style={{marginLeft:8}} onClick={checkout}>Place Order</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
	)
}
