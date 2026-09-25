import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  type Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from 'firebase/auth';
import type { Notebook, NotePage } from '../types/notes';

const firebaseConfig = {
  apiKey: 'AIzaSyBoLYYDQGit2tCLPgACSwJbGWRJ_0D-c90',
  authDomain: 'notas-4d231.firebaseapp.com',
  projectId: 'notas-4d231',
  storageBucket: 'notas-4d231.firebasestorage.app',
  messagingSenderId: '996705908039',
  appId: '1:996705908039:web:60506e476a03360f0d4862',
};

export const app = initializeApp(firebaseConfig);

// Caché persistente: las hojas siguen disponibles sin conexión (wifi del campus…).
// ignoreUndefinedProperties evita que Firestore rechace notas con campos opcionales vacíos.
function createDb(): Firestore {
  try {
    return initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  }
}
export const db = createDb();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export function initAuth(onUserChanged: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, onUserChanged);
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  return (await signInWithEmailAndPassword(auth, email, pass)).user;
}
export async function registerWithEmail(email: string, pass: string): Promise<User> {
  return (await createUserWithEmailAndPassword(auth, email, pass)).user;
}
export async function loginWithGoogle(): Promise<User> {
  return (await signInWithPopup(auth, googleProvider)).user;
}
export async function loginAsGuest(): Promise<User> {
  return (await signInAnonymously(auth)).user;
}
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function syncCloudNotebooks(userId: string, onUpdate: (notebooks: Notebook[]) => void): () => void {
  return onSnapshot(
    query(collection(db, 'users', userId, 'notebooks')),
    (snapshot) => onUpdate(snapshot.docs.map((d) => d.data() as Notebook)),
    (err) => console.warn('Firestore (cuadernos):', err),
  );
}

export function syncCloudPages(userId: string, onUpdate: (pages: NotePage[]) => void): () => void {
  return onSnapshot(
    query(collection(db, 'users', userId, 'pages')),
    (snapshot) => onUpdate(snapshot.docs.map((d) => d.data() as NotePage)),
    (err) => console.warn('Firestore (hojas):', err),
  );
}

export async function saveCloudPage(userId: string, page: NotePage): Promise<void> {
  try {
    // Sin merge: si se borra un bloque debe desaparecer también en la nube.
    await setDoc(doc(db, 'users', userId, 'pages', page.id), page);
  } catch (err) {
    console.warn('Error al guardar la hoja en la nube:', err);
  }
}

export async function saveCloudNotebook(userId: string, notebook: Notebook): Promise<void> {
  try {
    await setDoc(doc(db, 'users', userId, 'notebooks', notebook.id), notebook);
  } catch (err) {
    console.warn('Error al guardar el cuaderno en la nube:', err);
  }
}

export async function deleteCloudPage(userId: string, pageId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'pages', pageId));
  } catch (err) {
    console.warn('Error al eliminar la hoja en la nube:', err);
  }
}

export async function deleteCloudNotebook(userId: string, notebookId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId, 'notebooks', notebookId));
  } catch (err) {
    console.warn('Error al eliminar el cuaderno en la nube:', err);
  }
}
