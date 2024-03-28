import { TransactionType } from '@/point/point.model';
import { LockMutex } from './lock';

describe('LockMutex', () => {
  let lockMutex: LockMutex;

  beforeEach(() => {
    lockMutex = new LockMutex();
  });

  it('should be defined', () => {
    expect(lockMutex).toBeDefined();
  });

  describe('getMutex', () => {
    it('should return mutex', () => {
      const userId = 1;
      const mutex = lockMutex.getMutex(userId);

      expect(mutex).toBeDefined();
    });

    it('should return same mutex for same userId', () => {
      const userId = 1;
      const mutex1 = lockMutex.getMutex(userId);
      const mutex2 = lockMutex.getMutex(userId);

      expect(mutex1).toBe(mutex2);
    });
  });

  describe('lock', () => {
    it('should lock mutex', async () => {
      const userId = 1;
      await lockMutex.lock(userId);

      const mutex = lockMutex.getMutex(userId);
      expect(mutex.isLocked()).toBe(true);
    });
  });

  describe('unlock', () => {
    it('should unlock mutex', async () => {
      const userId = 1;
      await lockMutex.lock(userId);
      lockMutex.unlock(userId);

      const mutex = lockMutex.getMutex(userId);
      expect(mutex.isLocked()).toBe(false);
    });

    it('should throw error if mutex is not locked', () => {
      const userId = 1;

      expect(() => lockMutex.unlock(userId)).toThrowError(
        'mutex is not locked',
      );
    });
  });
});
