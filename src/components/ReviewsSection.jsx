import { motion } from 'framer-motion';
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
  // Duplicate reviews for seamless infinite scrolling
  const marqueeReviews = [...REVIEWS, ...REVIEWS, ...REVIEWS];

  return (
    <section id="reviews" className="py-24 md:py-32 bg-bg-primary overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6">

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
        <div className="grid grid-cols-3 gap-6 mb-24 p-8 bg-bg-card border border-border-subtle rounded-sm max-w-4xl mx-auto reveal-up" data-delay="150">
          {STATS.map((stat) => (
            <StatCounter key={stat.label} stat={stat} />
          ))}
        </div>
      </div>

import { motion } from 'framer-motion';
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
  // Duplicate reviews for seamless infinite scrolling
  const marqueeReviews = [...REVIEWS, ...REVIEWS, ...REVIEWS];

  return (
    <section id="reviews" className="py-24 md:py-32 bg-bg-primary overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6">

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
        <div className="grid grid-cols-3 gap-6 mb-24 p-8 bg-bg-card border border-border-subtle rounded-sm max-w-4xl mx-auto reveal-up" data-delay="150">
          {STATS.map((stat) => (
            <StatCounter key={stat.label} stat={stat} />
          ))}
        </div>
      </div>

      {/* Infinite Marquee */}
      <div className="relative w-full reveal-up" data-delay="200">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

        <div className="flex review-marquee-track hover:[animation-play-state:paused] py-4">
          {marqueeReviews.map((review, i) => (
            <div
              key={`${review.name}-${i}`}
              className="relative w-[350px] md:w-[450px] shrink-0 mx-4 group cursor-default"
            >
              {/* Glowing animated background that appears on hover */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-red/60 via-red-400/60 to-accent-red/60 rounded-sm opacity-0 group-hover:opacity-100 blur-md transition duration-500 group-hover:duration-200" />
              
              {/* Actual card content */}
              <div className="relative h-full bg-bg-card border border-border-subtle rounded-sm p-8 flex flex-col transition-all duration-300 group-hover:-translate-y-1">
                <Stars count={review.rating} />
                
                <blockquote className="mt-6 mb-8 font-editorial italic text-text-muted text-base leading-relaxed flex-1 group-hover:text-text-primary transition-colors duration-300">
                  "{review.quote}"
                </blockquote>
                
                <div className="border-t border-border-subtle pt-6">
                  <p className="font-display font-bold text-text-primary">{review.name}</p>
                  <p className="font-ui text-sm text-text-muted mt-1">{review.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-[10px] text-accent-red uppercase tracking-widest">
                      {review.platform}
                    </span>
                    <span className="text-border-subtle">·</span>
                    <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">{review.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
