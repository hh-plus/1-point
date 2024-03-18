import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { DatabaseModule } from '@/database/database.module';
import { PointHistoryTable } from '@/database/pointhistory.table';
import { PointHistory, TransactionType } from './point.model';

describe('PointService', () => {
  let service: PointService;
  let pointHistoryTable: PointHistoryTable;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [PointService],
    }).compile();

    pointHistoryTable = module.get<PointHistoryTable>(PointHistoryTable);
    service = module.get<PointService>(PointService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * 1. id에 해당하는 유저가 없으면 에러를 반환한다.
   */
  describe(`getPointByUserId`, () => {
    it(`유저가 없으면 에러를 반환한다.`, async () => {
      const userId = 0;

      await expect(service.getPointByUserId(userId)).rejects.toThrowError();
    });
    it(`유저가 있으면 유저가 가진 포인트를 반환한다.`, async () => {
      const userId = 1;

      await expect(service.getPointByUserId(userId)).resolves.toEqual([]);
    });
    it(`유저가 있고 포인트 사용 내역이 있으면 알맞은 타입의 값을 반환한다.`, async () => {
      const userId = 1;
      const mockPointHistory = [
        {
          id: 1,
          userId: 1,
          amount: 100,
          type: TransactionType.CHARGE,
          timeMillis: Date.now(),
        },
      ];
      const mockSelectAllByUserId = jest.fn(
        (): Promise<PointHistory[]> => Promise.resolve(mockPointHistory),
      );
      pointHistoryTable.selectAllByUserId = mockSelectAllByUserId;

      await expect(service.getPointByUserId(userId)).resolves.toEqual(
        mockPointHistory,
      );
    });
  });
});
