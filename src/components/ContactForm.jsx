import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, CheckCircle } from 'lucide-react';

const VIDEO_TYPES = ['Documentary', 'Vox-Style Explainer', 'Commercial / Social Media', 'Corporate / E-Learning', 'Other'];
const DURATIONS = ['Under 30 minutes of raw footage', '30 min – 2 hours', '2 – 5 hours', '5+ hours'];
const BUDGETS = ['Under $500', '$500 – $1,500', '$1,500 – $3,000', '$3,000+', 'Let\'s discuss'];

// Formspree endpoint
const FORMSPREE_URL = 'https://formspree.io/f/xojgbpdb';

export default function ContactForm() {
  const [form, setForm] = useState({
    name: '', email: '', videoType: '', duration: '', budget: '', message: '',
  });
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    data.append('_replyto', form.email);
    data.append('_subject', `New project inquiry from ${form.name}`);

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', videoType: '', duration: '', budget: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const inputClass = `
    w-full bg-bg-card-alt border border-border-subtle rounded-sm px-4 py-3
    font-ui text-sm text-text-primary placeholder-text-muted/50
    focus:outline-none focus:border-accent-red/50 focus:ring-1 focus:ring-accent-red/20
    transition-colors duration-200
  `;
  const selectClass = `${inputClass} cursor-pointer appearance-none`;
  const labelClass = 'block font-mono text-[10px] uppercase tracking-widest text-text-muted mb-2';

  return (
    <section id="contact" className="py-24 md:py-32 px-6 bg-bg-card grain-overlay relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-red/4 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-5 reveal-up">
            <div className="h-[1px] w-8 bg-accent-red" />
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-accent-red">
              Let's Work Together
            </span>
            <div className="h-[1px] w-8 bg-accent-red" />
          </div>
          <h2
            className="font-display font-bold text-text-primary reveal-up"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
            data-delay="100"
          >
            Start a Conversation
          </h2>
          <p className="font-editorial italic text-text-muted text-lg mt-3 reveal-up" data-delay="150">
            Tell me about your project — I'll get back to you within 24 hours.
          </p>
        </div>

        {/* Success state */}
        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-bg-card border border-green-500/20 rounded-sm"
          >
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold text-text-primary mb-2">Message Sent!</h3>
            <p className="font-ui text-text-muted mb-4">
              Thanks for reaching out. I'll be in touch at <span className="text-text-primary">{form.email || 'your email'}</span> shortly.
            </p>
            <div className="inline-block bg-accent-red/10 border border-accent-red/20 rounded px-4 py-3 text-sm text-text-primary/90 font-ui text-left max-w-md">
              <span className="font-bold text-accent-red block mb-1">Have a script or brief?</span>
              You can simply reply to my email and attach your PDF or documents there!
            </div>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className={labelClass}>Full Name *</label>
                <input
                  id="name" name="name" type="text" required
                  value={form.name} onChange={handleChange}
                  placeholder="Your name"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>Email Address *</label>
                <input
                  id="email" name="email" type="email" required
                  value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Video type */}
            <div>
              <label htmlFor="videoType" className={labelClass}>Type of Video *</label>
              <div className="relative">
                <select
                  id="videoType" name="videoType" required
                  value={form.videoType} onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">Select a type...</option>
                  {VIDEO_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">▾</div>
              </div>
            </div>

            {/* Duration + Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="duration" className={labelClass}>Estimated Raw Material Duration</label>
                <div className="relative">
                  <select
                    id="duration" name="duration"
                    value={form.duration} onChange={handleChange}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">▾</div>
                </div>
              </div>
              <div>
                <label htmlFor="budget" className={labelClass}>Budget Range</label>
                <div className="relative">
                  <select
                    id="budget" name="budget"
                    value={form.budget} onChange={handleChange}
                    className={selectClass}
                  >
                    <option value="">Select...</option>
                    {BUDGETS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">▾</div>
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className={labelClass}>Project Details</label>
              <textarea
                id="message" name="message"
                value={form.message} onChange={handleChange}
                placeholder="Tell me about your vision, timeline, and any creative references..."
                rows={5}
                className={inputClass}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full flex items-center justify-center gap-2 py-4 bg-accent-red text-white font-ui font-semibold text-sm rounded hover:bg-red-500 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,59,48,0.3)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'sending' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Send Message
                </>
              )}
            </button>

            {status === 'error' && (
              <p className="text-center font-mono text-xs text-red-400 uppercase tracking-wider">
                Something went wrong. Please email directly: Matthewdelg@gmail.com
              </p>
            )}
          </motion.form>
        )}
      </div>
    </section>
  );
}
