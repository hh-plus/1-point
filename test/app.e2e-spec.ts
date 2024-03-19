import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserPoint, TransactionType, PointHistory } from '@/point/point.model';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/point/:id/histories (GET)', () => {
    return request(app.getHttpServer())
      .get('/point/1/histories')
      .expect(200)
      .expect([]);
  });

  describe('포인트를 충전 후 조회할 수 있어야 한다.', () => {
    it(`충전을 두 번 진행하면 2번의 기록이 남아야 한다.`, async () => {
      const chargeData: {
        status: number;
        body: UserPoint;
      } = await request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: 100 });

      expect(chargeData.status).toBe(200);
      expect(chargeData.body).toEqual({
        id: 1,
        point: 100,
        updateMillis: expect.any(Number),
      });

      const chargeData2: {
        status: number;
        body: UserPoint;
      } = await request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: 200 });

      expect(chargeData2.status).toBe(200);
      expect(chargeData2.body).toEqual({
        id: 1,
        point: 200,
        updateMillis: expect.any(Number),
      });

      const historyData: {
        status: number;
        body: PointHistory[];
      } = await request(app.getHttpServer()).get('/point/1/histories');

      expect(historyData.status).toBe(200);
      expect(historyData.body).toHaveLength(2);

      expect(historyData.body).toEqual([
        {
          id: 1,
          userId: 1,
          amount: 100,
          type: TransactionType.CHARGE,
          timeMillis: expect.any(Number),
        },
        {
          id: 2,
          userId: 1,
          amount: 200,
          type: TransactionType.CHARGE,
          timeMillis: expect.any(Number),
        },
      ]);
    });

    it(`충전을 두 번 진행하면 포인트의 합을 조회할 수 있어야 한다.`, async () => {
      await request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: 100 });

      await request(app.getHttpServer())
        .patch('/point/1/charge')
        .send({ amount: 200 });

      const pointData: {
        status: number;
        body: UserPoint;
      } = await request(app.getHttpServer()).get('/point/1');

      expect(pointData.status).toBe(200);
      expect(pointData.body).toEqual({
        id: 1,
        point: 300,
        updateMillis: expect.any(Number),
      });
    });
  });
});
