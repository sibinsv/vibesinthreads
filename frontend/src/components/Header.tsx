'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-center h-16">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Vibes in Threads"
              width={60}
              height={60}
              className="w-15 h-15 object-contain"
            />
            <span className="font-bold text-2xl text-gray-900">
              Vibes in Threads
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}