import { TransactionType } from '@/point/point.model';
import { Injectable } from '@nestjs/common';

interface transaction {
  [key: number]: {
    data: {
      id: string;
      transactionType: TransactionType;
    }[];
    isRunning: boolean;
  };
}

@Injectable()
export class Transaction {
  transaction: transaction;
  constructor() {
    this.transaction = {};
  }

  start({
    userId,
    transactionType,
  }: {
    userId: number;
    transactionType: TransactionType;
  }) {
    if (!this.transaction[userId]) {
      this.transaction[userId] = {
        data: [
          {
            // 랜덤문자열
            id: Math.random().toString(36).substr(2, 11),
            transactionType,
          },
        ],
        isRunning: true,
      };
    }

    if (this.transaction[userId] && this.transaction[userId].isRunning) {
      this.transaction[userId];
    }
  }

  commit({ userId }: { userId: number }) {}
}
