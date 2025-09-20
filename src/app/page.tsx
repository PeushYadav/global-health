import Challanges from '@/components/challanges'
import FinalCta from '@/components/finalcta'
import Footer from '@/components/Footer'
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
      <Footer />
    </div>
  )
}

export default page
