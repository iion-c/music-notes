import { useState } from 'react';
import LoadingScreen from '../components/LoadingScreen';
import CustomCursor from '../components/CustomCursor';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProjectsGrid from '../components/ProjectsGrid';
import ExperienceTimeline from '../components/ExperienceTimeline';
import ServicesSection from '../components/ServicesSection';
import AboutSection from '../components/AboutSection';
import ReviewsSection from '../components/ReviewsSection';
import ContactForm from '../components/ContactForm';
import Footer from '../components/Footer';

export default function Home() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      <CustomCursor />
      
      {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      
      <div className={loading ? 'h-screen overflow-hidden' : ''}>
        <Navbar />
        <main>
          <Hero />
          <ProjectsGrid />
          <ExperienceTimeline />
          <ServicesSection />
          <AboutSection />
          <ReviewsSection />
          <ContactForm />
        </main>
        <Footer />
      </div>
    </>
  );
}
