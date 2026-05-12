import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

jest.mock('@nestjs/typeorm', () => {
  const original = jest.requireActual('@nestjs/typeorm');
  return {
    ...original,
    TypeOrmModule: {
      forRoot: jest.fn().mockReturnValue({
        module: class {},
        providers: [],
      }),
      forRootAsync: jest.fn().mockReturnValue({
        module: class {},
        providers: [],
      }),
      forFeature: jest.fn().mockImplementation((entities) => ({
        module: class {},
        providers: entities.map((entity) => ({
          provide: original.getRepositoryToken(entity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        })),
        exports: entities.map((entity) => original.getRepositoryToken(entity)),
      })),
    },
  };
});

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello Showhouse Api! UPDATE');
  });
});
