import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query 
} from "firebase/firestore";
import { 
  getAuth, signInAnonymously, onAuthStateChanged, User 
} from "firebase/auth";
import type { Notebook, NotePage } from "../types/music";

const firebaseConfig = {
  apiKey: "AIzaSyBoLYYDQGit2tCLPgACSwJbGWRJ_0D-c90",
  authDomain: "notas-4d231.firebaseapp.com",
  projectId: "notas-4d231",
  storageBucket: "notas-4d231.firebasestorage.app",
  messagingSenderId: "996705908039",
  appId: "1:996705908039:web:60506e476a03360f0d4862"
};

// Inicialización de Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Autenticación automática o anónima para sincronización sin fricción
export function initAuth(onUserChanged: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth).catch(err => {
        console.warn("Autenticación anónima opcional:", err);
      });
    }
    onUserChanged(user);
  });
}

// Sincronización en tiempo real de Cuadernos en Firestore
export function syncCloudNotebooks(userId: string, onUpdate: (notebooks: Notebook[]) => void): () => void {
  const notebooksCol = collection(db, "users", userId, "notebooks");
  const q = query(notebooksCol);
  
  return onSnapshot(q, (snapshot) => {
    const notebooks: Notebook[] = [];
    snapshot.forEach((docSnap) => {
      notebooks.push(docSnap.data() as Notebook);
    });
    onUpdate(notebooks);
  }, (err) => {
    console.warn("Firestore sync notebooks listener:", err);
  });
}

// Sincronización en tiempo real de Páginas de Notas en Firestore
export function syncCloudPages(userId: string, onUpdate: (pages: NotePage[]) => void): () => void {
  const pagesCol = collection(db, "users", userId, "pages");
  const q = query(pagesCol);

  return onSnapshot(q, (snapshot) => {
    const pages: NotePage[] = [];
    snapshot.forEach((docSnap) => {
      pages.push(docSnap.data() as NotePage);
    });
    onUpdate(pages);
  }, (err) => {
    console.warn("Firestore sync pages listener:", err);
  });
}

// Guardar o Actualizar una Página en la Nube
export async function saveCloudPage(userId: string, page: NotePage): Promise<void> {
  try {
    const pageRef = doc(db, "users", userId, "pages", page.id);
    await setDoc(pageRef, page, { merge: true });
  } catch (err) {
    console.warn("Error al guardar página en la nube:", err);
  }
}

// Guardar o Actualizar un Cuaderno en la Nube
export async function saveCloudNotebook(userId: string, notebook: Notebook): Promise<void> {
  try {
    const nbRef = doc(db, "users", userId, "notebooks", notebook.id);
    await setDoc(nbRef, notebook, { merge: true });
  } catch (err) {
    console.warn("Error al guardar cuaderno en la nube:", err);
  }
}

// Eliminar una página en la Nube
export async function deleteCloudPage(userId: string, pageId: string): Promise<void> {
  try {
    const pageRef = doc(db, "users", userId, "pages", pageId);
    await deleteDoc(pageRef);
  } catch (err) {
    console.warn("Error al eliminar página en la nube:", err);
  }
}
