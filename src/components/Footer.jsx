import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const DEFAULT_FOOTER = {
  tagline: 'Storytelling is an act of precision. Elevating documentaries, video essays, and explainers.',
  email: 'Matthewdelg@gmail.com',
  whatsapp: '+57 3152459216',
  socials: [
    { platform: 'Fiverr', url: 'https://www.fiverr.com/' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/' },
    { platform: 'Vimeo', url: 'https://vimeo.com/' }
  ]
};

export default function Footer() {
  const [footerData, setFooterData] = useState(DEFAULT_FOOTER);

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'sections', 'footer'));
        if (docSnap.exists()) {
          setFooterData(docSnap.data());
        }
      } catch (err) {
        console.error("Failed to load footer data", err);
      }
    };
    fetchFooter();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-primary pt-20 pb-10 px-6 border-t border-border-subtle relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-display text-2xl font-bold text-text-primary tracking-tight">
                Matthew<span className="text-accent-red">.</span>
              </span>
            </div>
            <p className="font-editorial italic text-text-muted text-base max-w-sm leading-relaxed mb-6">
              {footerData.tagline}
            </p>
            <div className="flex flex-col gap-2">
              <a href={`mailto:${footerData.email}`} className="font-mono text-sm text-text-primary hover:text-accent-red transition-colors duration-200">
                {footerData.email}
              </a>
              {footerData.whatsapp && (
                <a 
                  href={`https://wa.me/${footerData.whatsapp.replace(/\D/g,'')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-mono text-sm text-text-primary hover:text-accent-red transition-colors duration-200 flex items-center gap-2"
                >
                  WhatsApp: {footerData.whatsapp}
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-6">Explore</h4>
            <ul className="space-y-3 font-ui text-sm">
              <li><a href="#work" className="text-text-muted hover:text-text-primary transition-colors">Work</a></li>
              <li><a href="#services" className="text-text-muted hover:text-text-primary transition-colors">Services</a></li>
              <li><a href="#about" className="text-text-muted hover:text-text-primary transition-colors">About</a></li>
              <li><a href="#reviews" className="text-text-muted hover:text-text-primary transition-colors">Reviews</a></li>
            </ul>
          </div>

          {/* Social / Contact */}
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-6">Connect</h4>
            <ul className="space-y-3 font-ui text-sm">
              {footerData.socials?.map((social, idx) => (
                <li key={idx}>
                  <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-colors">
                    {social.platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border-subtle">
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            &copy; {currentYear} Matthew Delgado. All rights reserved.
          </p>

          <button
            onClick={scrollToTop}
            className="group flex items-center justify-center w-10 h-10 rounded-full border border-border-subtle text-text-muted hover:border-text-muted hover:text-text-primary transition-all duration-300"
            aria-label="Scroll to top"
          >
            <ArrowUp size={16} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </footer>
  );
}
