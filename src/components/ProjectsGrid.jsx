import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Play, X } from 'lucide-react';
import { PROJECTS as localProjects } from '../data/portfolio';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CATEGORIES = ['All', 'Documentary', 'Corporate', 'Motion Graphics'];

// Helper to get YouTube high-res thumbnail
const getYTThumb = (id) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

/**
 * Featured Bento Card - Spans 2 columns, auto-plays video in background
 */
function FeaturedProjectCard({ project, onClick }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      whileHover="hover"
      className="group relative bg-black rounded-sm overflow-hidden border border-border-subtle cursor-pointer h-full min-h-[400px] md:min-h-[500px] flex flex-col justify-end md:col-span-2 lg:col-span-2 2xl:col-span-2"
      onClick={() => onClick(project)}
    >
      {/* Auto-playing Background Video */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        {project.platform === 'youtube' && project.videoId && (
          <iframe
            src={`https://www.youtube.com/embed/${project.videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${project.videoId}&modestbranding=1&playsinline=1`}
            className="absolute w-[300%] h-[300%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-70 transition-opacity duration-700 object-cover"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            title={project.title}
            tabIndex="-1"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
      </div>

      {/* Info Overlay */}
      <div className="relative z-10 p-6 md:p-10 w-full md:w-2/3">
        <motion.div 
          variants={{
            hover: { y: -10 }
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-red/20 border border-accent-red/30">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-red avail-pulse" />
              <span className="font-mono text-[9px] text-accent-red uppercase tracking-widest">Featured</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {project.tags?.slice(0, 2).map(tag => (
                <span key={tag} className="tag-pill border-white/20 text-white/80 bg-black/30 backdrop-blur-sm">{tag}</span>
              ))}
            </div>
          </div>
          
          <h3 className="font-display text-3xl md:text-4xl font-bold text-white mb-2 group-hover:text-accent-red transition-colors duration-300">
            {project.title}
          </h3>
          <p className="font-mono text-xs uppercase tracking-widest text-white/60 mb-4">
            {project.client}
          </p>
          <p className="font-ui text-base text-white/80 line-clamp-3 mb-6">
            {project.description}
          </p>
          
          <motion.button 
            variants={{
              initial: { opacity: 0.5, y: 0 },
              hover: { opacity: 1, y: 0, scale: 1.05 }
            }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-ui font-semibold text-sm rounded hover:bg-accent-red hover:text-white transition-colors duration-300 shadow-lg"
          >
            <Play size={15} fill="currentColor" />
            Watch Full Video
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

function ProjectCard({ project, onClick, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      className="project-card group relative bg-bg-card border border-border-subtle rounded-sm overflow-hidden cursor-pointer hover:border-accent-red/30 transition-all duration-500 hover:glow-red h-full flex flex-col"
      onClick={() => onClick(project)}
      data-cursor-type="video"
    >
      {/* Thumbnail area */}
      <div className="relative w-full overflow-hidden aspect-video">
        {/* Thumbnail image */}
        {project.videoId && project.platform === 'youtube' ? (
          <img
            src={getYTThumb(project.videoId)}
            alt={project.title}
            className="card-thumbnail object-cover w-full h-full"
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
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.tags?.slice(0, 2).map((tag) => (
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
        <p className="font-ui text-sm text-text-muted leading-relaxed line-clamp-2 mt-auto">
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
  const [projectsData, setProjectsData] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'projects'));
        if (querySnapshot.empty) {
          setProjectsData(localProjects); // Fallback to local
        } else {
          setProjectsData(querySnapshot.docs.map(doc => doc.data()));
        }
      } catch (err) {
        console.error("Failed to load projects from Firebase", err);
        setProjectsData(localProjects);
      }
    };
    fetchProjects();
  }, []);

  useScrollReveal('.reveal-up');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedProject(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedProject]);

  const filtered = activeFilter === 'All'
    ? projectsData
    : projectsData.filter((p) => p.category === activeFilter || (p.tags && p.tags.includes(activeFilter)));

  const featuredProject = filtered.length > 0 ? filtered[0] : null;
  const standardProjects = filtered.length > 1 ? filtered.slice(1) : [];

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
            Featured Projects
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
            {featuredProject && (
              <FeaturedProjectCard 
                key={`featured-${featuredProject.id}`} 
                project={featuredProject} 
                onClick={setSelectedProject} 
              />
            )}
            
            {standardProjects.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
                onClick={setSelectedProject}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Video Modal Lightbox */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedProject(null)}
          >
            <div className="absolute top-6 right-6 md:top-10 md:right-10 z-50">
              <button
                onClick={() => setSelectedProject(null)}
                className="w-12 h-12 bg-black/50 hover:bg-accent-red text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors duration-200 border border-white/10"
              >
                <X size={24} />
              </button>
            </div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="w-full max-w-6xl flex flex-col gap-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative">
                {selectedProject.platform === 'youtube' && selectedProject.videoId && (
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedProject.videoId}?autoplay=1&rel=0`}
                    title={selectedProject.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
                {selectedProject.platform === 'vimeo' && selectedProject.videoId && (
                  <iframe
                    src={`https://player.vimeo.com/video/${selectedProject.videoId}?autoplay=1&title=0&byline=0&portrait=0`}
                    title={selectedProject.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                )}
                {!selectedProject.videoId && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
                    <Play size={48} className="mb-4 opacity-20" />
                    <p className="font-mono text-sm uppercase tracking-widest">Video Pending or Private</p>
                  </div>
                )}
              </div>

              {/* Project info below video (Animated) */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col md:flex-row items-start justify-between gap-6 bg-bg-card border border-border-subtle p-6 rounded-lg"
              >
                <div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-text-primary mb-2">{selectedProject.title}</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-[10px] text-accent-red uppercase tracking-widest bg-accent-red/10 px-2 py-0.5 rounded-full border border-accent-red/20">{selectedProject.client}</span>
                    <span className="text-border-subtle">·</span>
                    <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">{selectedProject.category}</span>
                  </div>
                  <p className="font-ui text-sm md:text-base text-text-muted leading-relaxed max-w-3xl">
                    {selectedProject.description}
                  </p>
                </div>
                {selectedProject.videoUrl && (
                  <a
                    href={selectedProject.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3 bg-bg-card-alt border border-border-subtle hover:border-accent-red hover:text-accent-red rounded transition-colors font-mono text-[10px] uppercase tracking-widest shrink-0"
                  >
                    Watch on {selectedProject.platform === 'youtube' ? 'YouTube' : 'Vimeo'}
                    <ExternalLink size={14} />
                  </a>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
