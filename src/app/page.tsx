import Challanges from '@/components/challanges'
import FinalCta from '@/components/finalcta'
import HeroSection from '@/components/herosection'
import Navbar from '@/components/navbar'
import Solution from '@/components/solution'
import Tag from '@/components/ui/tag'
import React from 'react'

const page = () => {
  return (
    <div className='bg-white w-screen h-screen overflow-x-hidden'>
      <Navbar />
      <HeroSection />
      <Challanges />
      <Solution />
      <FinalCta />
            
    </div>
  )
}

export default page
