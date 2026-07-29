import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, RefreshCw } from 'lucide-react';

const defaultAboutData = {
  headline: 'Storytelling Is an Act of Precision',
  bio: `I'm Matthew Delgado, a freelance video editor and motion graphics artist with over 6 years of experience turning raw footage into stories that inform, inspire, and move people to action.

My work lives at the intersection of journalism and design. Inspired by the visual language of Vox, Johnny Harris, and investigative documentary filmmaking, I specialize in building narrative architecture through precise cuts, data-driven motion graphics, and immersive sound design.

From the Venice Architecture Biennale to anti-corruption documentaries in Somalia, from Hong Kong film festival submissions to corporate leadership series in Australia — each project gets the same obsessive attention to detail.`,
  imageUrl: '',
  ratingBadge: '4.8',
  fiverrUrl: 'https://www.fiverr.com',
  achievements: [
    { icon: '🎬', label: 'Documentary Specialist' },
    { icon: '✦', label: 'Vox-Style Motion Graphics' },
    { icon: '🔊', label: 'Sound Design & Mix' },
    { icon: '🌍', label: 'International Clients' }
  ]
};

export default function AboutManager() {
  const [data, setData] = useState(defaultAboutData);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'sections', 'about'));
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching about data: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'sections', 'about'), data);
      alert('About section updated successfully!');
    } catch (err) {
      console.error("Error saving document: ", err);
      alert('Failed to save data');
    }
  };

  const handleSeedData = async () => {
    if (window.confirm('Seed database with default local data?')) {
      try {
        await setDoc(doc(db, 'sections', 'about'), defaultAboutData);
        setData(defaultAboutData);
        alert('Data seeded successfully!');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateAchievement = (index, field, value) => {
    const newAchievements = [...data.achievements];
    newAchievements[index] = { ...newAchievements[index], [field]: value };
    setData({ ...data, achievements: newAchievements });
  };

  if (loading) {
    return <div className="text-text-muted font-mono uppercase tracking-widest animate-pulse">Loading about settings...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary">About Section</h1>
        <button 
          onClick={handleSeedData}
          className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-subtle text-text-primary rounded hover:border-accent-red transition-colors font-mono text-xs uppercase"
        >
          <RefreshCw size={14} /> Seed Default Data
        </button>
      </div>

      <div className="bg-bg-card border border-border-subtle rounded-lg p-8">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-4 border-b border-border-subtle pb-6">
            <h2 className="font-ui text-lg font-semibold text-text-primary mb-4">Biography</h2>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Headline</label>
              <input 
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={data.headline}
                onChange={(e) => setData({...data, headline: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Full Bio (Leave blank lines for paragraphs)</label>
              <textarea 
                rows="8"
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={data.bio}
                onChange={(e) => setData({...data, bio: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4 border-b border-border-subtle pb-6">
            <h2 className="font-ui text-lg font-semibold text-text-primary mb-4">Badge & Links</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Profile Photo URL (Leave empty for default placeholder)</label>
                <input 
                  type="url"
                  className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none placeholder:text-text-muted/40"
                  placeholder="https://example.com/my-photo.jpg"
                  value={data.imageUrl || ''}
                  onChange={(e) => setData({...data, imageUrl: e.target.value})}
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Fiverr Rating Badge</label>
                <input 
                  required
                  className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                  value={data.ratingBadge}
                  onChange={(e) => setData({...data, ratingBadge: e.target.value})}
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Fiverr Profile Link</label>
                <input 
                  required
                  type="url"
                  className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                  value={data.fiverrUrl}
                  onChange={(e) => setData({...data, fiverrUrl: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pb-6">
            <h2 className="font-ui text-lg font-semibold text-text-primary mb-4">Key Achievements Grid (Max 4)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.achievements.map((ach, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    className="w-16 text-center bg-bg-primary border border-border-subtle rounded px-2 py-2 text-text-primary focus:border-accent-red outline-none"
                    value={ach.icon}
                    onChange={(e) => updateAchievement(i, 'icon', e.target.value)}
                    placeholder="Icon"
                  />
                  <input 
                    className="flex-1 bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                    value={ach.label}
                    onChange={(e) => updateAchievement(i, 'label', e.target.value)}
                    placeholder="Achievement Title"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-accent-red text-white font-semibold rounded hover:bg-red-500 transition-colors">
              <Save size={16} /> Save About Section
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
