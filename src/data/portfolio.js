// ============================================================
// MATTHEW DELGADO PORTFOLIO — Centralized Data
// ============================================================

export const PROJECTS = [
  {
    id: 1,
    title: 'Biennale Architettura 2025',
    client: 'Venice, Italy',
    category: 'Documentary',
    tags: ['Documentary', 'Motion Graphics'],
    description: 'Custom video editing and motion graphics integration for the official exhibition installation at the Venice Architecture Biennale.',
    videoUrl: 'https://youtu.be/1ZV3wTthNEU',
    videoId: '1ZV3wTthNEU',
    platform: 'youtube',
    thumbnail: null, // Will be auto-generated from YouTube
    featured: true,
  },
  {
    id: 2,
    title: 'Integrity Watch Somali',
    client: 'Somalia',
    category: 'Documentary',
    tags: ['Investigative Film', 'Documentary'],
    description: 'Investigative mini-documentary focused on anti-corruption and public transparency in Somalia. A high-impact journalistic piece with immersive sound design.',
    videoUrl: null,
    videoId: null,
    platform: null,
    thumbnail: null,
    featured: true,
  },
  {
    id: 3,
    title: 'Logic Lattice — Hey Hong Kong!',
    client: 'Hong Kong, 2024–2026',
    category: 'Documentary',
    tags: ['Documentary Editor', 'Motion Graphics', 'Film Festival'],
    description: 'Lead editor for the feature documentary "Hey Hong Kong!" (official film festival submissions). Investigative and journalistic documentaries with 2D motion graphics, managing archive workflows and international teams.',
    videoUrl: 'https://www.youtube.com/watch?v=TEgLj01VcbQ',
    videoId: 'TEgLj01VcbQ',
    platform: 'youtube',
    thumbnail: null,
    featured: true,
  },
  {
    id: 4,
    title: 'The Mindful Leader Group',
    client: 'Australia',
    category: 'Corporate',
    tags: ['Corporate', 'E-Learning'],
    description: 'End-to-end post-production and editing for a 33-episode corporate leadership masterclass. Full series consistency, color grading, and audio mix.',
    videoUrl: null,
    videoId: null,
    platform: null,
    thumbnail: null,
    featured: false,
  },
];

export const EXPERIENCE = [
  {
    id: 1,
    company: 'Splex ONE',
    location: 'New York, USA',
    role: 'Freelance Video Editor',
    period: '2024 — Present',
    current: true,
    bullets: [
      'Edit commercial spots, high-energy reels, and event highlights.',
      'Clients include Banco BHD and NYC Public Schools.',
      'Deliver broadcast-quality output for government and educational institutions.',
    ],
  },
  {
    id: 2,
    company: 'ComercioTV',
    location: 'Florida, USA',
    role: 'Staff Video Editor',
    period: '2022 — 2024',
    current: false,
    bullets: [
      'Staff editor for broadcast TV shows and full-length episodes.',
      'Produced promo trailers and commercials ensuring network visual consistency.',
      'Maintained strict broadcast standards for weekly deliverables.',
    ],
  },
  {
    id: 3,
    company: 'TarimaTV',
    location: 'Florida, USA',
    role: 'Freelance Video Editor',
    period: '2020 — Present',
    current: true,
    bullets: [
      'Produce promo spots and cultural broadcast content.',
      'Collaborated with Mastercard, SpectrumONE, and REIK.',
      'Delivered culturally resonant content for Latin American audiences.',
    ],
  },
  {
    id: 4,
    company: 'Kingsland Baptist Church',
    location: 'Texas, USA',
    role: 'Media Assistant',
    period: 'Apr 2023 — Jul 2023',
    current: false,
    bullets: [
      'Assisted in live recording and technical management of multimedia assets.',
      'Handled video editing for weekly services and special events.',
    ],
  },
];

export const REVIEWS = [
  {
    id: 1,
    name: 'Nicholas Gao',
    title: 'Director & Producer of "Hey Hong Kong!" Documentary Film',
    location: 'Hong Kong',
    rating: 5,
    quote: 'Matthew delivered outstanding work. The editing was precise, thoughtful, and elevated my film beyond expectations. Strong visual storytelling, excellent pacing, and great attention to detail throughout. Highly recommended.',
    platform: 'Fiverr',
  },
  {
    id: 2,
    name: 'spiromq',
    title: 'Client',
    location: 'United States',
    rating: 5,
    quote: "I recently worked with Matthew on an animation video, and I couldn't be happier with the results! From start to finish, he was professional, creative, and extremely detail-oriented. He took my vision and brought it to life with smooth animations, great attention to detail, and an amazing understanding of storytelling.",
    platform: 'Fiverr',
  },
  {
    id: 3,
    name: 'jameel_w',
    title: 'Client',
    location: 'United Kingdom',
    rating: 5,
    quote: 'Great time working with Matthew, he really overdelivered here and I\'m very content with the results. Will definitely be using his services again in the future.',
    platform: 'Fiverr',
  },
];

export const SERVICES = [
  {
    id: 1,
    icon: '🎬',
    title: 'Documentary & Video Essay Editing',
    description: 'Precise, narrative-driven editing that blends interviews, voiceover, archival footage, and data overlays into compelling visual stories.',
    bullets: ['Multicam & A/B roll assembly', 'Pacing & rhythm engineering', 'Color grading (DaVinci Resolve)', 'Subtitles & caption integration'],
  },
  {
    id: 2,
    icon: '✦',
    title: 'Vox-Style 2D Motion Graphics',
    description: 'Dynamic lower thirds, animated maps, kinetic typography, and data visualizations inspired by the editorial style of Vox and Johnny Harris.',
    bullets: ['Animated maps & data viz', 'Kinetic titlers & lower thirds', 'After Effects custom rigs', 'Frame-by-frame precision'],
  },
  {
    id: 3,
    icon: '🔊',
    title: 'Sound Design & Audio Mix',
    description: 'Immersive audio production that elevates documentary and explainer content — from SFX layering to full dialogue cleanup and music scoring.',
    bullets: ['Dialogue cleanup & EQ', 'Ambient & SFX layering', 'Music scoring & sync', 'Broadcast-level mastering'],
  },
];

export const STATS = [
  { value: 4.8, suffix: '', label: 'Fiverr Rating', decimals: 1 },
  { value: 20, suffix: '+', label: 'Verified Reviews', decimals: 0 },
  { value: 6, suffix: '+', label: 'Years of Experience', decimals: 0 },
];

export const SKILLS_MARQUEE = [
  'Adobe Premiere Pro',
  'After Effects',
  'DaVinci Resolve',
  'Adobe Audition',
  'Final Cut Pro',
  'Cinema 4D',
  'Photoshop',
  'Illustrator',
];
