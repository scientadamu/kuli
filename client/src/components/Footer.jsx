import React from 'react'

export default function Footer(){
  return (
    <footer className='site-footer'>
      <div className='container'>
        <div style={{flex:1}}>
          <h4>Shukrullah</h4>
          <p>Block 390, Talba Housing Estate, Off Minna Bida Road, Minna, Niger State</p>
          <p>Phone: +234 800 000 0000</p>
        </div>
        <div style={{flex:1}}>
          <h4>Quick Links</h4>
          <p><a href='#'>Home</a></p>
          <p><a href='#'>Sales</a></p>
          <p><a href='#'>Records</a></p>
        </div>
        <div style={{flex:1}}>
          <h4>Contact</h4>
          <p>Email: info@shukrullah.example</p>
          <p>Open: Mon - Sat</p>
        </div>
        <div style={{flex:1}}>
          <h4>About</h4>
          <p>Fresh kulikuli and quality groceries. Serving Minna and beyond.</p>
        </div>
      </div>
    </footer>
  )
}
