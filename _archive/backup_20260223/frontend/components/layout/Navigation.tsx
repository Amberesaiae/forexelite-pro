'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';

const navItems = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '#features' },
  { name: 'Strategies', href: '#strategies' },
  { name: 'Pricing', href: '#pricing' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-10" style={{ background: 'rgba(4,8,15,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--bg-border)' }}>
      <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
        <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)' }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#04080F" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', letterSpacing: '3px', color: 'var(--gold)' }}>FOREXELITE</span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', letterSpacing: '3px', color: 'var(--text-primary)' }}>PRO</span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            style={{
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: pathname === item.href ? 'var(--gold)' : 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-4">
        <Link
          href="/login"
          style={{
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          Sign In
        </Link>
        <Link
          href="/login"
          style={{
            background: 'var(--gold)',
            color: 'var(--bg-deep)',
            padding: '8px 20px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
        >
          Start Trading
        </Link>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden relative h-6 w-6"
        aria-label="Toggle menu"
      >
        <span className={`absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-foreground transition-all ${isOpen ? 'rotate-45' : '-translate-y-2'}`} />
        <span className={`absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-foreground transition-all ${isOpen ? 'opacity-0' : ''}`} />
        <span className={`absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-foreground transition-all ${isOpen ? '-rotate-45' : 'translate-y-2'}`} />
      </button>
    </nav>
  );
}
