import React, { useState, useEffect } from 'react'

const slides = [
  { id: 1, title: 'Welcome to Shukrullah', bg: 'linear-gradient(90deg,#0b5ed7,#3b82f6)' },
  { id: 2, title: 'Fresh Kulikuli & Good Prices', bg: 'linear-gradient(90deg,#f97316,#fb923c)' },
  { id: 3, title: 'Fast Pickup & Delivery in Minna', bg: 'linear-gradient(90deg,#10b981,#34d399)' }
]

export default function Slider(){
  const [index, setIndex] = useState(0)
  useEffect(()=>{
    const t = setInterval(()=> setIndex(i=> (i+1)%slides.length), 5000)
    return ()=>clearInterval(t)
  },[])

  return (
    <div className='slider'>
      <div className='slides' style={{ transform: `translateX(-${index*100}%)` }}>
        {slides.map(s=> (
          <div className='slide' key={s.id} style={{ background: s.bg }}>
            <div>{s.title}</div>
          </div>
        ))}
      </div>
      <div className='slider-nav'>
        <button onClick={()=>setIndex(i=> (i-1+slides.length)%slides.length)}>&lt;</button>
        <button onClick={()=>setIndex(i=> (i+1)%slides.length)}>&gt;</button>
      </div>
    </div>
  )
}
