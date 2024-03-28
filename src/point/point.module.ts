import { Module } from '@nestjs/common';
import { PointController } from './point.controller';
import { DatabaseModule } from 'src/database/database.module';
import { PointService } from './point.service';
import { LockMutex } from '@/database/lock/lock';

@Module({
  imports: [DatabaseModule],
  controllers: [PointController],
  providers: [PointService, LockMutex],
})
export class PointModule {}
