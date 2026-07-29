import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const defaultAboutData = {
  headline: 'Storytelling Is an Act of Precision',
  bio: `I'm Matthew Delgado, a freelance video editor and motion graphics artist with over 6 years of experience turning raw footage into stories that inform, inspire, and move people to action.\n\nMy work lives at the intersection of journalism and design. Inspired by the visual language of Vox, Johnny Harris, and investigative documentary filmmaking, I specialize in building narrative architecture through precise cuts, data-driven motion graphics, and immersive sound design.\n\nFrom the Venice Architecture Biennale to anti-corruption documentaries in Somalia, from Hong Kong film festival submissions to corporate leadership series in Australia — each project gets the same obsessive attention to detail.`,
  ratingBadge: '4.8',
  fiverrUrl: 'https://www.fiverr.com',
  achievements: [
    { icon: '🎬', label: 'Documentary Specialist' },
    { icon: '✦', label: 'Vox-Style Motion Graphics' },
    { icon: '🔊', label: 'Sound Design & Mix' },
    { icon: '🌍', label: 'International Clients' }
  ]
};

export default function AboutSection() {
  const [aboutData, setAboutData] = useState(defaultAboutData);

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'sections', 'about'));
        if (docSnap.exists()) {
          setAboutData(docSnap.data());
        }
      } catch (err) {
        console.error("Failed to load about data from Firebase", err);
      }
    };
    fetchAboutData();
  }, []);

  const bioParagraphs = aboutData.bio.split('\n').filter(p => p.trim() !== '');

  return (
    <section id="about" className="py-24 md:py-32 px-6 bg-bg-card grain-overlay relative overflow-hidden">
      {/* Ambient orb */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-red/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">

          {/* Photo placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="relative"
          >
            {/* Photo frame */}
            <div className="relative rounded-sm overflow-hidden aspect-[4/5] bg-bg-card-alt border border-border-subtle flex items-center justify-center">
              {aboutData.imageUrl ? (
                <img 
                  src={
                    aboutData.imageUrl.includes('drive.google.com/file/d/') 
                      ? `https://drive.google.com/thumbnail?id=${aboutData.imageUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1]}&sz=w1000`
                      : aboutData.imageUrl
                  } 
                  alt="Matthew Delgado" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div
                    className="w-20 h-20 rounded-full bg-bg-primary border border-border-subtle flex items-center justify-center"
                  >
                    <span className="font-display text-3xl font-bold text-text-primary">MD</span>
                  </div>
                  <p className="font-mono text-xs text-text-muted uppercase tracking-wider">
                    Photo coming soon
                  </p>
                </div>
              )}

              {/* Corner accent */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-accent-red" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-accent-red" />
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -right-4 bg-bg-card border border-border-subtle rounded-sm p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-accent-yellow text-sm">★★★★★</span>
              </div>
              <p className="font-display text-2xl font-bold text-text-primary">{aboutData.ratingBadge}</p>
              <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">Fiverr Rating</p>
            </div>
          </motion.div>

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] w-8 bg-accent-red" />
              <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-accent-red">
                About
              </span>
            </div>

            <h2
              className="font-display font-bold text-text-primary mb-6"
              style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)' }}
            >
              {aboutData.headline}
            </h2>

            <div className="space-y-4 font-ui text-text-muted text-base leading-relaxed">
              {bioParagraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Key achievements */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              {aboutData.achievements.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-bg-primary rounded-sm border border-border-subtle">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-ui text-xs text-text-muted">{item.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 bg-accent-red text-white font-ui font-medium text-sm rounded hover:bg-red-500 transition-colors duration-200"
              >
                Start a Project
              </button>
              <a
                href={aboutData.fiverrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 border border-border-subtle text-text-muted font-ui font-medium text-sm rounded hover:border-text-muted hover:text-text-primary transition-colors duration-200"
              >
                View Fiverr Profile
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
