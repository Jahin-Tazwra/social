// Mock implementation of Node's net module
const EventEmitter = require('events');

class Socket extends EventEmitter {
  constructor() {
    super();
    this.connecting = false;
    this.destroyed = false;
  }

  connect() {
    this.connecting = true;
    this.emit('connect');
    return this;
  }

  write() {
    return true;
  }

  end() {
    this.destroyed = true;
    this.emit('close');
  }

  destroy() {
    this.destroyed = true;
    this.emit('close');
  }
}

module.exports = {
  Socket,
  createConnection: () => new Socket(),
  createServer: () => ({
    listen: () => {},
    close: () => {},
  }),
}; 