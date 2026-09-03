import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  writeBatch,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB_MGClYnzuyjFggCtyN2aINsOA4XyB-aw",
  authDomain: "document-b67d4.firebaseapp.com",
  projectId: "document-b67d4",
  storageBucket: "document-b67d4.firebasestorage.app",
  messagingSenderId: "771853163147",
  appId: "1:771853163147:web:a840929fc7b0531250528e",
  measurementId: "G-HC3WRXRT0P",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// 1. Lưu tin nhắn
// Cập nhật hàm save trong FireBaseServices.js theo đúng schema trên ảnh
export const saveChatMessage = async (sessionId, senderType, content, missingFields=[]) => {
  if (!sessionId || !content) return;
  try {
    const sessionKey = String(sessionId);
    const messagesRef = collection(db, 'ChatDocument', sessionKey, 'messages');

    await addDoc(messagesRef, {
      sessionId: sessionKey,
      user_sender: senderType, 
      message: content,        
      missingFields: missingFields,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Lỗi khi lưu tin nhắn Firebase:', error);
    throw error;
  }
};

export const subscribeChatMessages = (sessionId, callback) => {
  if (!sessionId) return () => {};

  const sessionKey = String(sessionId);
  const messagesRef = collection(db, 'ChatDocument', sessionKey, 'messages');

  const unsubscribe = onSnapshot(
    messagesRef,
    (snapshot) => {
      const messages = snapshot.docs.map((docItem) => {
        const data = docItem.data();
        return {
          id: docItem.id,
          sessionId: sessionKey,
          sender: data.user_sender || data.sender,
          content: data.message || data.content,
          missingFields: data.missingFields,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        };
      });

      // Sắp xếp tin nhắn theo thời gian tăng dần
      messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      callback(messages);
    },
    (error) => {
      console.error('Lỗi khi tải tin nhắn theo sessionId:', error);
    }
  );

  return unsubscribe;
};

export const migrateSessionMessages = async (oldSessionId, newDocumentId) => {
  if (!oldSessionId || !newDocumentId || oldSessionId === newDocumentId) return;

  try {
    const oldRef = collection(db, 'ChatDocument', String(oldSessionId), 'messages');
    const snapshot = await getDocs(oldRef);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const newDocRef = doc(collection(db, 'ChatDocument', String(newDocumentId), 'messages'));

      batch.set(newDocRef, {
        ...data,
        sessionId: String(newDocumentId),
      });
      batch.delete(docSnap.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Lỗi migrate tin nhắn Firebase:', error);
  }
};