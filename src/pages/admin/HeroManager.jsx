import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, RefreshCw } from 'lucide-react';

const defaultHeroData = {
  categoryLabel: 'Video Editor — Motion Graphics',
  headline: 'Data-Driven Visual Storytelling & Vox-Style Motion Graphics',
  highlightedWords: 'Data-Driven, Vox-Style, Motion, Graphics',
  subHeadline: 'Elevating documentaries, video essays, and explainers with dynamic graphics, precise pacing, and immersive sound design.',
  videoId: '1214058780',
  stat1Value: '4.8★', stat1Label: 'Fiverr Rating',
  stat2Value: '20+', stat2Label: 'Verified Reviews',
  stat3Value: '6+', stat3Label: 'Years Experience'
};

export default function HeroManager() {
  const [data, setData] = useState(defaultHeroData);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'sections', 'hero'));
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching hero data: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'sections', 'hero'), data);
      alert('Hero section updated successfully!');
    } catch (err) {
      console.error("Error saving document: ", err);
      alert('Failed to save data');
    }
  };

  const handleSeedData = async () => {
    if (window.confirm('Seed database with default local data?')) {
      try {
        await setDoc(doc(db, 'sections', 'hero'), defaultHeroData);
        setData(defaultHeroData);
        alert('Data seeded successfully!');
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="text-text-muted font-mono uppercase tracking-widest animate-pulse">Loading hero settings...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary">Hero Section</h1>
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
            <h2 className="font-ui text-lg font-semibold text-text-primary mb-4">Main Content</h2>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Category Label (Small Text)</label>
              <input 
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={data.categoryLabel}
                onChange={(e) => setData({...data, categoryLabel: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Main Headline</label>
              <textarea 
                rows="2"
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={data.headline}
                onChange={(e) => setData({...data, headline: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Words to Highlight in Red (comma separated)</label>
              <input 
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={data.highlightedWords}
                onChange={(e) => setData({...data, highlightedWords: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Sub-Headline</label>
              <textarea 
                rows="3"
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={data.subHeadline}
                onChange={(e) => setData({...data, subHeadline: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4 border-b border-border-subtle pb-6">
            <h2 className="font-ui text-lg font-semibold text-text-primary mb-4">Background Video</h2>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Vimeo Video ID</label>
              <input 
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={data.videoId}
                onChange={(e) => setData({...data, videoId: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-4 pb-6">
            <h2 className="font-ui text-lg font-semibold text-text-primary mb-4">Quick Stats (Bottom of Hero)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Stat 1 Value</label>
                  <input className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none" value={data.stat1Value} onChange={(e) => setData({...data, stat1Value: e.target.value})} />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Stat 1 Label</label>
                  <input className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none" value={data.stat1Label} onChange={(e) => setData({...data, stat1Label: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Stat 2 Value</label>
                  <input className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none" value={data.stat2Value} onChange={(e) => setData({...data, stat2Value: e.target.value})} />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Stat 2 Label</label>
                  <input className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none" value={data.stat2Label} onChange={(e) => setData({...data, stat2Label: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Stat 3 Value</label>
                  <input className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none" value={data.stat3Value} onChange={(e) => setData({...data, stat3Value: e.target.value})} />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Stat 3 Label</label>
                  <input className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none" value={data.stat3Label} onChange={(e) => setData({...data, stat3Label: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-accent-red text-white font-semibold rounded hover:bg-red-500 transition-colors">
              <Save size={16} /> Save Hero Section
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
