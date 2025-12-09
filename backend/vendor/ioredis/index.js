const { EventEmitter } = require('events');

class Redis extends EventEmitter {
  constructor(url, options = {}) {
    super();
    this.url = url;
    this.options = options;
    setImmediate(() => this.emit('connect'));
  }

  ping() {
    return Promise.resolve('PONG');
  }

  quit() {
    this.emit('end');
    return Promise.resolve();
  }
}

module.exports = Redis;
module.exports.default = Redis;
