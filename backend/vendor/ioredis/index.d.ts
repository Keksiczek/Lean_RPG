import { EventEmitter } from 'events';

export default class Redis extends EventEmitter {
  constructor(url?: string, options?: any);
  ping(): Promise<string>;
  quit(): Promise<void>;
}
