import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * LoadingScreen — Cinematic intro animation ~1.8s
 * Shows Matthew's initials "MD" with a loading bar and editorial typography
 */
export default function LoadingScreen({ onComplete }) {
  const progressRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="loader"
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg-primary overflow-hidden grain-overlay"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent-red/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Initials */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex items-center gap-1 mb-10"
        >
          <span className="font-display text-[4.5rem] font-bold text-text-primary leading-none tracking-tighter">
            M
          </span>
          <span className="font-display text-[4.5rem] font-bold text-accent-red leading-none tracking-tighter">
            D
          </span>
        </motion.div>

        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted mb-8"
        >
          Video Editor & Motion Graphics
        </motion.p>

        {/* Loading bar */}
        <div className="w-48 h-[1px] bg-border-subtle overflow-hidden">
          <motion.div
            className="h-full bg-accent-red"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, ease: [0.77, 0, 0.18, 1] }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
