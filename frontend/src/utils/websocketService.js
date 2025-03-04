class WebSocketService {
  constructor(url, onMessageCallback, onConnectionStatusChange) {
    this.url = url;
    this.onMessageCallback = onMessageCallback;
    this.onConnectionStatusChange = onConnectionStatusChange || (() => {}); // Optional callback for status changes
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = 2000;
  }

  connect() {
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectionStatusChange(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessageCallback(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        const wasConnected = this.isConnected;
        this.isConnected = false;
        if (wasConnected) {
          this.onConnectionStatusChange(false);
        }
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        const wasConnected = this.isConnected;
        this.isConnected = false;
        if (wasConnected) {
          this.onConnectionStatusChange(false);
        }
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.isConnected = false;
      this.onConnectionStatusChange(false);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts += 1;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectTimeout);
    } else {
      console.error('Maximum reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.isConnected = false;
      this.onConnectionStatusChange(false);
    }
  }

  // Method to check connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

export default WebSocketService;
