import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SERVICES as localServices, SKILLS_MARQUEE as localSkills } from '../../data/portfolio';
import { Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ServicesManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSrv, setCurrentSrv] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'services'));
      let srvs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      srvs.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      setServices(srvs);
    } catch (error) {
      console.error("Error fetching services: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSeedData = async () => {
    if (window.confirm('Seed the database with local services data?')) {
      try {
        setLoading(true);
        for (let i = 0; i < localServices.length; i++) {
          const srv = localServices[i];
          const seedId = String(srv.id || Date.now() + i);
          await setDoc(doc(db, 'services', seedId), { ...srv, id: seedId });
        }
        await fetchData();
      } catch (err) {
        console.error(err);
        alert('Error seeding data');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentSrv.id && currentSrv._isNew !== true) {
        const docRef = doc(db, 'services', String(currentSrv.id));
        await updateDoc(docRef, currentSrv);
      } else {
        const newSrv = { ...currentSrv };
        delete newSrv._isNew;
        if (!newSrv.id) newSrv.id = String(Date.now());
        await setDoc(doc(db, 'services', String(newSrv.id)), newSrv);
      }
      setIsEditing(false);
      fetchData();
    } catch (err) {
      console.error("Error saving document: ", err);
      alert('Failed to save service');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteDoc(doc(db, 'services', String(id)));
        fetchData();
      } catch (err) {
        console.error("Error deleting document: ", err);
      }
    }
  };

  const startNewService = () => {
    setCurrentSrv({
      id: String(Date.now()),
      _isNew: true,
      title: '',
      icon: '🎥',
      description: '',
      bullets: ['']
    });
    setIsEditing(true);
  };

  const handleBulletChange = (index, value) => {
    const newBullets = [...currentSrv.bullets];
    newBullets[index] = value;
    setCurrentSrv({ ...currentSrv, bullets: newBullets });
  };

  const addBullet = () => {
    setCurrentSrv({ ...currentSrv, bullets: [...currentSrv.bullets, ''] });
  };

  const removeBullet = (index) => {
    const newBullets = currentSrv.bullets.filter((_, i) => i !== index);
    setCurrentSrv({ ...currentSrv, bullets: newBullets });
  };

  if (loading) {
    return <div className="text-text-muted font-mono uppercase tracking-widest animate-pulse">Loading services...</div>;
  }

  if (isEditing) {
    return (
      <div className="bg-bg-card border border-border-subtle rounded-lg p-8">
        <div className="flex items-center justify-between mb-8 border-b border-border-subtle pb-4">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            {currentSrv._isNew ? 'Add Service' : 'Edit Service'}
          </h2>
          <button onClick={() => setIsEditing(false)} className="text-text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="flex gap-4">
              <div className="w-24">
                <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Emoji Icon</label>
                <input 
                  required
                  className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none text-center text-xl"
                  value={currentSrv.icon}
                  onChange={(e) => setCurrentSrv({...currentSrv, icon: e.target.value})}
                />
              </div>
              <div className="flex-1">
                <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Service Title</label>
                <input 
                  required
                  className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                  value={currentSrv.title}
                  onChange={(e) => setCurrentSrv({...currentSrv, title: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Description</label>
              <textarea 
                rows="3"
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentSrv.description}
                onChange={(e) => setCurrentSrv({...currentSrv, description: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border-subtle">
            <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-4">Service Features / Bullets</label>
            <div className="space-y-3">
              {currentSrv.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-2">
                  <input 
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
              <Plus size={14} /> Add Feature
            </button>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-border-subtle">
            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 rounded text-text-muted hover:bg-bg-primary transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-accent-red text-white font-semibold rounded hover:bg-red-500 transition-colors">
              <Save size={16} /> Save Service
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary">Services</h1>
        <div className="flex gap-4">
          {services.length === 0 && (
            <button 
              onClick={handleSeedData}
              className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-subtle text-text-primary rounded hover:border-accent-red transition-colors font-mono text-xs uppercase"
            >
              <RefreshCw size={14} /> Seed Data
            </button>
          )}
          <button 
            onClick={startNewService}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded hover:bg-accent-red hover:text-white transition-colors"
          >
            <Plus size={16} /> Add Service
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {services.map((srv) => (
          <motion.div 
            key={srv.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-bg-card border border-border-subtle rounded p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{srv.icon}</span>
                <h3 className="font-display font-bold text-lg text-text-primary">{srv.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setCurrentSrv(srv); setIsEditing(true); }} className="p-2 text-text-muted hover:text-white transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(srv.id)} className="p-2 text-text-muted hover:text-accent-red transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="font-ui text-sm text-text-muted mb-4 line-clamp-2">{srv.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
