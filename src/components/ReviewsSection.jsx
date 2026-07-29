import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { REVIEWS, STATS } from '../data/portfolio';
import { useCountUp } from '../hooks/useScrollReveal';

// Star rating component
function Stars({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="star text-sm">★</span>
      ))}
    </div>
  );
}

// Individual stat counter
function StatCounter({ stat }) {
  const ref = useCountUp(stat.value, stat.decimals, 2000);
  return (
    <div className="text-center">
      <div className="flex items-baseline justify-center gap-1">
        <span ref={ref} className="stat-number">0</span>
        <span className="font-display text-3xl font-bold text-accent-red">{stat.suffix}</span>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted mt-2">{stat.label}</p>
    </div>
  );
}

export default function ReviewsSection() {
  const [current, setCurrent] = useState(0);
  const autoRef = useRef(null);

  const next = () => setCurrent((c) => (c + 1) % REVIEWS.length);
  const prev = () => setCurrent((c) => (c - 1 + REVIEWS.length) % REVIEWS.length);

  // Auto-advance carousel every 6s
  useEffect(() => {
    autoRef.current = setInterval(next, 6000);
    return () => clearInterval(autoRef.current);
  }, []);

  const resetAuto = () => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(next, 6000);
  };

  return (
    <section id="reviews" className="py-24 md:py-32 px-6 bg-bg-primary">
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="mb-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-5 reveal-up">
            <div className="h-[1px] w-8 bg-accent-red" />
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-accent-red">
              Client Reviews
            </span>
            <div className="h-[1px] w-8 bg-accent-red" />
          </div>
          <h2
            className="font-display font-bold text-text-primary reveal-up"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            data-delay="100"
          >
            What Clients Say
          </h2>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-6 mb-20 p-8 bg-bg-card border border-border-subtle rounded-sm reveal-up" data-delay="150">
          {STATS.map((stat) => (
            <StatCounter key={stat.label} stat={stat} />
          ))}
        </div>

        {/* Reviews carousel */}
        <div className="relative max-w-3xl mx-auto reveal-up" data-delay="200">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="bg-bg-card border border-border-subtle rounded-sm p-8 md:p-10 text-center relative overflow-hidden"
            >
              {/* Big quote mark */}
              <div
                className="absolute top-4 left-6 font-display text-7xl text-accent-red/10 leading-none select-none pointer-events-none"
                aria-hidden="true"
              >
                "
              </div>

              <Stars count={REVIEWS[current].rating} />

              <blockquote className="mt-6 mb-8 font-editorial italic text-text-primary text-xl md:text-2xl leading-relaxed">
                "{REVIEWS[current].quote}"
              </blockquote>

              <div className="border-t border-border-subtle pt-6">
                <p className="font-display font-bold text-text-primary">{REVIEWS[current].name}</p>
                <p className="font-ui text-sm text-text-muted mt-1">{REVIEWS[current].title}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="font-mono text-xs text-accent-red uppercase tracking-widest">
                    {REVIEWS[current].platform}
                  </span>
                  <span className="text-border-subtle">·</span>
                  <span className="font-mono text-xs text-text-muted">{REVIEWS[current].location}</span>
                </div>
              </div>

              {/* Shimmer */}
              <div className="absolute inset-0 shimmer-bg pointer-events-none" />
            </motion.div>
          </AnimatePresence>

          {/* Carousel controls */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <button
              onClick={() => { prev(); resetAuto(); }}
              className="w-10 h-10 rounded-full border border-border-subtle text-text-muted hover:border-text-muted hover:text-text-primary flex items-center justify-center transition-all duration-200"
              aria-label="Previous review"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {REVIEWS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrent(i); resetAuto(); }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current ? 'w-6 bg-accent-red' : 'w-1.5 bg-border-subtle hover:bg-text-muted'
                  }`}
                  aria-label={`Review ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => { next(); resetAuto(); }}
              className="w-10 h-10 rounded-full border border-border-subtle text-text-muted hover:border-text-muted hover:text-text-primary flex items-center justify-center transition-all duration-200"
              aria-label="Next review"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
