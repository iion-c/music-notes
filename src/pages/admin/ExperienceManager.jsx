import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { EXPERIENCE as localExperience } from '../../data/portfolio';
import { Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ExperienceManager() {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentExp, setCurrentExp] = useState(null);

  const fetchExperience = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'experience'));
      let exps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by order or just ID if numeric
      exps.sort((a, b) => a.id - b.id);
      setExperiences(exps);
    } catch (error) {
      console.error("Error fetching experience: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExperience();
  }, []);

  const handleSeedData = async () => {
    if (window.confirm('Seed the database with local experience data?')) {
      try {
        setLoading(true);
        for (let i = 0; i < localExperience.length; i++) {
          const exp = localExperience[i];
          const seedId = String(exp.id || Date.now() + i);
          await setDoc(doc(db, 'experience', seedId), { ...exp, id: seedId });
        }
        await fetchExperience();
      } catch (err) {
        console.error(err);
        alert('Error seeding data');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentExp.id && currentExp._isNew !== true) {
        const expRef = doc(db, 'experience', String(currentExp.id));
        await updateDoc(expRef, currentExp);
      } else {
        const newExp = { ...currentExp };
        delete newExp._isNew;
        if (!newExp.id) newExp.id = String(Date.now());
        await setDoc(doc(db, 'experience', String(newExp.id)), newExp);
      }
      setIsEditing(false);
      fetchExperience();
    } catch (err) {
      console.error("Error saving document: ", err);
      alert('Failed to save experience');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this experience?')) {
      try {
        await deleteDoc(doc(db, 'experience', String(id)));
        fetchExperience();
      } catch (err) {
        console.error("Error deleting document: ", err);
      }
    }
  };

  const startNewExperience = () => {
    setCurrentExp({
      id: String(Date.now()),
      _isNew: true,
      company: '',
      role: '',
      period: '',
      location: '',
      current: false,
      bullets: ['']
    });
    setIsEditing(true);
  };

  const handleBulletChange = (index, value) => {
    const newBullets = [...currentExp.bullets];
    newBullets[index] = value;
    setCurrentExp({ ...currentExp, bullets: newBullets });
  };

  const addBullet = () => {
    setCurrentExp({ ...currentExp, bullets: [...currentExp.bullets, ''] });
  };

  const removeBullet = (index) => {
    const newBullets = currentExp.bullets.filter((_, i) => i !== index);
    setCurrentExp({ ...currentExp, bullets: newBullets });
  };

  if (loading) {
    return <div className="text-text-muted font-mono uppercase tracking-widest animate-pulse">Loading experience...</div>;
  }

  if (isEditing) {
    return (
      <div className="bg-bg-card border border-border-subtle rounded-lg p-8">
        <div className="flex items-center justify-between mb-8 border-b border-border-subtle pb-4">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            {currentExp._isNew ? 'Add Experience' : 'Edit Experience'}
          </h2>
          <button onClick={() => setIsEditing(false)} className="text-text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Company</label>
              <input 
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentExp.company}
                onChange={(e) => setCurrentExp({...currentExp, company: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Role / Title</label>
              <input 
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentExp.role}
                onChange={(e) => setCurrentExp({...currentExp, role: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Period (e.g. 2021 - Present)</label>
              <input 
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentExp.period}
                onChange={(e) => setCurrentExp({...currentExp, period: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Location</label>
              <input 
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentExp.location}
                onChange={(e) => setCurrentExp({...currentExp, location: e.target.value})}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <input 
                type="checkbox"
                id="current"
                className="w-4 h-4 accent-accent-red"
                checked={currentExp.current}
                onChange={(e) => setCurrentExp({...currentExp, current: e.target.checked})}
              />
              <label htmlFor="current" className="font-mono text-xs text-text-primary uppercase tracking-widest">
                This is my current role
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-border-subtle">
            <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-4">Description Bullets</label>
            <div className="space-y-3">
              {currentExp.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-2">
                  <textarea 
                    rows="2"
                    required
                    className="flex-1 bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                    value={bullet}
                    onChange={(e) => handleBulletChange(i, e.target.value)}
                  />
                  <button type="button" onClick={() => removeBullet(i)} className="mt-1 p-2 text-text-muted hover:text-accent-red">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addBullet} className="mt-4 text-xs font-mono uppercase tracking-widest text-accent-red hover:text-red-400 flex items-center gap-1">
              <Plus size={14} /> Add Bullet
            </button>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-border-subtle">
            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 rounded text-text-muted hover:bg-bg-primary transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-accent-red text-white font-semibold rounded hover:bg-red-500 transition-colors">
              <Save size={16} /> Save Experience
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary">Experience</h1>
        <div className="flex gap-4">
          {experiences.length === 0 && (
            <button 
              onClick={handleSeedData}
              className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-subtle text-text-primary rounded hover:border-accent-red transition-colors font-mono text-xs uppercase"
            >
              <RefreshCw size={14} /> Seed Data
            </button>
          )}
          <button 
            onClick={startNewExperience}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded hover:bg-accent-red hover:text-white transition-colors"
          >
            <Plus size={16} /> Add Experience
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {experiences.map((exp) => (
          <motion.div 
            key={exp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card border border-border-subtle rounded p-6 flex items-start justify-between"
          >
            <div>
              <h3 className="font-display font-bold text-lg text-text-primary mb-1">
                {exp.company} {exp.current && <span className="text-green-500 text-xs ml-2">(Current)</span>}
              </h3>
              <p className="font-ui text-sm text-accent-red font-medium mb-1">{exp.role}</p>
              <p className="font-mono text-xs text-text-muted uppercase tracking-wider">{exp.period}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => { setCurrentExp(exp); setIsEditing(true); }} className="p-2 text-text-muted hover:text-white transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(exp.id)} className="p-2 text-text-muted hover:text-accent-red transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
