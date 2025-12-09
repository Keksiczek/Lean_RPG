import EventEmitter from "events";

class RedisClient extends EventEmitter {
  constructor(public url: string) {
    super();
  }

  async ping() {
    return "PONG";
  }
}

const redis = new RedisClient("memory://redis-mock");

export default redis;
