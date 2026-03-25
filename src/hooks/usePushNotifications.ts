import { useEffect } from 'react';
import { getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Solicita permissão de notificação, obtém o token FCM e salva em users/{uid}.
 * Também lida com mensagens em foreground mostrando uma notificação nativa.
 */
export function usePushNotifications(uid: string) {
  useEffect(() => {
    if (!uid) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied') return;

    let unsubOnMessage: (() => void) | undefined;

    const setup = async () => {
      const supported = await isSupported();
      if (!supported) return;

      const messaging = getMessaging(getApp());

      const permission =
        Notification.permission === 'granted'
          ? 'granted'
          : await Notification.requestPermission();

      if (permission !== 'granted') return;

      // Reutiliza o sw.js já registrado (evita conflito com segundo SW)
      const swReg = await navigator.serviceWorker.ready;

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (token) {
        await updateDoc(doc(db, 'users', uid), { fcmToken: token }).catch(() => {});
      }

      // Mensagens em foreground (app aberto): notificação nativa simples
      unsubOnMessage = onMessage(messaging, (payload) => {
        const { title, body } = payload.notification ?? {};
        if (title && Notification.permission === 'granted') {
          new Notification(title, { body: body ?? '', icon: '/icon-192.png' });
        }
      });
    };

    setup().catch(console.error);

    return () => { unsubOnMessage?.(); };
  }, [uid]);
}
