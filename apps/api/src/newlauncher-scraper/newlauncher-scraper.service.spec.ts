import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { of } from 'rxjs';
import { NewlauncherProjectEntity } from './newlauncher-project.entity';
import { NewlauncherScraperService } from './newlauncher-scraper.service';
import { PlaywrightFetcherService } from './playwright-fetcher.service';

describe('NewlauncherScraperService', () => {
  let service: NewlauncherScraperService;
  let dataDir: string;
  let playwrightFetcher: {
    withPage: jest.Mock;
    fetchHtml: jest.Mock;
  };
  let httpService: {
    get: jest.Mock;
  };
  let projectRepository: {
    upsert: jest.Mock;
  };

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'newlauncher-scraper-'));
    playwrightFetcher = {
      withPage: jest.fn((callback) => callback({})),
      fetchHtml: jest.fn(),
    };
    httpService = {
      get: jest.fn(),
    };
    projectRepository = {
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewlauncherScraperService,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'NEWLAUNCHER_DATA_DIR') {
                return dataDir;
              }

              if (key === 'GOOGLE_MAPS_API_KEY') {
                return 'google-maps-key';
              }

              return undefined;
            }),
          },
        },
        {
          provide: PlaywrightFetcherService,
          useValue: playwrightFetcher,
        },
        {
          provide: getRepositoryToken(NewlauncherProjectEntity),
          useValue: projectRepository,
        },
      ],
    }).compile();

    service = module.get<NewlauncherScraperService>(NewlauncherScraperService);
    jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it('scrapes and persists NewLauncher project details', async () => {
    playwrightFetcher.fetchHtml.mockResolvedValueOnce(
      '<a href="https://newlauncher.com.sg/project/test-project">Test</a>',
    ).mockResolvedValueOnce(`
        <html>
          <body>
            <h1>Test Project</h1>
            <div class="text_info_item"><small>Postal District</small><p>District 10</p></div>
            <div class="text_info_item"><small>Project Category</small><p>Condo</p></div>
            <div class="text_info_item"><small>Expected TOP</small><p>2028</p></div>
            <section id="section-3">
              <div class="swiper-wrapper">
                <ul class="swiper-slide"><li>Pool</li><li>Gym</li></ul>
              </div>
            </section>
            <section id="section-4">
              <table class="table-location-map">
                <thead><tr><th>Name</th><th>Distance</th></tr></thead>
                <tbody><tr><td>MRT</td><td>200m</td></tr></tbody>
              </table>
            </section>
            <section id="section-5">
              <div class="card-body">
                <table>
                  <thead><tr><th>Type</th><th>Units</th></tr></thead>
                  <tbody><tr><td>2 Bedroom</td><td>20</td></tr></tbody>
                </table>
              </div>
            </section>
            <script>
              var unit_fp = [{"unit_type":"2 Bedroom","unit_name":"A1","floorplans":[{"path":"/floorplan.png"}]}];
            </script>
          </body>
        </html>
      `);

    const result = await service.scrape({
      limit: 1,
      downloadAssets: false,
      skipDelays: true,
    });

    expect(result.processed).toBe(1);
    expect(projectRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: 'test-project',
        name: 'Test Project',
        district: 'District 10',
        propertyType: 'Condo',
        expectedTop: '2028',
        facilities: ['Pool', 'Gym'],
        essentialAmenities: [{ Name: 'MRT', Distance: '200m' }],
        unitMix: [{ Type: '2 Bedroom', Units: '20' }],
      }),
      ['externalId'],
    );
  });

  it('geocodes project addresses with Google Maps', async () => {
    playwrightFetcher.fetchHtml.mockResolvedValueOnce(
      '<a href="https://newlauncher.com.sg/project/google-project">Google</a>',
    ).mockResolvedValueOnce(`
        <html>
          <body>
            <h1>Google Project</h1>
            <div class="text_info_item"><small>Street Address</small><p>1 Test Road</p></div>
          </body>
        </html>
      `);
    httpService.get.mockReturnValue(
      of({
        data: {
          status: 'OK',
          results: [
            {
              geometry: {
                location: {
                  lat: 1.3,
                  lng: 103.8,
                },
              },
            },
          ],
        },
      }),
    );

    await service.scrape({
      limit: 1,
      downloadAssets: false,
      skipDelays: true,
    });

    expect(httpService.get).toHaveBeenCalledWith(
      'https://maps.googleapis.com/maps/api/geocode/json',
      expect.objectContaining({
        params: expect.objectContaining({
          address: 'Google Project, 1 Test Road, Singapore',
          components: 'country:SG',
          key: 'google-maps-key',
        }),
      }),
    );
    expect(projectRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        geometry: {
          type: 'Point',
          coordinates: [103.8, 1.3],
        },
      }),
      ['externalId'],
    );
  });
});
