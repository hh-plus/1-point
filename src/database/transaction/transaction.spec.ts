import { TransactionType } from '@/point/point.model';
import { Transaction } from './transaction';

describe('Transaction', () => {
  let transaction: Transaction;

  beforeEach(() => {
    transaction = new Transaction();
  });

  it('should be defined', () => {
    expect(transaction).toBeDefined();
  });

  it(`트랜잭션이 없으면 값이 생성되어야 한다.`, () => {
    const userId = 1;
    const transactionType = TransactionType.CHARGE;

    transaction.start({ userId, transactionType });

    expect(transaction.transaction[userId]).toEqual({
      data: [
        {
          id: expect.any(String),
          transactionType,
          createdAt: expect.any(Date),
        },
      ],
      isRunning: true,
    });
  });

  it('이미 트랜잭션이 존재하면 this.pending을 호출한다.', () => {
    const userId = 1;
    const transactionType = TransactionType.CHARGE;

    const pendingSpy = jest.spyOn(transaction, 'pending').mockResolvedValue();

    transaction.start({ userId, transactionType });

    const transactionType2 = TransactionType.USE;

    transaction.start({ userId, transactionType: transactionType2 });

    expect(pendingSpy).toHaveBeenCalledWith({ userId });
  });

  describe('start', () => {
    let mockPending = null;

    beforeEach(() => {
      mockPending = jest.spyOn(transaction, 'pending').mockResolvedValue();
    });

    it('메소드가 존재해야함', () => {
      expect(transaction.start).toBeDefined();
    });

    it('트랜잭션을 시작하면 데이터가 추가되어야 함.', () => {
      const userId = 1;
      const transactionType = TransactionType.CHARGE;
      transaction.start({ userId, transactionType });

      expect(transaction.transaction[userId].data.length).toBe(1);
    });

    it('트랜잭션을 시작하면 isRunning이 true여야 함.', () => {
      const userId = 1;
      const transactionType = TransactionType.CHARGE;
      transaction.start({ userId, transactionType });

      expect(transaction.transaction[userId].isRunning).toBe(true);
    });

    it('트랜잭션이 이미 존재하면 데이터가 추가되어야 함.', () => {
      const userId = 1;
      const transactionType = TransactionType.CHARGE;
      transaction.start({ userId, transactionType });

      const transactionType2 = TransactionType.USE;
      transaction.start({ userId, transactionType: transactionType2 });

      expect(transaction.transaction[userId].data.length).toBe(2);
    });
  });

  describe('pending', () => {
    it('메소드가 존재해야함', () => {
      expect(transaction.pending).toBeDefined();
    });

    it('트랜잭션이 없으면 pending을 호출하지 않아야 함.', async () => {
      const userId = 1;
      await transaction.pending({ userId });

      expect(transaction.transaction[userId]).toBeUndefined();
    });

    it(`트랜잭션이 존재하면 100ms마다 isRunning을 확인해야 함.`, async () => {
      const userId = 1;
      const transactionType = TransactionType.CHARGE;
      transaction.start({ userId, transactionType });

      const pendingPromise = transaction.pending({ userId });

      await new Promise(resolve => setTimeout(resolve, 100));

      transaction.commit({ userId });

      await expect(pendingPromise).resolves.toBeUndefined();
    });
  });

  describe('commit', () => {
    it('메소드가 존재해야함', () => {
      expect(transaction.commit).toBeDefined();
    });

    it('트랜잭션이 없으면 에러를 발생시켜야 함.', () => {
      const userId = 1;
      expect(() => transaction.commit({ userId })).toThrow();
    });

    it('트랜잭션이 존재하면 isRunning을 false로 변경해야 함.', () => {
      const userId = 1;
      const transactionType = TransactionType.CHARGE;
      transaction.start({ userId, transactionType });

      transaction.commit({ userId });

      expect(transaction.transaction[userId].isRunning).toBe(false);
    });
  });

  describe('pending 상태의 트랜잭션이 존재하는 경우', () => {
    const userId = 1;
    let spyPending = null;
    beforeEach(() => {
      spyPending = jest.spyOn(transaction, 'pending').mockResolvedValue();
      const transactionType = TransactionType.CHARGE;
      transaction.start({ userId, transactionType });
    });
    it(`commit전에 작업을 시도하면 pending을 호출해야 함.`, () => {
      transaction.start({ userId, transactionType: TransactionType.USE });
      expect(spyPending).toHaveBeenCalledTimes(1);
    });
    it('transaction이 commit되고 작업을 시도하면 pending을 호출하지 않아야 함.', () => {
      transaction.commit({ userId });
      transaction.start({ userId, transactionType: TransactionType.USE });
      expect(spyPending).toHaveBeenCalledTimes(0);
    });
  });
});
