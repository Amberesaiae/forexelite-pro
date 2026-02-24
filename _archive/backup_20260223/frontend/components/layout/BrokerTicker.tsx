'use client';

import { motion } from 'framer-motion';

const brokers = [
  { name: 'OANDA', logo: '◈' },
  { name: 'Interactive Brokers', logo: '◉' },
  { name: 'FXCM', logo: '◇' },
  { name: 'Saxobank', logo: '◆' },
  { name: 'IG Markets', logo: '▣' },
  { name: 'CMC Markets', logo: '◈' },
  { name: 'Dukascopy', logo: '◉' },
  { name: 'Alvexo', logo: '◇' },
  { name: 'Swissquote', logo: '◆' },
  { name: 'City Index', logo: '▣' },
];

const duplicatedBrokers = [...brokers, ...brokers, ...brokers];

export default function BrokerTicker() {
  return (
    <div className="relative overflow-hidden py-8 bg-[#0a0a12]/50 backdrop-blur-sm border-y border-[#2a2a4a]/50">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0a0a12] to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0a0a12] to-transparent z-10" />
      
      <motion.div
        className="flex items-center gap-16"
        animate={{
          x: [0, -100 * brokers.length],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 30,
            ease: "linear",
          },
        }}
      >
        {duplicatedBrokers.map((broker, index) => (
          <div
            key={`${broker.name}-${index}`}
            className="flex items-center gap-3 shrink-0"
          >
            <span 
              className="text-2xl"
              style={{ color: index % 3 === 0 ? '#f5a623' : index % 3 === 1 ? '#8b5cf6' : '#06b6d4' }}
            >
              {broker.logo}
            </span>
            <span className="text-lg font-medium text-[#9090a8] whitespace-nowrap">
              {broker.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
