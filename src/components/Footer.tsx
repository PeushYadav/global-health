import React from "react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="w-full bg-white/50 backdrop-blur-2xl text-black py-12 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Left - Logo and Description */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <Image
                src="/medtrack_ogo.svg"
                alt="MedTrack Logo"
                width={120}
                height={32}
                priority
              />
              <p className="text-2xl ml-2 text-black">
                <span className='font-bold'>Med</span>Track
              </p>
            </div>
            <p className="text-gray-600 text-sm max-w-sm mx-auto md:mx-0">
              Revolutionizing chronic disease management with AI-powered health tracking.
            </p>
          </div>

          {/* Center - Quick Links */}
          <div className="text-center">
            <h3 className="font-semibold text-black mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/features" className="block text-gray-600 hover:text-black transition-colors">
                Features
              </Link>
              <Link href="/about" className="block text-gray-600 hover:text-black transition-colors">
                About Ayu
              </Link>
              <Link href="/contact" className="block text-gray-600 hover:text-black transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Right - Contact */}
          <div className="text-center md:text-right">
            <h3 className="font-semibold text-black mb-4">Get in Touch</h3>
            <div className="space-y-2 text-sm">
              <a 
                href="mailto:shashwatrivedi2005@gmail.com"
                className="block text-gray-600 hover:text-black transition-colors"
              >
                shashwatrivedi2005@gmail.com
              </a>
              <p className="text-gray-500">
                We're here to help
              </p>
            </div>
          </div>
        </div>

        {/* Bottom - Copyright */}
        <div className="mt-6 text-center font-aspekta">
          <p className="text-[12px] text-neutral-600">
            © 2025 MedTrack - Healthcare Impact Platform. Developed by students of AIT.
          </p>
          <p className="mt-1 text-[12px] text-neutral-600">
            Empowering better health through technology.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;