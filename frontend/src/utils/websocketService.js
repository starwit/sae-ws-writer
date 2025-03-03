class WebSocketService {
  constructor(url, onMessageCallback) {
    this.url = url;
    this.onMessageCallback = onMessageCallback;
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
        this.isConnected = false;
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
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
    if (this.socket && this.isConnected) {
      this.socket.close();
    }
  }
}

export default WebSocketService;
