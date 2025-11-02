// Push Notification Service for Cypher Chat
import { useState, useEffect } from 'react';

export interface PushNotificationService {
  isSupported: boolean;
  permission: NotificationPermission;
  subscribe: () => Promise<PushSubscription | null>;
  unsubscribe: () => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => Promise<void>;
}

class PushNotificationManager implements PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializeServiceWorker();
  }

  get isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  get permission(): NotificationPermission {
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }

  private async initializeServiceWorker(): Promise<void> {
    if (!this.isSupported) return;

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.isSupported || !this.swRegistration) return null;

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push notifications
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '') as BufferSource
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.isSupported || !this.swRegistration) return false;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async sendNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.isSupported || this.permission !== 'granted') return;

    try {
      await this.swRegistration?.showNotification(title, {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        tag: 'cypher-chat-message',
        ...options
      } as NotificationOptions);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }
}

// Export singleton instance
export const pushNotifications = new PushNotificationManager();

// Helper hook for React components
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setPermission(pushNotifications.permission);
    setIsSupported(pushNotifications.isSupported);
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  const subscribeToNotifications = async () => {
    return await pushNotifications.subscribe();
  };

  const unsubscribeFromNotifications = async () => {
    return await pushNotifications.unsubscribe();
  };

  const sendTestNotification = async () => {
    await pushNotifications.sendNotification('Cypher Chat', {
      body: 'Test notification from Cypher Chat!',
      tag: 'test-notification'
    });
  };

  return {
    permission,
    isSupported,
    requestPermission,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    sendTestNotification
  };
}