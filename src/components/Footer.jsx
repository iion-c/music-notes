import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-primary pt-20 pb-10 px-6 border-t border-border-subtle relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-display text-2xl font-bold text-text-primary tracking-tight">
                Matthew<span className="text-accent-red">.</span>
              </span>
            </div>
            <p className="font-editorial italic text-text-muted text-base max-w-sm leading-relaxed mb-6">
              Storytelling is an act of precision. Elevating documentaries, video essays, and explainers.
            </p>
            <a href="mailto:Matthewdelg@gmail.com" className="font-mono text-sm text-text-primary hover:text-accent-red transition-colors duration-200">
              Matthewdelg@gmail.com
            </a>
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
              <li>
                <a href="https://www.fiverr.com/" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-colors">
                  Fiverr
                </a>
              </li>
              <li>
                <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-colors">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="https://vimeo.com/" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-colors">
                  Vimeo
                </a>
              </li>
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
