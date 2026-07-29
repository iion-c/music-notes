import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PROJECTS as localProjects } from '../../data/portfolio';
import { Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProjectsManager() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);

  // Fetch projects from Firestore
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      const projs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      projs.sort((a, b) => {
        const orderA = a.order !== undefined ? Number(a.order) : 0;
        const orderB = b.order !== undefined ? Number(b.order) : 0;
        return orderA - orderB;
      });
      setProjects(projs);
    } catch (error) {
      console.error("Error fetching projects: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Seed Data if empty
  const handleSeedData = async () => {
    if (window.confirm('Are you sure you want to seed the database with local data?')) {
      try {
        setLoading(true);
        for (const proj of localProjects) {
          await setDoc(doc(db, 'projects', String(proj.id)), proj);
        }
        await fetchProjects();
      } catch (err) {
        console.error(err);
        alert('Error seeding data');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentProject.id && currentProject._isNew !== true) {
        // Update
        const projRef = doc(db, 'projects', String(currentProject.id));
        await updateDoc(projRef, currentProject);
      } else {
        // Create
        const newProj = { ...currentProject };
        delete newProj._isNew;
        if (!newProj.id) newProj.id = Date.now(); // Generate ID if none
        await setDoc(doc(db, 'projects', String(newProj.id)), newProj);
      }
      setIsEditing(false);
      fetchProjects();
    } catch (err) {
      console.error("Error saving document: ", err);
      alert('Failed to save project');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteDoc(doc(db, 'projects', String(id)));
        fetchProjects();
      } catch (err) {
        console.error("Error deleting document: ", err);
      }
    }
  };

  const startNewProject = () => {
    setCurrentProject({
      id: Date.now(),
      _isNew: true,
      title: '',
      client: '',
      description: '',
      category: 'Documentary',
      tags: [],
      platform: 'youtube',
      videoId: '',
      videoUrl: '',
      order: 0
    });
    setIsEditing(true);
  };

  const handleTagChange = (e) => {
    const tags = e.target.value.split(',').map(t => t.trim());
    setCurrentProject({ ...currentProject, tags });
  };

  if (loading) {
    return <div className="text-text-muted font-mono uppercase tracking-widest animate-pulse">Loading projects...</div>;
  }

  if (isEditing) {
    return (
      <div className="bg-bg-card border border-border-subtle rounded-lg p-8">
        <div className="flex items-center justify-between mb-8 border-b border-border-subtle pb-4">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            {currentProject._isNew ? 'Add New Project' : 'Edit Project'}
          </h2>
          <button onClick={() => setIsEditing(false)} className="text-text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Title</label>
              <input 
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentProject.title}
                onChange={(e) => setCurrentProject({...currentProject, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Order (1 = First, 2 = Second, etc)</label>
              <input 
                type="number"
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentProject.order || 0}
                onChange={(e) => setCurrentProject({...currentProject, order: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Client / Role</label>
              <input 
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentProject.client}
                onChange={(e) => setCurrentProject({...currentProject, client: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Description</label>
              <textarea 
                rows="3"
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentProject.description}
                onChange={(e) => setCurrentProject({...currentProject, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Category</label>
              <select 
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentProject.category}
                onChange={(e) => setCurrentProject({...currentProject, category: e.target.value})}
              >
                <option value="Documentary">Documentary</option>
                <option value="Corporate">Corporate</option>
                <option value="Motion Graphics">Motion Graphics</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Tags (comma separated)</label>
              <input 
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentProject.tags?.join(', ') || ''}
                onChange={handleTagChange}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Platform</label>
              <select 
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentProject.platform}
                onChange={(e) => setCurrentProject({...currentProject, platform: e.target.value})}
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Video ID</label>
              <input 
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none placeholder:text-text-muted/50"
                placeholder="e.g. dQw4w9WgXcQ"
                value={currentProject.videoId}
                onChange={(e) => setCurrentProject({...currentProject, videoId: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Full Video URL (optional)</label>
              <input 
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentProject.videoUrl || ''}
                onChange={(e) => setCurrentProject({...currentProject, videoUrl: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-6 border-t border-border-subtle">
            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 rounded text-text-muted hover:bg-bg-primary transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-accent-red text-white font-semibold rounded hover:bg-red-500 transition-colors">
              <Save size={16} /> Save Project
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary">Projects</h1>
        <div className="flex gap-4">
          {projects.length === 0 && (
            <button 
              onClick={handleSeedData}
              className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-subtle text-text-primary rounded hover:border-accent-red transition-colors font-mono text-xs uppercase"
            >
              <RefreshCw size={14} /> Seed Data
            </button>
          )}
          <button 
            onClick={startNewProject}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded hover:bg-accent-red hover:text-white transition-colors"
          >
            <Plus size={16} /> Add Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <motion.div 
            key={proj.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-bg-card border border-border-subtle rounded overflow-hidden flex flex-col"
          >
            <div className="aspect-video bg-bg-primary relative border-b border-border-subtle">
              {proj.platform === 'youtube' && proj.videoId ? (
                <img src={`https://img.youtube.com/vi/${proj.videoId}/hqdefault.jpg`} className="w-full h-full object-cover opacity-70" alt="thumb" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted">No Image</div>
              )}
            </div>
            <div className="p-4 flex-1">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-display font-bold text-lg truncate">{proj.title}</h3>
                <span className="shrink-0 bg-bg-primary px-2 py-0.5 rounded text-xs font-mono border border-border-subtle text-text-muted">Order: {proj.order || 0}</span>
              </div>
              <p className="font-mono text-[10px] text-text-muted uppercase mt-1 truncate">{proj.client}</p>
            </div>
            <div className="p-4 border-t border-border-subtle flex justify-between">
              <button 
                onClick={() => {
                  setCurrentProject(proj);
                  setIsEditing(true);
                }}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button 
                onClick={() => handleDelete(proj.id)}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-red transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
