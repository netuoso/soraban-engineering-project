// src/services/actioncable.js
import { createConsumer } from '@rails/actioncable';

// Get the WebSocket URL from environment or use default
const getWebSocketURL = () => {
  // Use the same host as the current API calls
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = 'localhost:3000'; // Match the API service
  
  // Add token for authentication
  const token = localStorage.getItem('token');
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  
  const wsUrl = `${protocol}//${host}/cable${tokenParam}`;
  console.log('WebSocket URL:', wsUrl);
  return wsUrl;
};

class ActionCableService {
  constructor() {
    this.consumer = null;
    this.subscriptions = new Map();
  }

  connect() {
    if (!this.consumer) {
      console.log('Creating ActionCable consumer...');
      this.consumer = createConsumer(getWebSocketURL());
      
      // ActionCable doesn't expose addEventListener on connection.monitor
      // Connection status will be handled in individual subscriptions
    }
    return this.consumer;
  }

  disconnect() {
    if (this.consumer) {
      console.log('Disconnecting ActionCable consumer...');
      this.consumer.disconnect();
      this.consumer = null;
      this.subscriptions.clear();
    }
  }

  subscribe(channelName, params, callbacks) {
    this.connect();
    
    const subscriptionKey = `${channelName}-${JSON.stringify(params)}`;
    console.log('Subscribing to channel:', channelName, 'with params:', params);
    
    // If already subscribed, return existing subscription
    if (this.subscriptions.has(subscriptionKey)) {
      console.log('Already subscribed to', subscriptionKey);
      return this.subscriptions.get(subscriptionKey);
    }

    const subscription = this.consumer.subscriptions.create(
      { channel: channelName, ...params },
      {
        connected() {
          console.log(`✅ Connected to ${channelName} with params:`, params);
          if (callbacks.connected) callbacks.connected();
        },

        disconnected() {
          console.log(`❌ Disconnected from ${channelName}`);
          if (callbacks.disconnected) callbacks.disconnected();
        },

        received(data) {
          console.log(`📨 Received data from ${channelName}:`, data);
          if (callbacks.received) callbacks.received(data);
        },

        rejected() {
          console.log(`🚫 Rejected connection to ${channelName}. Check authentication and channel permissions.`);
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
      console.log('Unsubscribing from', subscriptionKey);
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Specific method for import progress channel
  subscribeToImportProgress(sessionId, callbacks) {
    console.log('Subscribing to import progress for session:', sessionId);
    return this.subscribe('ImportProgressChannel', { session_id: sessionId }, callbacks);
  }

  unsubscribeFromImportProgress(sessionId) {
    console.log('Unsubscribing from import progress for session:', sessionId);
    this.unsubscribe('ImportProgressChannel', { session_id: sessionId });
  }
}

// Export singleton instance
export default new ActionCableService();
