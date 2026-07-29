import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { PROJECTS } from '../data/portfolio';
import { useScrollReveal } from '../hooks/useScrollReveal';

const CATEGORIES = ['All', 'Documentary', 'Corporate'];

// YouTube thumbnail helper
const getYTThumb = (id) =>
  id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;

function VideoModal({ project, onClose }) {
  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const getEmbedUrl = (project) => {
    if (!project.videoId) return null;
    if (project.platform === 'youtube') {
      return `https://www.youtube.com/embed/${project.videoId}?autoplay=1&rel=0&modestbranding=1&color=white`;
    }
    if (project.platform === 'vimeo') {
      return `https://player.vimeo.com/video/${project.videoId}?autoplay=1&byline=0&title=0&portrait=0`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(project);

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-[1200px] mx-4"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-text-muted hover:text-text-primary transition-colors duration-200 flex items-center gap-2 font-mono text-xs uppercase tracking-widest"
        >
          Close <X size={16} />
        </button>

        {/* Video or Case Study */}
        {embedUrl ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full rounded-sm"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={project.title}
            />
          </div>
        ) : (
          /* Case study card for projects without video */
          <div className="bg-bg-card border border-border-subtle rounded-sm p-8 md:p-12">
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.map((tag) => (
                <span key={tag} className="tag-pill">{tag}</span>
              ))}
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mb-2">{project.title}</h2>
            <p className="font-mono text-xs text-accent-red uppercase tracking-widest mb-6">{project.client}</p>
            <p className="font-editorial text-lg text-text-muted leading-relaxed italic">{project.description}</p>
            <div className="mt-8 pt-6 border-t border-border-subtle">
              <p className="font-mono text-xs text-text-muted uppercase tracking-widest">
                Video coming soon — reach out for a private screening link.
              </p>
            </div>
          </div>
        )}

        {/* Project info below video */}
        {embedUrl && (
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-text-primary">{project.title}</h3>
              <p className="font-mono text-xs text-accent-red uppercase tracking-widest mt-1">{project.client}</p>
            </div>
            {project.videoUrl && (
              <a
                href={project.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors font-mono text-xs uppercase tracking-widest shrink-0"
              >
                Watch on {project.platform === 'youtube' ? 'YouTube' : 'Vimeo'}
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function ProjectCard({ project, onClick, index }) {
  const videoRef = useRef(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      className="project-card group relative bg-bg-card border border-border-subtle rounded-sm overflow-hidden cursor-pointer hover:border-accent-red/30 transition-all duration-500 hover:glow-red"
      onClick={onClick}
      data-cursor-type="video"
    >
      {/* Thumbnail area */}
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%' }}>
        {/* Thumbnail image */}
        {project.videoId && project.platform === 'youtube' ? (
          <img
            src={getYTThumb(project.videoId)}
            alt={project.title}
            className="card-thumbnail"
            loading="lazy"
            onError={(e) => {
              e.target.src = `https://img.youtube.com/vi/${project.videoId}/hqdefault.jpg`;
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-bg-card-alt flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">🎬</div>
              <p className="font-mono text-xs text-text-muted uppercase tracking-widest">Private Project</p>
            </div>
          </div>
        )}

        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-bg-primary/0 group-hover:bg-bg-primary/30 transition-all duration-500 z-10" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full border-2 border-white/80 flex items-center justify-center backdrop-blur-sm bg-black/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Category tag */}
        <div className="absolute top-3 left-3 z-20">
          <span className="tag-pill">{project.category}</span>
        </div>
      </div>

      {/* Card content */}
      <div className="p-5">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
              {tag}
              {project.tags.indexOf(tag) < Math.min(1, project.tags.length - 1) && (
                <span className="ml-1.5 text-border-subtle">·</span>
              )}
            </span>
          ))}
        </div>

        <h3 className="font-display text-xl font-bold text-text-primary mb-1 group-hover:text-accent-red transition-colors duration-300">
          {project.title}
        </h3>
        <p className="font-mono text-xs text-text-muted mb-3 uppercase tracking-wider">
          {project.client}
        </p>
        <p className="font-ui text-sm text-text-muted leading-relaxed line-clamp-2">
          {project.description}
        </p>
      </div>

      {/* Bottom shimmer on hover */}
      <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
}

export default function ProjectsGrid() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);

  useScrollReveal('.reveal-up');

  const filtered = activeFilter === 'All'
    ? PROJECTS
    : PROJECTS.filter((p) => p.category === activeFilter || p.tags.includes(activeFilter));

  return (
    <section id="work" className="py-24 md:py-32 px-6 lg:px-12 bg-bg-primary">
      <div className="max-w-[1600px] mx-auto">

        {/* Section header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-5 reveal-up">
            <div className="h-[1px] w-8 bg-accent-red" />
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-accent-red">
              Selected Work
            </span>
          </div>
          <h2
            className="font-display font-bold text-text-primary reveal-up"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            data-delay="100"
          >
            Projects That Move People
          </h2>
          <p className="font-editorial italic text-text-muted text-lg mt-3 max-w-xl reveal-up" data-delay="150">
            From investigative documentaries to Vox-style explainers — each project tells a story that resonates.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-10 reveal-up" data-delay="200">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-1.5 rounded font-mono text-xs uppercase tracking-widest transition-all duration-200 ${
                activeFilter === cat
                  ? 'bg-accent-red text-white'
                  : 'border border-border-subtle text-text-muted hover:border-text-muted hover:text-text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedProject && (
          <VideoModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
