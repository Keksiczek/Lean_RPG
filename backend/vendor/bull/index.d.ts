import { EventEmitter } from 'events';

export interface JobOptions {
  attempts?: number;
  backoff?: number | { type: 'exponential'; delay: number };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  timeout?: number;
  priority?: number;
}

export interface JobCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface Job<T> {
  id: number;
  data: T;
  opts: JobOptions;
  attemptsMade: number;
  progress(value?: number): Promise<number>;
  getState(): Promise<string>;
  returnvalue?: any;
  failedReason?: string;
  timestamp: number;
}

export default class Queue<T = any, R = any> extends EventEmitter {
  constructor(name: string, options?: any);
  add(data: T, opts?: Partial<JobOptions>): Promise<Job<T>>;
  process(handler: (job: Job<T>) => Promise<R>): Promise<void>;
  process(concurrency: number, handler: (job: Job<T>) => Promise<R>): Promise<void>;
  on(event: 'active', listener: (job: Job<T>) => void): this;
  on(event: 'completed', listener: (job: Job<T>, result: R) => void): this;
  on(event: 'failed', listener: (job: Job<T>, err: Error) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;
  getJob(id: number | string): Promise<Job<T> | null>;
  getJobCounts(): Promise<JobCounts>;
  getWaitingCount(): Promise<number>;
  getActiveCount(): Promise<number>;
  getCompletedCount(): Promise<number>;
  getFailedCount(): Promise<number>;
  getJobs(states?: string[], start?: number, end?: number, asc?: boolean): Promise<Job<T>[]>;
  close(): Promise<void>;
  drain(): Promise<void>;
}

export namespace Queue {
  export { Job };
}

export { Job, JobOptions, JobCounts };
