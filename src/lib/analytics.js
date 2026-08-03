import { doc, getDoc, setDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function trackPageView() {
  try {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const isNewSession = !sessionStorage.getItem('matthew_session_visited');
    sessionStorage.setItem('matthew_session_visited', 'true');

    const analyticsRef = doc(db, 'sections', 'analytics');
    const snap = await getDoc(analyticsRef);

    const updateData = {
      totalViews: increment(1),
      lastVisit: serverTimestamp(),
      [`dailyViews.${todayStr}`]: increment(1)
    };

    if (isNewSession) {
      updateData.uniqueVisits = increment(1);
    }

    if (!snap.exists()) {
      await setDoc(analyticsRef, {
        totalViews: 1,
        uniqueVisits: 1,
        lastVisit: serverTimestamp(),
        dailyViews: {
          [todayStr]: 1
        }
      });
    } else {
      await setDoc(analyticsRef, updateData, { merge: true });
    }
  } catch (err) {
    console.error('Analytics tracking error:', err);
  }
}
