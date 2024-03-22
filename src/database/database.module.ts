import { Module } from '@nestjs/common';
import { PointHistoryTable } from './pointhistory.table';
import { UserPointTable } from './userpoint.table';
import { Transaction } from './transaction/transaction';

@Module({
  providers: [UserPointTable, PointHistoryTable],
  exports: [UserPointTable, PointHistoryTable],
})
export class DatabaseModule {}
