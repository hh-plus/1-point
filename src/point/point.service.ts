import { Injectable } from '@nestjs/common';
import { PointHistoryTable } from '@/database/pointhistory.table';
import { UserPointTable } from '@/database/userpoint.table';

@Injectable()
export class PointService {
  constructor(
    private readonly userDb: UserPointTable,
    private readonly historyDb: PointHistoryTable,
  ) {}
  async getPointByUserId(userId: number) {
    // 이번 예제에서는 유저가 반드시 존재한다고 가정해보자(단, userId가 0이면 없는 것으로 간주한다.)
    const user = userId <= 0 ? null : { id: userId };
    if (!user) {
      throw new Error('user not found');
    }

    const point = await this.historyDb.selectAllByUserId(userId);

    return point;
  }
}
