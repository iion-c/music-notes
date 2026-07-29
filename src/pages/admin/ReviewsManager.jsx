import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { REVIEWS as localReviews } from '../../data/portfolio';
import { Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReviewsManager() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'reviews'));
      const revs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(revs);
    } catch (error) {
      console.error("Error fetching reviews: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSeedData = async () => {
    if (window.confirm('Seed the database with local review data?')) {
      try {
        setLoading(true);
        // Using name as basic ID for seed, or random
        for (let i = 0; i < localReviews.length; i++) {
          const rev = localReviews[i];
          const seedId = `rev_${Date.now()}_${i}`;
          await setDoc(doc(db, 'reviews', seedId), { id: seedId, ...rev });
        }
        await fetchReviews();
      } catch (err) {
        console.error(err);
        alert('Error seeding data');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (currentReview.id && currentReview._isNew !== true) {
        const revRef = doc(db, 'reviews', String(currentReview.id));
        await updateDoc(revRef, currentReview);
      } else {
        const newRev = { ...currentReview };
        delete newRev._isNew;
        if (!newRev.id) newRev.id = `rev_${Date.now()}`;
        await setDoc(doc(db, 'reviews', String(newRev.id)), newRev);
      }
      setIsEditing(false);
      fetchReviews();
    } catch (err) {
      console.error("Error saving document: ", err);
      alert('Failed to save review');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteDoc(doc(db, 'reviews', String(id)));
        fetchReviews();
      } catch (err) {
        console.error("Error deleting document: ", err);
      }
    }
  };

  const startNewReview = () => {
    setCurrentReview({
      id: `rev_${Date.now()}`,
      _isNew: true,
      name: '',
      title: '',
      quote: '',
      platform: 'Upwork',
      location: '',
      rating: 5
    });
    setIsEditing(true);
  };

  if (loading) {
    return <div className="text-text-muted font-mono uppercase tracking-widest animate-pulse">Loading reviews...</div>;
  }

  if (isEditing) {
    return (
      <div className="bg-bg-card border border-border-subtle rounded-lg p-8">
        <div className="flex items-center justify-between mb-8 border-b border-border-subtle pb-4">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            {currentReview._isNew ? 'Add New Review' : 'Edit Review'}
          </h2>
          <button onClick={() => setIsEditing(false)} className="text-text-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Client Name</label>
              <input 
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentReview.name}
                onChange={(e) => setCurrentReview({...currentReview, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Title / Company</label>
              <input 
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentReview.title}
                onChange={(e) => setCurrentReview({...currentReview, title: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Quote</label>
              <textarea 
                required
                rows="4"
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentReview.quote}
                onChange={(e) => setCurrentReview({...currentReview, quote: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Platform</label>
              <input 
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                placeholder="e.g. Upwork, Fiverr, Direct"
                value={currentReview.platform}
                onChange={(e) => setCurrentReview({...currentReview, platform: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Location</label>
              <input 
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                placeholder="e.g. Los Angeles, USA"
                value={currentReview.location}
                onChange={(e) => setCurrentReview({...currentReview, location: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-text-muted uppercase tracking-widest mb-2">Rating (1-5)</label>
              <input 
                type="number"
                min="1"
                max="5"
                required
                className="w-full bg-bg-primary border border-border-subtle rounded px-4 py-2 text-text-primary focus:border-accent-red outline-none"
                value={currentReview.rating}
                onChange={(e) => setCurrentReview({...currentReview, rating: parseInt(e.target.value)})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-6 border-t border-border-subtle">
            <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-2 rounded text-text-muted hover:bg-bg-primary transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-accent-red text-white font-semibold rounded hover:bg-red-500 transition-colors">
              <Save size={16} /> Save Review
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold text-text-primary">Reviews</h1>
        <div className="flex gap-4">
          {reviews.length === 0 && (
            <button 
              onClick={handleSeedData}
              className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-subtle text-text-primary rounded hover:border-accent-red transition-colors font-mono text-xs uppercase"
            >
              <RefreshCw size={14} /> Seed Data
            </button>
          )}
          <button 
            onClick={startNewReview}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded hover:bg-accent-red hover:text-white transition-colors"
          >
            <Plus size={16} /> Add Review
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.map((rev) => (
          <motion.div 
            key={rev.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-bg-card border border-border-subtle rounded p-6 flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-text-primary">{rev.name}</h3>
                <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest">{rev.title}</p>
              </div>
              <div className="flex text-accent-red text-xs">
                {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </div>
            <p className="font-editorial italic text-text-muted text-sm flex-1 mb-6 line-clamp-3">
              "{rev.quote}"
            </p>
            <div className="pt-4 border-t border-border-subtle flex justify-between">
              <button 
                onClick={() => {
                  setCurrentReview(rev);
                  setIsEditing(true);
                }}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button 
                onClick={() => handleDelete(rev.id)}
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
