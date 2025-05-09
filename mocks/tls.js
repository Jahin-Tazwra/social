// Mock implementation of Node's tls module
const EventEmitter = require('events');

class TLSSocket extends EventEmitter {
  constructor() {
    super();
    this.authorized = true;
    this.authorizationError = null;
    this.encrypted = true;
  }

  getPeerCertificate() {
    return {
      subject: {},
      issuer: {},
      valid_from: '',
      valid_to: '',
      fingerprint: '',
    };
  }

  getCipher() {
    return {
      name: 'TLS_AES_128_GCM_SHA256',
      version: 'TLSv1.3',
    };
  }
}

module.exports = {
  TLSSocket,
  connect: () => new TLSSocket(),
  createServer: () => ({
    listen: () => {},
    close: () => {},
  }),
}; 