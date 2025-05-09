// Mock implementation of WebSocket
const EventEmitter = require('events');

class WebSocket extends EventEmitter {
  constructor() {
    super();
    this.readyState = 0; // CONNECTING
    this.binaryType = 'nodebuffer';
  }

  send() {
    return true;
  }

  close() {
    this.readyState = 3; // CLOSED
    this.emit('close');
  }

  terminate() {
    this.readyState = 3; // CLOSED
    this.emit('close');
  }
}

WebSocket.CONNECTING = 0;
WebSocket.OPEN = 1;
WebSocket.CLOSING = 2;
WebSocket.CLOSED = 3;

module.exports = WebSocket; 