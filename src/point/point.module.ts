import { Module } from '@nestjs/common';
import { PointController } from './point.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PointService } from './point.service';
import { Transaction } from '@/database/transaction/transaction';

@Module({
  imports: [DatabaseModule],
  controllers: [PointController],
  providers: [PointService, Transaction],
})
export class PointModule {}
