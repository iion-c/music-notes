import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, Eye, Calendar, ExternalLink, Activity, RefreshCw } from 'lucide-react';

export default function AnalyticsManager() {
  const [data, setData] = useState({
    totalViews: 0,
    uniqueVisits: 0,
    dailyViews: {},
    lastVisit: null
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'sections', 'analytics'));
      if (snap.exists()) {
        setData(snap.data());
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayViews = data.dailyViews ? (data.dailyViews[todayStr] || 0) : 0;

  // Convert daily views map to sorted array of last 7 days
  const dailyList = Object.entries(data.dailyViews || {})
    .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
    .slice(0, 10);

  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    if (ts.toDate) return ts.toDate().toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return new Date(ts).toLocaleString();
  };

  if (loading) {
    return <div className="text-text-muted font-mono uppercase tracking-widest animate-pulse">Loading analytics...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-text-primary">Website Analytics</h1>
          <p className="font-ui text-text-muted text-sm mt-1">Real-time visitor counts and performance data</p>
        </div>
        <button 
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-subtle text-text-primary rounded hover:border-accent-red transition-colors font-mono text-xs uppercase"
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-bg-card border border-border-subtle rounded-lg p-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-text-muted mb-1">Total Page Views</p>
            <h3 className="font-display text-3xl font-bold text-text-primary">{data.totalViews || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center text-accent-red">
            <Eye size={22} />
          </div>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-lg p-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-text-muted mb-1">Unique Sessions</p>
            <h3 className="font-display text-3xl font-bold text-text-primary">{data.uniqueVisits || 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center text-accent-red">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-lg p-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-text-muted mb-1">Today's Visitors</p>
            <h3 className="font-display text-3xl font-bold text-accent-red">{todayViews}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center text-accent-red">
            <Calendar size={22} />
          </div>
        </div>
      </div>

      {/* Last visit & Vercel link banner */}
      <div className="bg-bg-card border border-border-subtle rounded-lg p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity size={20} className="text-accent-red shrink-0" />
          <div>
            <p className="font-ui text-sm font-semibold text-text-primary">Last Recorded Activity</p>
            <p className="font-mono text-xs text-text-muted">{formatTimestamp(data.lastVisit)}</p>
          </div>
        </div>
        <a 
          href="https://vercel.com/dashboard" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-red text-white font-ui font-semibold text-sm rounded hover:bg-red-500 transition-colors"
        >
          <ExternalLink size={16} /> Open Vercel Analytics Dashboard
        </a>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-bg-card border border-border-subtle rounded-lg p-6">
        <h2 className="font-display text-xl font-bold text-text-primary mb-4">Recent Daily Views</h2>
        {dailyList.length === 0 ? (
          <p className="font-mono text-xs text-text-muted">No daily data recorded yet. Views will populate as users visit the site.</p>
        ) : (
          <div className="divide-y divide-border-subtle">
            {dailyList.map(([date, count]) => (
              <div key={date} className="py-3 flex items-center justify-between">
                <span className="font-mono text-sm text-text-primary">{date}</span>
                <span className="font-mono text-sm font-bold text-accent-red">{count} {count === 1 ? 'view' : 'views'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
