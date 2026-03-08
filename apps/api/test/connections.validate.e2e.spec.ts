import { Test } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('Connections validate endpoint', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });
  afterAll(async () => app.close());

  it('validates saved connection', async () => {
    const create = await request(app.getHttpServer()).post('/api/v1/connections').send({ name: 'demo', toolType: 'DEMO', baseUrl: 'https://demo.local', authType: 'API_TOKEN', secret: 'demo' });
    const id = create.body.data.id;
    const res = await request(app.getHttpServer()).post(`/api/v1/connections/${id}/validate`);
    expect(res.body.data.success).toBe(true);
  });
});
