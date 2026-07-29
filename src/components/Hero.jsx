import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronDown } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const defaultHeroData = {
  categoryLabel: 'Video Editor — Motion Graphics',
  headline: 'Data-Driven Visual Storytelling & Vox-Style Motion Graphics',
  highlightedWords: 'Data-Driven, Vox-Style, Motion, Graphics',
  subHeadline: 'Elevating documentaries, video essays, and explainers with dynamic graphics, precise pacing, and immersive sound design.',
  videoId: '1214058780',
  stat1Value: '4.8★', stat1Label: 'Fiverr Rating',
  stat2Value: '20+', stat2Label: 'Verified Reviews',
  stat3Value: '6+', stat3Label: 'Years Experience'
};

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
  const [heroData, setHeroData] = useState(defaultHeroData);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'sections', 'hero'));
        if (docSnap.exists()) {
          setHeroData(docSnap.data());
        }
      } catch (err) {
        console.error("Failed to fetch hero data", err);
      }
    };
    fetchHeroData();

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

  const headlineWords = heroData.headline.split(' ');
  const highlights = heroData.highlightedWords.split(',').map(w => w.trim());

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden grain-overlay"
    >
      {/* ── Background: Vimeo Embed (background=1 mode) ──────────────── */}
      <div className="vimeo-wrapper">
        <iframe
          src={`https://player.vimeo.com/video/${heroData.videoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          title="Background Showreel"
        />
        {/* Cinematic grid lines overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* ── Gradient overlay ─────────────────────────────────────────── */}
      <div className="hero-overlay absolute inset-0 z-10" />

      {/* ── Red ambient orb ──────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-accent-red/5 rounded-full blur-[120px] pointer-events-none z-10" />

      {/* ── Hero Content ─────────────────────────────────────────────── */}
      <div className="relative z-20 w-full max-w-5xl mx-auto px-4 md:px-6 text-center pt-24 pb-16 flex flex-col items-center">

        {/* Category label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-2 mb-8 drop-shadow-md"
        >
          <div className="h-[1px] w-8 bg-accent-red" />
          <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-accent-red drop-shadow-md">
            {heroData.categoryLabel}
          </span>
          <div className="h-[1px] w-8 bg-accent-red" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial="hidden"
          animate={loaded ? 'visible' : 'hidden'}
          className="font-display font-bold text-text-primary leading-[1.05] tracking-tight mb-7"
          style={{ 
            fontSize: 'clamp(2.2rem, 6vw, 5.5rem)',
            textShadow: '0 8px 32px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)' 
          }}
        >
          {headlineWords.map((word, i) => {
            const cleanWord = word.replace(/[^a-zA-Z0-9-&]/g, '');
            const isHighlighted = highlights.includes(cleanWord) || highlights.includes(word);
            return (
              <motion.span
                key={i}
                variants={wordVariants}
                className={`inline-block mr-[0.25em] ${isHighlighted ? 'text-accent-red' : ''}`}
              >
                {word}
              </motion.span>
            );
          })}
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={loaded ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.85 }}
          className="font-editorial italic text-text-primary/95 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed mb-12"
          style={{ textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)' }}
        >
          {heroData.subHeadline}
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
            className="w-full sm:w-auto group flex justify-center items-center gap-2 px-8 py-3.5 bg-accent-red text-white font-ui font-semibold text-sm rounded-lg hover:bg-red-500 transition-all duration-300 shadow-xl shadow-red-900/40 hover:shadow-accent-red/60 hover:scale-[1.02]"
          >
            <Play size={15} fill="currentColor" />
            Explore Work
          </button>
          <button
            onClick={scrollToContact}
            className="w-full sm:w-auto px-8 py-3.5 bg-black/40 backdrop-blur-md border border-white/20 text-white font-ui font-medium text-sm rounded-lg hover:bg-black/60 transition-all duration-300"
          >
            Get a Quote
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={loaded ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 1.4 }}
          className="w-full flex flex-wrap justify-center items-center gap-4 sm:gap-8 mt-12 sm:mt-16 pt-8 border-t border-border-subtle"
        >
          {[
            { value: heroData.stat1Value, label: heroData.stat1Label },
            { value: heroData.stat2Value, label: heroData.stat2Label },
            { value: heroData.stat3Value, label: heroData.stat3Label },
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
