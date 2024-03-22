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
        },
      ],
      isRunning: true,
    });
  });
});
