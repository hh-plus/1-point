import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import { DatabaseModule } from '@/database/database.module';

describe('PointService', () => {
  let service: PointService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [PointService],
    }).compile();

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
  });
});
