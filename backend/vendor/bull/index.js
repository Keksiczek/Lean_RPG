const { EventEmitter } = require('events');

let globalJobId = 1;

class Job {
  constructor(data, opts = {}, queue) {
    this.id = globalJobId++;
    this.data = data;
    this.opts = {
      attempts: 1,
      backoff: undefined,
      removeOnComplete: false,
      removeOnFail: false,
      timeout: undefined,
      ...opts,
    };
    this.queue = queue;
    this.attemptsMade = 0;
    this._progress = 0;
    this.returnvalue = undefined;
    this.failedReason = undefined;
    this.state = 'waiting';
    this.timestamp = Date.now();
  }

  progress(value) {
    if (typeof value === 'number') {
      this._progress = value;
      this.queue.emit('progress', this, value);
    }
    return Promise.resolve(this._progress);
  }

  getState() {
    return Promise.resolve(this.state);
  }
}

class Queue extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.options = options;
    this.jobs = new Map();
    this.waiting = [];
    this.active = new Set();
    this.completed = new Set();
    this.failed = new Set();
    this.processor = null;
  }

  async add(data, opts = {}) {
    const job = new Job(data, opts, this);
    this.jobs.set(job.id, job);
    this.waiting.push(job);
    this._schedule();
    return job;
  }

  async process(concurrencyOrHandler, maybeHandler) {
    const handler = typeof concurrencyOrHandler === 'function' ? concurrencyOrHandler : maybeHandler;
    this.processor = handler;
    this._schedule();
  }

  _schedule() {
    if (!this.processor) return;
    if (this._processing) return;
    this._processing = true;
    setImmediate(() => this._work());
  }

  async _work() {
    while (this.waiting.length > 0 && this.processor) {
      const job = this.waiting.shift();
      if (!job) break;
      job.state = 'active';
      this.active.add(job);
      this.emit('active', job);

      try {
        const res = await this.processor(job);
        job.returnvalue = res;
        job.state = 'completed';
        this.completed.add(job);
        this.active.delete(job);
        this.emit('completed', job, res);
      } catch (err) {
        job.attemptsMade += 1;
        this.active.delete(job);
        const attempts = job.opts.attempts || 1;
        if (job.attemptsMade < attempts) {
          const delay = this._getBackoff(job);
          setTimeout(() => {
            job.state = 'waiting';
            this.waiting.push(job);
            this._schedule();
          }, delay);
        } else {
          job.state = 'failed';
          job.failedReason = err instanceof Error ? err.message : String(err);
          this.failed.add(job);
          this.emit('failed', job, err);
        }
      }
    }
    this._processing = false;
  }

  _getBackoff(job) {
    const backoff = job.opts.backoff;
    if (!backoff) return 0;
    if (typeof backoff === 'number') return backoff;
    if (typeof backoff === 'object' && backoff.type === 'exponential') {
      const base = backoff.delay || 0;
      return base * Math.pow(2, Math.max(0, job.attemptsMade - 1));
    }
    return 0;
  }

  async getJob(id) {
    return this.jobs.get(Number(id)) || null;
  }

  async getJobCounts() {
    return {
      waiting: this.waiting.length,
      active: this.active.size,
      completed: this.completed.size,
      failed: this.failed.size,
      delayed: 0,
      paused: 0,
    };
  }

  async getWaitingCount() {
    return this.waiting.length;
  }

  async getActiveCount() {
    return this.active.size;
  }

  async getCompletedCount() {
    return this.completed.size;
  }

  async getFailedCount() {
    return this.failed.size;
  }

  async getJobs(states = ['waiting'], start = 0, end = -1) {
    const list = [];
    const range = (arr) => (end === -1 ? arr.slice(start) : arr.slice(start, end + 1));

    if (states.includes('waiting')) list.push(...range(this.waiting));
    if (states.includes('active')) list.push(...range(Array.from(this.active)));
    if (states.includes('completed')) list.push(...range(Array.from(this.completed)));
    if (states.includes('failed')) list.push(...range(Array.from(this.failed)));

    return list;
  }

  async close() {
    this.processor = null;
    this.waiting = [];
    this.active.clear();
  }

  async drain() {
    this.waiting = [];
  }
}

Queue.Job = Job;
Queue.default = Queue;

module.exports = Queue;
