import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { DatabaseModule } from '@/database/database.module';
import { PointHistoryTable } from '@/database/pointhistory.table';
import { PointHistory, TransactionType, UserPoint } from './point.model';
import { UserPointTable } from '@/database/userpoint.table';

describe('PointService', () => {
  let service: PointService;
  let historyDb: PointHistoryTable;
  let userDb: UserPointTable;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [PointService],
    }).compile();

    historyDb = module.get<PointHistoryTable>(PointHistoryTable);
    userDb = module.get<UserPointTable>(UserPointTable);
    service = module.get<PointService>(PointService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * 1. id에 해당하는 유저가 없으면 에러를 반환한다.
   * 2. id에 해당하는 유저가 있으면 유저가 가진 포인트를 반환한다.
   * 3. 유저 포인트 정보가 없으면 에러를 반환한다.
   */
  describe('getPointByUserId', () => {
    it('유저가 없으면 에러를 반환한다.', async () => {
      const userId = 0;

      await expect(service.getPointByUserId(userId)).rejects.toThrow();
    });

    it('유저가 있으면 유저가 가진 포인트를 반환한다.', async () => {
      const userId = 1;

      await expect(service.getPointByUserId(userId)).resolves.toEqual({
        id: userId,
        point: 0,
        updateMillis: expect.any(Number),
      });
    });

    it('유저 포인트 정보가 없으면 에러를 반환한다.', async () => {
      const userId = 1;
      const mockSelectById = jest.fn(
        (): Promise<UserPoint> => Promise.resolve(null),
      );
      userDb.selectById = mockSelectById;

      await expect(service.getPointByUserId(userId)).rejects.toThrow();
    });
  });

  /**
   * 1. id에 해당하는 유저가 없으면 에러를 반환한다.
   * 2. id에 해당하는 유저가 있으면 유저가 가진 포인트를 반환한다.
   * 3. id에 해당하는 유저가 있고 포인트 사용 내역이 있으면 알맞은 타입의 값을 반환한다.
   */
  describe(`getPointHistoriesByUserId`, () => {
    it(`유저가 없으면 에러를 반환한다.`, async () => {
      const userId = 0;

      await expect(service.getPointHistoriesByUserId(userId)).rejects.toThrow();
    });
    it(`유저가 있으면 유저가 가진 포인트를 반환한다.`, async () => {
      const userId = 1;

      await expect(service.getPointHistoriesByUserId(userId)).resolves.toEqual(
        [],
      );
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
      historyDb.selectAllByUserId = mockSelectAllByUserId;

      await expect(service.getPointHistoriesByUserId(userId)).resolves.toEqual(
        mockPointHistory,
      );
    });
    it('유저 포인트 정보가 없으면 에러를 반환한다.', async () => {
      const userId = 1;
      const mockSelectAllByUserId = jest.fn(
        (): Promise<PointHistory[]> => Promise.resolve(null),
      );
      historyDb.selectAllByUserId = mockSelectAllByUserId;

      await expect(service.getPointHistoriesByUserId(userId)).rejects.toThrow();
    });
  });

  /**
   * 1. id에 해당하는 유저가 없으면 에러를 반환한다.
   * 2. 음수 또는 0 포인트는 충전할 수 없다.
   * 3. 포인트 충전을 완료하면 충전된 포인트를 반환한다.
   * 4. 포인트 충전 시 히스토리를 저장해야 한다.
   */
  describe(`charge`, () => {
    let userId = 1;
    let amount = 100;
    let mockUserPoint = null;
    beforeEach(() => {
      jest.resetAllMocks();
      mockUserPoint = {
        id: userId,
        point: amount,
        updateMillis: Date.now(),
      };
      const mockInsertOrUpdate = jest.fn(
        (): Promise<UserPoint> => Promise.resolve(mockUserPoint),
      );
      userDb.insertOrUpdate = mockInsertOrUpdate;

      historyDb.insert = jest.fn();
    });

    it(`유저가 없으면 에러를 반환한다.`, async () => {
      const userId = 0;
      const amount = 100;

      await expect(service.charge(userId, amount)).rejects.toThrow();
    });
    it(`음수 또는 0 포인트는 충전할 수 없다.`, async () => {
      const userId = 1;
      const amount = 0;

      await expect(service.charge(userId, amount)).rejects.toThrow();

      const amount2 = -100;

      await expect(service.charge(userId, amount2)).rejects.toThrow();
    });
    it(`포인트 충전 시 히스토리를 저장해야 한다.`, async () => {
      const userId = 1;
      const amount = 100;

      await service.charge(userId, amount);
      expect(historyDb.insert).toHaveBeenCalled();
    });
    it(`포인트 충전을 완료하면 충전된 포인트를 반환한다.`, async () => {
      const userId = 1;
      const amount = 100;

      await expect(service.charge(userId, amount)).resolves.toEqual(
        mockUserPoint,
      );
    });
  });

  /**
   * 1. id에 해당하는 유저가 없으면 에러를 반환한다.
   * 2. 음수 또는 0 포인트는 사용할 수 없다.
   * 3. 포인트 사용을 완료하면 사용된 포인트를 반환한다.
   * 4. 포인트 사용 시 히스토리를 저장해야 한다.
   * 5. 사용할 포인트가 유저가 가진 포인트보다 많으면 에러를 반환한다.
   *
   */
  // describe(`use`, () => {
  //   it(`유저가 없으면 에러를 반환한다.`, async () => {
  //     const userId = 0;
  //     const amount = 100;

  //     await expect(service.use(userId, amount)).rejects.toThrow();
  //   });

  //   it(`음수 또는 0 포인트는 사용할 수 없다.`, async () => {
  //     const userId = 1;
  //     const amount = 0;

  //     await expect(service.use(userId, amount)).rejects.toThrow();

  //     const amount2 = -100;

  //     await expect(service.use(userId, amount2)).rejects.toThrow();
  //   });

  // });
});
