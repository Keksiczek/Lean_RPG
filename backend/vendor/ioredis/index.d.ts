import { EventEmitter } from 'events';

export default class Redis extends EventEmitter {
  constructor(url?: string, options?: any);
  ping(): Promise<string>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<'OK' | null>;
  quit(): Promise<void>;
}
