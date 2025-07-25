import React from 'react';
import { motion } from 'framer-motion';

interface DoorTransitionProps {
  isOpen: boolean;
  onComplete?: () => void;
  children?: React.ReactNode;
}

export default function DoorTransition({ isOpen, onComplete, children }: DoorTransitionProps) {
  return (
    <div className="fixed inset-0 z-50">
      {/* Left door */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-primary to-blue-600 origin-left"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: isOpen ? 0 : 1 }}
        transition={{
          duration: 1.2,
          ease: [0.4, 0, 0.2, 1],
          delay: 0.2
        }}
        onAnimationComplete={onComplete}
      >
        <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-r from-transparent to-black/20" />
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
          <div className="w-4 h-8 bg-white/30 rounded-full shadow-lg" />
        </div>
      </motion.div>

      {/* Right door */}
      <motion.div
        className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary to-blue-600 origin-right"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: isOpen ? 0 : 1 }}
        transition={{
          duration: 1.2,
          ease: [0.4, 0, 0.2, 1],
          delay: 0.2
        }}
      >
        <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-l from-transparent to-black/20" />
        <div className="absolute top-1/2 left-4 transform -translate-y-1/2">
          <div className="w-4 h-8 bg-white/30 rounded-full shadow-lg" />
        </div>
      </motion.div>

      {/* Center line */}
      <motion.div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-full bg-black/10"
        initial={{ opacity: 1 }}
        animate={{ opacity: isOpen ? 0 : 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      />

      {/* Content behind doors */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.8 }}
        transition={{ duration: 0.6, delay: isOpen ? 0.8 : 0 }}
      >
        {children}
      </motion.div>
    </div>
  );
}