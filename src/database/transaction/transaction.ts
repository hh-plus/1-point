import { TransactionType } from '@/point/point.model';
import { Injectable } from '@nestjs/common';

interface transaction {
  [key: number]: {
    data: {
      id: string;
      transactionType: TransactionType;
      createdAt: Date;
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
  }): void {
    const transactionData = {
      id: Math.random().toString(36).substr(2, 11),
      transactionType,
      createdAt: new Date(),
    };

    if (!this.transaction[userId]) {
      // 사용자의 첫 번째 트랜잭션인 경우, 즉시 시작
      this.transaction[userId] = {
        data: [transactionData],
        isRunning: true,
      };
    } else if (
      this.transaction[userId] &&
      !this.transaction[userId].isRunning
    ) {
      // 현재 실행중인 트랜잭션이 없는 경우, 즉시 시작
      this.transaction[userId].data.push(transactionData);
      this.transaction[userId].isRunning = true;
    } else {
      // 실행중인 트랜잭션이 있는 경우, 대기 큐에 추가 후 pending 호출
      this.transaction[userId].data.push(transactionData);
      this.pending({ userId }).catch(err => {
        throw err;
      });
    }
  }

  async pending({ userId }: { userId: number }): Promise<void> {
    if (!this.transaction[userId] || !this.transaction[userId].isRunning) {
      return;
    }

    const currentData = new Date();
    // 100ms 마다 진행중인 트랜잭션이 끝났는지 확인
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        // 1초가 지나면 에러를 발생시킨다.
        if (new Date().getTime() - currentData.getTime() > 1000) {
          clearInterval(checkInterval);
          throw new Error('Transaction is not committed');
        }

        if (!this.transaction[userId].isRunning) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 100);
    });

    // 다음 트랜잭션 시작
    if (this.transaction[userId].data.length > 0) {
      const nextTransaction = this.transaction[userId].data[0];
      this.start({ userId, transactionType: nextTransaction.transactionType });
    }
  }

  commit({ userId }: { userId: number }): void {
    if (!this.transaction[userId] || !this.transaction[userId].isRunning) {
      throw new Error('Transaction is not started');
    }

    // 현재 진행중인 트랜잭션을 완료하고, 대기 중인 트랜잭션이 있다면 pending 호출로 다음 트랜잭션 시작
    this.transaction[userId].data.shift(); // 현재 트랜잭션 제거
    this.transaction[userId].isRunning = false; // 트랜잭션 상태를 비활성화

    if (this.transaction[userId].data.length > 0) {
      // 대기 중인 트랜잭션이 있다면, 다시 pending을 호출하여 다음 트랜잭션 처리
      this.pending({ userId }).catch(err => {
        throw err;
      });
    }
  }
}
