declare module 'ioredis-mock' {
  export default class RedisMock {
    constructor(options?: unknown);
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<'OK' | null>;
    del(...keys: string[]): Promise<number>;
    lpush(key: string, ...values: string[]): Promise<number>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    ltrim(key: string, start: number, stop: number): Promise<'OK'>;
    publish(channel: string, message: string): Promise<number>;
    subscribe(...channels: string[]): Promise<unknown>;
    on(event: string, listener: (...args: any[]) => void): this;
  }
}
