import React from 'react'
import { useLocation } from 'react-router-dom'
import { deliveryAreas } from '../data/products'

export default function Invoice(){
  const { state } = useLocation()
  const sale = state?.sale || {}

  function print(){
    window.print()
  }

  const deliveryPrice = sale.delivery === 'pickup' ? 0 : (deliveryAreas.find(d=>d.area===sale.area)?.price || sale.waybill || 0)

  return (
    <div className='container'>
      <div className='card'>
        <h2>Invoice</h2>
        <div><strong>Shukrullah</strong></div>
        <div>Block 390, Talba Housing Estate, Off Minna Bida Road, Minna, Niger State</div>
        <hr />
        <div>Invoice ID: {sale.id}</div>
        <div>Date: {sale.createdAt}</div>
        <div>Customer: {sale.customerName}</div>
        <div>Delivery: {sale.delivery} {sale.delivery==='delivery' && `- ${sale.area} (₦${deliveryPrice})`}</div>
        {sale.receiver && (
          <div style={{marginTop:8}}>
            <div><strong>Receiver:</strong> {sale.receiver.name}</div>
            <div className='small'>{sale.receiver.address}</div>
          </div>
        )}

        <div style={{marginTop:12}}>
          {sale.items?.map(i=> (
            <div key={i.id} style={{display:'flex', justifyContent:'space-between'}}>{i.name} x{i.qty} <div>₦{i.qty*i.price}</div></div>
          ))}
        </div>

        <div style={{marginTop:12}}>
          <div style={{display:'flex', justifyContent:'space-between'}}><div>Sub-total</div><div>₦{(sale.total - (sale.waybill||0) - (sale.logistics||0) - (sale.packagingCost||0)) || sale.total}</div></div>
          {sale.waybill ? <div style={{display:'flex', justifyContent:'space-between'}}><div>Waybill</div><div>₦{sale.waybill}</div></div> : null}
          {sale.logistics ? <div style={{display:'flex', justifyContent:'space-between'}}><div>Logistics</div><div>₦{sale.logistics}</div></div> : null}
          {sale.packagingCost ? <div style={{display:'flex', justifyContent:'space-between'}}><div>Packaging</div><div>₦{sale.packagingCost}</div></div> : null}
          <div style={{marginTop:8, textAlign:'right'}}>
            <h3>Total: ₦{sale.total}</h3>
          </div>
        </div>

        <div style={{marginTop:12}}>
          <button className='button' onClick={print}>Print</button>
        </div>
      </div>
    </div>
  )
}
