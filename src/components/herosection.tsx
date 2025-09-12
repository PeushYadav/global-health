import Image from "next/image";
import CardNav from "../components/navbar"; // adjust path if different
import logo from "../../public/logo.svg"; // put your logo inside /public
import { items } from "../constants/Navbar"; // your nav items 
import DotGrid from "../components/dotGrid"; // adjust path if different
import SplitText from "../components/splitText";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-gray-100 overflow-hidden">
      {/* Background DotGrid */}
      <div  style={{ width: '100%', height: '600px', position: 'relative' }}>"
        <DotGrid
          dotSize={3}
          gap={20}
          baseColor="#808080"
          activeColor="#000000"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      {/* Foreground Navbar */}
      <CardNav
        logo={logo.src} 
        logoAlt="Company Logo"
        items={items}
        baseColor="#fff"
        menuColor="#000"
        buttonBgColor="#111"
        buttonTextColor="#fff"
        ease="power3.out"
      />
     <div className="flex justify-center items-start">
      <SplitText
        text="MedTrack"
        className="text-2xl font-semibold text-center text-black"
        delay={100}
        duration={0.6}
        ease="power3.out"
        splitType="chars"
        from={{ opacity: 0, y: 40 }}
        to={{ opacity: 1, y: 0 }}
        threshold={0.1}
        rootMargin="-100px"
        textAlign="center"
      />
     </div>
      
    </main>
  );
}
