// components/Navbar.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-white  text-black">
      <div className="max-w-8xl mx-auto px-20 py-3 flex items-center justify-between">
        {/* Left - Logo */}
        <div className="flex items-center ">
          <Image
            src="/medtrack_ogo.svg"
            alt="MedTrack Logo"
            width={157}
            height={123}
          />
        </div>

        {/* Center - Nav Links */}
        <div className="flex-1 flex justify-center space-x-8 text-xl text-[aspekta]">
          <Link href="/features" className="hover:text-gray-600">
            Features
          </Link>
          <Link href="/about" className="hover:text-gray-600">
            About Ayu
          </Link>
          <Link href="/contact" className="hover:text-gray-600">
            Contact
          </Link>
        </div>

        {/* Right - Auth Buttons */}
        <div className="flex items-center space-x-2 bg-gray-200 px-2 py-1 rounded-full text-[aspekta] text-md">
          <Link
            href="/login"
            className="px-3 py-1 rounded-full hover:bg-gray-300"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-3 py-1 rounded-full bg-white shadow-sm hover:bg-gray-100"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
