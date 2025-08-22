// src/services/actioncable.js
import { createConsumer } from '@rails/actioncable';

// Get the WebSocket URL from environment or use default
const getWebSocketURL = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = process.env.REACT_APP_API_URL || 'localhost:3000';
  // Remove http/https prefix if present
  const cleanHost = host.replace(/^https?:\/\//, '');
  
  // Add token for authentication
  const token = localStorage.getItem('token');
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  
  return `${protocol}//${cleanHost}/cable${tokenParam}`;
};

class ActionCableService {
  constructor() {
    this.consumer = null;
    this.subscriptions = new Map();
  }

  connect() {
    if (!this.consumer) {
      this.consumer = createConsumer(getWebSocketURL());
    }
    return this.consumer;
  }

  disconnect() {
    if (this.consumer) {
      this.consumer.disconnect();
      this.consumer = null;
      this.subscriptions.clear();
    }
  }

  subscribe(channelName, params, callbacks) {
    this.connect();
    
    const subscriptionKey = `${channelName}-${JSON.stringify(params)}`;
    
    // If already subscribed, return existing subscription
    if (this.subscriptions.has(subscriptionKey)) {
      return this.subscriptions.get(subscriptionKey);
    }

    const subscription = this.consumer.subscriptions.create(
      { channel: channelName, ...params },
      {
        connected() {
          console.log(`Connected to ${channelName}`);
          if (callbacks.connected) callbacks.connected();
        },

        disconnected() {
          console.log(`Disconnected from ${channelName}`);
          if (callbacks.disconnected) callbacks.disconnected();
        },

        received(data) {
          console.log(`Received data from ${channelName}:`, data);
          if (callbacks.received) callbacks.received(data);
        },

        rejected() {
          console.log(`Rejected connection to ${channelName}`);
          if (callbacks.rejected) callbacks.rejected();
        }
      }
    );

    this.subscriptions.set(subscriptionKey, subscription);
    return subscription;
  }

  unsubscribe(channelName, params) {
    const subscriptionKey = `${channelName}-${JSON.stringify(params)}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Specific method for import progress channel
  subscribeToImportProgress(sessionId, callbacks) {
    return this.subscribe('ImportProgressChannel', { session_id: sessionId }, callbacks);
  }

  unsubscribeFromImportProgress(sessionId) {
    this.unsubscribe('ImportProgressChannel', { session_id: sessionId });
  }
}

// Export singleton instance
export default new ActionCableService();
