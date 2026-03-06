import { Test } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Requirements fetch endpoint', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });
  afterAll(async () => app.close());

  it('returns normalized requirements for demo connector', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/connections/conn_demo_1/requirements?projectExternalId=PAY&releaseContextExternalId=Q3-2026');
    expect(res.body.data[0].key).toBe('PAY-101');
  });
});
