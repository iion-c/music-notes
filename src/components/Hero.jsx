import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronDown } from 'lucide-react';

// Word-by-word headline reveal animation
const headlineWords = ['Data-Driven', 'Visual', 'Storytelling', '&', 'Vox-Style', 'Motion', 'Graphics'];

const wordVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09 },
  },
};

const wordChildVariants = {
  hidden: { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
  visible: {
    clipPath: 'inset(0 0% 0 0)',
    opacity: 1,
    transition: { duration: 0.65, ease: [0.77, 0, 0.18, 1] },
  },
};

export default function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Small delay so loader clears first
    const t = setTimeout(() => setLoaded(true), 200);
    return () => clearTimeout(t);
  }, []);

  const scrollToWork = () => {
    document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden grain-overlay"
    >
      {/* ── Background: Vimeo Embed (background=1 mode) ──────────────── */}
      {/* Replace VIMEO_ID below with actual ID once uploaded */}
      <div className="absolute inset-0 z-0 bg-bg-primary">
        <div
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{ pointerEvents: 'none' }}
        >
          {/* 
            VIMEO SHOWREEL PLACEHOLDER
            When Vimeo ID is available, replace this div with:
            <iframe
              src="https://player.vimeo.com/video/YOUR_VIMEO_ID?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1"
              className="absolute w-[177.77vh] min-w-full h-[56.25vw] min-h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              frameBorder="0"
              allow="autoplay; fullscreen"
              title="Matthew Delgado Showreel"
            />
          */}
          {/* Placeholder gradient background (remove when Vimeo is ready) */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-neutral-900 to-zinc-900" />
          {/* Cinematic grid lines overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
        </div>
      </div>

      {/* ── Gradient overlay ─────────────────────────────────────────── */}
      <div className="hero-overlay absolute inset-0 z-10" />

      {/* ── Red ambient orb ──────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-accent-red/5 rounded-full blur-[120px] pointer-events-none z-10" />

      {/* ── Hero Content ─────────────────────────────────────────────── */}
      <div className="relative z-20 max-w-6xl mx-auto px-6 text-center pt-24 flex flex-col items-center">

        {/* Category label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="h-[1px] w-8 bg-accent-red" />
          <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-accent-red">
            Video Editor — Motion Graphics
          </span>
          <div className="h-[1px] w-8 bg-accent-red" />
        </motion.div>

        {/* Headline with word-by-word clip reveal */}
        <motion.h1
          variants={wordVariants}
          initial="hidden"
          animate={loaded ? 'visible' : 'hidden'}
          className="font-display font-bold text-text-primary leading-[1.05] tracking-tight mb-7"
          style={{ fontSize: 'clamp(2.4rem, 5.5vw, 5rem)' }}
        >
          {headlineWords.map((word, i) => (
            <motion.span
              key={i}
              variants={wordChildVariants}
              className={`inline-block mr-[0.25em] ${
                word === '&' || word === 'Vox-Style' || word === 'Motion' || word === 'Graphics'
                  ? 'text-accent-red'
                  : ''
              }`}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.85 }}
          className="font-editorial italic text-text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-12"
        >
          Elevating documentaries, video essays, and explainers with dynamic graphics,
          precise pacing, and immersive sound design.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <button
            onClick={scrollToWork}
            className="group flex items-center gap-2 px-8 py-3.5 bg-accent-red text-white font-ui font-semibold text-sm rounded hover:bg-red-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,59,48,0.35)] hover:scale-[1.02]"
          >
            <Play size={15} fill="currentColor" />
            Explore Work
          </button>
          <button
            onClick={scrollToContact}
            className="px-8 py-3.5 border border-border-subtle text-text-primary font-ui font-medium text-sm rounded hover:border-text-muted hover:bg-white/[0.03] transition-all duration-300"
          >
            Get a Quote
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={loaded ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="flex items-center gap-8 mt-16 pt-8 border-t border-border-subtle"
        >
          {[
            { value: '4.8★', label: 'Fiverr Rating' },
            { value: '20+', label: 'Verified Reviews' },
            { value: '6+', label: 'Years Experience' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display font-bold text-2xl text-text-primary">{stat.value}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-text-muted mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Scroll Indicator ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={loaded ? { opacity: 1 } : {}}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer"
        onClick={scrollToWork}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">Scroll</span>
        <ChevronDown size={16} className="text-text-muted scroll-indicator" />
      </motion.div>
    </section>
  );
}
