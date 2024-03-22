import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ValidationPipe,
} from '@nestjs/common';
import { PointHistory, TransactionType, UserPoint } from './point.model';

import { PointBody as PointDto } from './point.dto';
import { PointService } from './point.service';
import { Transaction } from '@/database/transaction/transaction';

@Controller('/point')
export class PointController {
  constructor(
    private readonly pointService: PointService,
    private readonly transaction: Transaction,
  ) {}

  /**
   * TODO - 특정 유저의 포인트를 조회하는 기능을 작성해주세요.
   */
  @Get(':id')
  async point(@Param('id') id): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    const userPoint: UserPoint =
      await this.pointService.getPointByUserId(userId);
    // return { id: userId, point: 0, updateMillis: Date.now() };
    return userPoint;
  }

  /**
   * TODO - 특정 유저의 포인트 충전/이용 내역을 조회하는 기능을 작성해주세요.
   */
  @Get(':id/histories')
  async history(@Param('id') id): Promise<PointHistory[]> {
    const userId = Number.parseInt(id);
    const histories: PointHistory[] =
      await this.pointService.getPointHistoriesByUserId(userId);
    return histories;
  }

  /**
   * TODO - 특정 유저의 포인트를 충전하는 기능을 작성해주세요.
   */
  @Patch(':id/charge')
  async charge(
    @Param('id') id,
    @Body(ValidationPipe) pointDto: PointDto,
  ): Promise<UserPoint> {
    const userId = Number.parseInt(id);
    const amount = pointDto.amount;
    this.transaction.start({ userId, transactionType: TransactionType.CHARGE });
    const userPoint: UserPoint = await this.pointService.charge(userId, amount);
    this.transaction.commit({ userId });
    // return { id: userId, point: amount, updateMillis: Date.now() };
    return userPoint;
  }

  /**
   * TODO - 특정 유저의 포인트를 사용하는 기능을 작성해주세요.
   */
  @Patch(':id/use')
  async use(
    @Param('id') id,
    @Body(ValidationPipe) pointDto: PointDto,
  ): Promise<UserPoint> {
    try {
      const userId = Number.parseInt(id);
      const amount = pointDto.amount;
      this.transaction.start({
        userId,
        transactionType: TransactionType.USE,
      });
      const userPoint: UserPoint = await this.pointService.use(userId, amount);
      this.transaction.commit({ userId });
      return userPoint;
    } catch (e) {
      console.log(e);
      throw e;
    }
    // return { id: userId, point: amount, updateMillis: Date.now() };
  }
}
