import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
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
  measurementId: "G-HC3WRXRT0P"
};
// Khởi tạo app an toàn để tránh lỗi Firebase App named '[DEFAULT]' already exists
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

/**
 * Lưu tin nhắn vào Sub-collection 'messages' trong 'ChatDocument/{documentId}'
 */
export const saveChatMessage = async (documentId, senderType, content) => {
  if (!documentId || !content) return;

  try {
    const docIdStr = String(documentId);
    const messagesRef = collection(db, 'ChatDocument', docIdStr, 'messages');
    console.log('Tin nhắn gửi lên Firebase:', docIdStr, senderType, content);

    await addDoc(messagesRef, {
      sender: senderType, // 'user_answer' hoặc 'ai_question'
      content: content,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Lỗi khi lưu tin nhắn Firebase:', error);
    throw error;
  }
};

/**
 * Lắng nghe realtime danh sách tin nhắn của document
 */
export const subscribeChatMessages = (documentId, callback) => {
  if (!documentId) return () => {};

  const docIdStr = String(documentId);
  const messagesRef = collection(db, 'ChatDocument', docIdStr, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    },
    (error) => {
      console.error('Lỗi onSnapshot Firebase:', error);
    }
  );

  return unsubscribe;
};