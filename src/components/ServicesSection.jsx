import { motion } from 'framer-motion';
import { SERVICES, SKILLS_MARQUEE } from '../data/portfolio';

function ServiceCard({ service, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.55, delay: index * 0.12, ease: 'easeOut' }}
      className="group p-7 bg-bg-card border border-border-subtle rounded-sm hover:border-accent-red/30 transition-all duration-500 hover:glow-red relative overflow-hidden"
    >
      {/* Icon */}
      <div className="text-3xl mb-5">{service.icon}</div>

      {/* Title */}
      <h3 className="font-display text-xl font-bold text-text-primary mb-3 group-hover:text-accent-red transition-colors duration-300">
        {service.title}
      </h3>

      {/* Description */}
      <p className="font-editorial italic text-text-muted text-base leading-relaxed mb-6">
        {service.description}
      </p>

      {/* Bullet list */}
      <ul className="space-y-2">
        {service.bullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-2.5">
            <span className="w-1 h-1 rounded-full bg-accent-red shrink-0" />
            <span className="font-ui text-sm text-text-muted">{bullet}</span>
          </li>
        ))}
      </ul>

      {/* Shimmer on hover */}
      <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.div>
  );
}

export default function ServicesSection() {
  // Duplicate marquee items for seamless loop
  const marqueeItems = [...SKILLS_MARQUEE, ...SKILLS_MARQUEE];

  return (
    <section className="py-24 md:py-32 bg-bg-primary">
      <div className="max-w-[1600px] mx-auto px-6">

        {/* Section header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-5 reveal-up">
            <div className="h-[1px] w-8 bg-accent-red" />
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-accent-red">
              What I Do
            </span>
          </div>
          <h2
            className="font-display font-bold text-text-primary reveal-up"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            data-delay="100"
          >
            Services & Expertise
          </h2>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i} />
          ))}
        </div>

        {/* Software stack marquee */}
        <div className="border-t border-border-subtle pt-12 overflow-hidden">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted text-center mb-8">
            Tools & Software
          </p>
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

            <div className="marquee-track">
              {marqueeItems.map((item, i) => (
                <div key={i} className="flex items-center gap-10 mr-10 shrink-0">
                  <span className="font-display text-base font-bold text-text-primary/30 whitespace-nowrap uppercase tracking-widest hover:text-text-primary/70 transition-colors duration-300 cursor-default">
                    {item}
                  </span>
                  <span className="text-accent-red text-lg">✦</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
