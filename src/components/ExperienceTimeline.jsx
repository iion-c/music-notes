import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { EXPERIENCE as localExperience } from '../data/portfolio';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function ExperienceTimeline() {
  const [openId, setOpenId] = useState(null); 
  const [experienceData, setExperienceData] = useState([]);

  useEffect(() => {
    const fetchExp = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'experience'));
        if (querySnapshot.empty) {
          setExperienceData(localExperience);
          setOpenId(localExperience[0]?.id);
        } else {
          let exps = querySnapshot.docs.map(doc => doc.data());
          // Sort numeric ids
          exps.sort((a, b) => parseInt(a.id) - parseInt(b.id));
          setExperienceData(exps);
          setOpenId(exps[0]?.id);
        }
      } catch (err) {
        console.error("Failed to load experience from Firebase", err);
        setExperienceData(localExperience);
        setOpenId(localExperience[0]?.id);
      }
    };
    fetchExp();
  }, []);

  return (
    <section id="services" className="py-24 md:py-32 px-6 bg-bg-card">
      <div className="max-w-[1200px] mx-auto">

        {/* Section header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-5 reveal-up">
            <div className="h-[1px] w-8 bg-accent-red" />
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-accent-red">
              Work History
            </span>
          </div>
          <h2
            className="font-display font-bold text-text-primary reveal-up"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            data-delay="100"
          >
            Professional Experience
          </h2>
          <p className="font-editorial italic text-text-muted text-lg mt-3 max-w-xl reveal-up" data-delay="150">
            Over 6 years crafting visual stories across broadcast, documentary, and digital media.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-6 top-0 bottom-0 w-[1px] timeline-line hidden md:block" />

          <div className="space-y-3">
            {experienceData.map((exp, i) => {
              const isOpen = openId === exp.id;
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative md:pl-16"
                >
                  {/* Timeline node */}
                  <div className="absolute left-[11px] md:left-[18px] top-6 hidden md:block">
                    <div className={`w-3 h-3 rounded-full border-2 transition-colors duration-300 ${
                      isOpen ? 'bg-accent-red border-accent-red' : 'bg-bg-card border-border-subtle'
                    }`} />
                  </div>

                  {/* Accordion button */}
                  <button
                    onClick={() => setOpenId(isOpen ? null : exp.id)}
                    className={`w-full text-left p-5 md:p-6 rounded-sm border transition-all duration-300 ${
                      isOpen
                        ? 'bg-bg-card-alt border-accent-red/30 glow-red'
                        : 'bg-bg-card border-border-subtle hover:border-border-subtle/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h3 className="font-display text-lg font-bold text-text-primary">
                            {exp.company}
                          </h3>
                          {exp.current && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                              <span className="w-1 h-1 rounded-full bg-green-400 avail-pulse" />
                              <span className="font-mono text-[9px] text-green-400 uppercase tracking-widest">Current</span>
                            </span>
                          )}
                        </div>
                        <p className="font-ui text-sm text-accent-red font-medium mb-1">{exp.role}</p>
                        <p className="font-mono text-xs text-text-muted uppercase tracking-wider">
                          {exp.period} · {exp.location}
                        </p>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-text-muted shrink-0 mt-1 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </div>

                    {/* Expandable bullets */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <ul className="mt-5 space-y-2 pt-4 border-t border-border-subtle">
                            {exp.bullets.map((bullet, bi) => (
                              <li key={bi} className="flex items-start gap-3">
                                <span className="text-accent-red mt-1 shrink-0">—</span>
                                <span className="font-ui text-sm text-text-muted leading-relaxed">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
