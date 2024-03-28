import { Mutex } from 'async-mutex';

export class LockMutex {
  public usersMutex: { [key: number]: Mutex };

  constructor() {
    this.usersMutex = {};
  }

  public getMutex(userId: number): Mutex {
    if (!this.usersMutex[userId]) {
      this.usersMutex[userId] = new Mutex();
    }
    return this.usersMutex[userId];
  }

  public async lock(userId: number): Promise<void> {
    const mutex = this.getMutex(userId);
    await mutex.acquire();
  }

  public unlock(userId: number): void {
    const mutex = this.getMutex(userId);

    if (!mutex.isLocked()) {
      throw new Error('mutex is not locked');
    }

    mutex.release();
  }
}
