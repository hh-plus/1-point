import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserPoint, TransactionType, PointHistory } from '@/point/point.model';
import { Transaction } from '@/database/transaction/transaction';

const userId = 1;

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let transaction: Transaction;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('포인트를 충전 후 조회할 수 있어야 한다.', () => {
    it(`충전을 두 번 진행하면 2번의 기록이 남아야 한다.`, async () => {
      const chargeData: {
        status: number;
        body: UserPoint;
      } = await request(app.getHttpServer())
        .patch(`/point/${userId}/charge`)
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
        .patch(`/point/${userId}/charge`)
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
      } = await request(app.getHttpServer()).get(`/point/${userId}/histories`);

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

    it(`포인트를 충전 후 조회`, async () => {
      const chargeData: {
        status: number;
        body: UserPoint;
      } = await request(app.getHttpServer())
        .patch(`/point/${userId}/charge`)
        .send({ amount: 100 });

      expect(chargeData.status).toBe(200);
      expect(chargeData.body).toEqual({
        id: 1,
        point: 100,
        updateMillis: expect.any(Number),
      });

      const pointData: {
        status: number;
        body: UserPoint;
      } = await request(app.getHttpServer()).get(`/point/${userId}`);

      expect(pointData.status).toBe(200);
      expect(pointData.body).toEqual({
        id: 1,
        point: 100,
        updateMillis: expect.any(Number),
      });
    });
  });

  describe(`포인트를 충전 후 사용할 수 있어야 한다.`, () => {
    describe('정상 플로우', () => {
      it(`포인트를 충전 후 사용`, async () => {
        await request(app.getHttpServer())
          .patch(`/point/${userId}/charge`)
          .send({ amount: 100 });

        const useData: {
          status: number;
          body: UserPoint;
        } = await request(app.getHttpServer())
          .patch(`/point/${userId}/use`)
          .send({ amount: 50 });

        expect(useData.status).toBe(200);
        expect(useData.body).toEqual({
          id: 1,
          point: 50,
          updateMillis: expect.any(Number),
        });
      });

      it(`포인트를 사용 후 히스토리가 남아야한다.`, async () => {
        await request(app.getHttpServer())
          .patch(`/point/${userId}/charge`)
          .send({ amount: 100 });

        await request(app.getHttpServer())
          .patch(`/point/${userId}/use`)
          .send({ amount: 50 });

        const historyData: {
          status: number;
          body: PointHistory[];
        } = await request(app.getHttpServer()).get(
          `/point/${userId}/histories`,
        );

        expect(historyData.status).toBe(200);
        expect(historyData.body).toHaveLength(2);
        expect(historyData.body[1]).toEqual({
          id: 2,
          userId: 1,
          amount: 50,
          type: TransactionType.USE,
          timeMillis: expect.any(Number),
        });
      });
    });
    describe('비정상 플로우', () => {
      it('음수의 포인트를 충전하려하면 에러', () => {
        return request(app.getHttpServer())
          .patch(`/point/${userId}/charge`)
          .send({ amount: -100 })
          .expect(500);
      });

      it('음수의 포인트를 사용하려하면 에러', () => {
        return request(app.getHttpServer())
          .patch(`/point/${userId}/use`)
          .send({ amount: -50 })
          .expect(500);
      });

      it('유저를 찾을 수 없으면 에러', () => {
        return request(app.getHttpServer())
          .patch(`/point/0/use`)
          .send({ amount: 50 })
          .expect(500);
      });

      it(`포인트를 충전하고 충전한 포인트보다 많은 포인트를 사용하면 에러를 반환한다.`, async () => {
        await request(app.getHttpServer())
          .patch(`/point/${userId}/charge`)
          .send({ amount: 100 });

        const useData: {
          status: number;
          body: UserPoint;
        } = await request(app.getHttpServer())
          .patch(`/point/${userId}/use`)
          .send({ amount: 200 });

        expect(useData.status).toBe(500);
      });
    });
  });

  describe('transaction', () => {
    it('근소한 차이로 충전과 사용 요청을 보내면 순서대로 처리되어야 한다.', async () => {
      const chargePromise = request(app)
        .patch(`/point/${userId}/charge`)
        .send({ amount: 100 });

      const usePromise = request(app)
        .patch(`/point/${userId}/use`)
        .send({ amount: 100 });

      // 두 요청의 응답을 기다립니다.
      const [chargeData, useData] = await Promise.all([
        chargePromise,
        usePromise,
      ]);

      if (chargeData.status !== 200 || useData.status !== 200) {
        console.log(chargeData.body);
        console.log(useData.error);
      }

      expect(chargeData.status).toBe(200);
      expect(useData.status).toBe(200);

      const historyData: {
        status: number;
        body: PointHistory[];
      } = await request(app.getHttpServer()).get(`/point/${userId}/histories`);

      expect(historyData.status).toBe(200);
      expect(historyData.body).toHaveLength(2);
      expect(historyData.body[0]).toEqual({
        id: 1,
        userId: 1,
        amount: 100,
        type: TransactionType.CHARGE,
        timeMillis: expect.any(Number),
      });
      expect(historyData.body[1]).toEqual({
        id: 2,
        userId: 1,
        amount: 100,
        type: TransactionType.USE,
        timeMillis: expect.any(Number),
      });
    });
  });
});
