import { Injectable } from '@nestjs/common';
import { PointHistoryTable } from '@/database/pointhistory.table';
import { UserPointTable } from '@/database/userpoint.table';
import { PointHistory, TransactionType, UserPoint } from './point.model';

class User {
  id: number;

  static find(id: number): User {
    if (id <= 0) throw new Error('user not found');
    return new User();
  }
}

@Injectable()
export class PointService {
  constructor(
    private readonly userDb: UserPointTable,
    private readonly historyDb: PointHistoryTable,
  ) {}

  async getPointByUserId(userId: number) {
    User.find(userId);
    const userPoint = await this.userDb.selectById(userId);

    if (!userPoint) {
      throw new Error('user point not found');
    }
    return userPoint;
  }

  async getPointHistoriesByUserId(userId: number): Promise<PointHistory[]> {
    // 이번 예제에서는 유저가 반드시 존재한다고 가정해보자(단, userId가 0이면 없는 것으로 간주한다.)
    User.find(userId);
    const point = await this.historyDb.selectAllByUserId(userId);
    if (!point) {
      throw new Error('user point history not found');
    }
    return point;
  }

  async charge(userId: number, amount: number): Promise<UserPoint> {
    User.find(userId);
    if (amount <= 0) {
      throw new Error('amount must be positive');
    }
    const updatedPoint = await this.userDb.insertOrUpdate(userId, amount);
    await this.historyDb.insert(
      userId,
      amount,
      TransactionType.CHARGE,
      Date.now(),
    );
    return updatedPoint;
  }

  async use(userId: number, amount: number): Promise<UserPoint> {
    User.find(userId);

    if (amount <= 0) {
      throw new Error('amount must be positive');
    }

    const userPoint = await this.userDb.selectById(userId);
    if (!userPoint) {
      throw new Error('user point not found');
    }

    if (userPoint.point < amount) {
      throw new Error('not enough point');
    }

    return;
  }
}
