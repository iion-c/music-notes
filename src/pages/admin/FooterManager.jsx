import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Save, RefreshCw, Plus, Trash2 } from 'lucide-react';

const defaultFooterData = {
  tagline: 'Storytelling is an act of precision. Elevating documentaries, video essays, and explainers.',
  email: 'Matthewdelg@gmail.com',
  whatsapp: '+57 3152459216',
  socials: [
    { platform: 'Fiverr', url: 'https://www.fiverr.com/' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/' },
    { platform: 'Vimeo', url: 'https://vimeo.com/' }
  ]
};

export default function FooterManager() {
  const [data, setData] = useState(defaultFooterData);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, 'sections', 'footer'));
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching footer data: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'sections', 'footer'), data);
      alert('Footer updated successfully!');
    } catch (err) {
      console.error("Error saving document: ", err);
      alert('Failed to save data');
    }
  };

  const handleSeedData = async () => {
    if (window.confirm('Seed database with default local data?')) {
      try {
        await setDoc(doc(db, 'sections', 'footer'), defaultFooterData);
        setData(defaultFooterData);
        alert('Data seeded successfully!');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddSocial = () => {
    setData({
      ...data,
      socials: [...data.socials, { platform: 'New Link', url: 'https://' }]
    });
  };

  const handleUpdateSocial = (index, field, value) => {
    const newSocials = [...data.socials];
    newSocials[index][field] = value;
    setData({ ...data, socials: newSocials });
  };

  const handleRemoveSocial = (index) => {
    const newSocials = data.socials.filter((_, i) => i !== index);
    setData({ ...data, socials: newSocials });
  };

  if (loading) {
    return <div className="text-text-muted font-mono uppercase tracking-widest animate-pulse">Loading footer settings...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary">Footer Section</h1>
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
            <h2 className="font-ui text-lg font-semibold text-text-primary mb-4">Branding & Contact Info</h2>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Tagline / Bio</label>
              <textarea 
                rows="2"
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={data.tagline}
                onChange={(e) => setData({...data, tagline: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Email Address</label>
                <input 
                  type="email"
                  required
                  className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                  value={data.email}
                  onChange={(e) => setData({...data, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">WhatsApp Number (e.g., +57 3152459216)</label>
                <input 
                  type="text"
                  required
                  className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                  value={data.whatsapp}
                  onChange={(e) => setData({...data, whatsapp: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-ui text-lg font-semibold text-text-primary">Social Links (Connect)</h2>
              <button 
                type="button" 
                onClick={handleAddSocial}
                className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-text-muted hover:text-white transition-colors"
              >
                <Plus size={14} /> Add Link
              </button>
            </div>
            
            <div className="space-y-3">
              {data.socials.map((social, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <input 
                    className="w-1/3 bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                    value={social.platform}
                    onChange={(e) => handleUpdateSocial(i, 'platform', e.target.value)}
                    placeholder="Platform Name (e.g. LinkedIn)"
                  />
                  <input 
                    type="url"
                    className="flex-1 bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                    value={social.url}
                    onChange={(e) => handleUpdateSocial(i, 'url', e.target.value)}
                    placeholder="URL (https://...)"
                  />
                  <button 
                    type="button"
                    onClick={() => handleRemoveSocial(i)}
                    className="p-2 text-text-muted hover:text-accent-red transition-colors rounded bg-bg-primary border border-border-subtle"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-accent-red text-white font-semibold rounded hover:bg-red-500 transition-colors">
              <Save size={16} /> Save Footer
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
