"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react"; // icons

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className=" w-full bg-white/50 backdrop-blur-2xl text-black fixed top-0 left-0 z-50 ">
      <div className="max-w-8xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left - Logo */}
        <div className="flex items-center">
          <Image
            src="/medtrack_ogo.svg"
            alt="MedTrack Logo"
            width={140}
            height={40}
            priority
          />
        </div>

        {/* Center - Nav Links (Desktop only) */}
        <div className="hidden md:flex flex-1 justify-center space-x-8 text-lg font-medium">
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

        {/* Right - Auth Buttons (Desktop only) */}
        <div className="hidden md:flex items-center space-x-2">
          <Link
            href="/login"
            className="px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-3 py-1 rounded-full bg-black text-white hover:bg-gray-800"
          >
            Register
          </Link>
        </div>

        {/* Hamburger (Mobile only) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-md focus:outline-none"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-md z-40 md:hidden">
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-lg font-medium">
            <Link
              href="/features"
              className="hover:text-gray-600"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/about"
              className="hover:text-gray-600"
              onClick={() => setIsOpen(false)}
            >
              About Ayu
            </Link>
            <Link
              href="/contact"
              className="hover:text-gray-600"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-full bg-black text-white hover:bg-gray-800"
              onClick={() => setIsOpen(false)}
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
