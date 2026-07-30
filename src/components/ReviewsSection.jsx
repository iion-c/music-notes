import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { REVIEWS as localReviews, STATS } from '../data/portfolio';
import { useCountUp } from '../hooks/useScrollReveal';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

// Single review card (shared between carousel and marquee)
function ReviewCard({ review }) {
  return (
    <div className="relative group h-full">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-red/60 via-red-400/60 to-accent-red/60 rounded-sm opacity-0 group-hover:opacity-100 blur-md transition duration-500 group-hover:duration-200" />
      <div className="relative h-full bg-bg-card border border-border-subtle rounded-sm p-8 flex flex-col transition-all duration-300 group-hover:-translate-y-1">
        <Stars count={review.rating} />
        <blockquote className="mt-6 mb-8 font-editorial italic text-text-muted text-base leading-relaxed flex-1 group-hover:text-text-primary transition-colors duration-300">
          "{review.quote}"
        </blockquote>
        <div className="border-t border-border-subtle pt-6">
          <p className="font-display font-bold text-text-primary">{review.name}</p>
          <p className="font-ui text-sm text-text-muted mt-1">{review.title}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-mono text-[10px] text-accent-red uppercase tracking-widest">{review.platform}</span>
            <span className="text-border-subtle">·</span>
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">{review.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile swipeable carousel
function MobileCarousel({ reviews }) {
  const [current, setCurrent] = useState(0);
  const [startX, setStartX] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const goTo = (index) => {
    setCurrent(Math.max(0, Math.min(index, reviews.length - 1)));
  };

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!dragging || startX === null) return;
    setDragOffset(e.touches[0].clientX - startX);
  };

  const handleTouchEnd = () => {
    if (dragOffset < -50) goTo(current + 1);
    else if (dragOffset > 50) goTo(current - 1);
    setDragging(false);
    setDragOffset(0);
    setStartX(null);
  };

  return (
    <div className="relative overflow-hidden px-6">
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(calc(-${current * 100}% + ${dragOffset}px))` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {reviews.map((review, i) => (
          <div key={`${review.name}-${i}`} className="w-full shrink-0 px-2">
            <ReviewCard review={review} />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {reviews.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'bg-accent-red w-5' : 'bg-border-subtle w-2'
            }`}
            aria-label={`Go to review ${i + 1}`}
          />
        ))}
      </div>

      {/* Prev / Next arrows */}
      <div className="flex justify-between mt-4 px-2">
        <button
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="text-text-muted disabled:opacity-20 transition-opacity px-3 py-1 font-mono text-xs uppercase tracking-widest hover:text-accent-red"
        >
          ← Prev
        </button>
        <button
          onClick={() => goTo(current + 1)}
          disabled={current === reviews.length - 1}
          className="text-text-muted disabled:opacity-20 transition-opacity px-3 py-1 font-mono text-xs uppercase tracking-widest hover:text-accent-red"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function ReviewsSection() {
  const [reviewsData, setReviewsData] = useState([]);
  const [heroStats, setHeroStats] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(pointer: coarse)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'reviews'));
        if (querySnapshot.empty) {
          setReviewsData(localReviews); // Fallback to local data
        } else {
          setReviewsData(querySnapshot.docs.map(doc => doc.data()));
        }
      } catch (err) {
        console.error("Failed to load reviews from Firebase", err);
        setReviewsData(localReviews);
      }
    };

    const fetchHeroStats = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'sections', 'hero'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHeroStats([
            { value: parseFloat(data.stat1Value), suffix: data.stat1Value.replace(/[0-9.]/g, ''), decimals: data.stat1Value.includes('.') ? 1 : 0, label: data.stat1Label },
            { value: parseFloat(data.stat2Value), suffix: data.stat2Value.replace(/[0-9.]/g, ''), decimals: data.stat2Value.includes('.') ? 1 : 0, label: data.stat2Label },
            { value: parseFloat(data.stat3Value), suffix: data.stat3Value.replace(/[0-9.]/g, ''), decimals: data.stat3Value.includes('.') ? 1 : 0, label: data.stat3Label },
          ]);
        } else {
          setHeroStats(STATS);
        }
      } catch (err) {
        console.error("Failed to load hero stats", err);
        setHeroStats(STATS);
      }
    };

    fetchReviews();
    fetchHeroStats();
  }, []);

  // Duplicate reviews for seamless infinite scrolling (desktop only)
  const marqueeReviews = [...reviewsData, ...reviewsData, ...reviewsData];

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
          {heroStats.map((stat) => (
            <StatCounter key={stat.label} stat={stat} />
          ))}
        </div>
      </div>

      {/* Mobile: swipeable carousel | Desktop: infinite marquee */}
      {isMobile ? (
        <div className="reveal-up" data-delay="200">
          <MobileCarousel reviews={reviewsData} />
        </div>
      ) : (
        <div className="relative w-full reveal-up" data-delay="200">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

          <div className="flex review-marquee-track hover:[animation-play-state:paused] py-4">
            {marqueeReviews.map((review, i) => (
              <div
                key={`${review.name}-${i}`}
                className="w-[350px] md:w-[450px] shrink-0 mx-4 cursor-default"
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
