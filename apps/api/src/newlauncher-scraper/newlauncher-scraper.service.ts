import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Point } from 'geojson';
import { access, mkdir, writeFile } from 'fs/promises';
import { extname, join, relative, sep } from 'path';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { load } from 'cheerio';
import { NewlauncherProjectEntity } from './newlauncher-project.entity';
import { Page } from 'playwright';
import { PlaywrightFetcherService } from './playwright-fetcher.service';

interface INewlauncherCoordinates {
  longitude: number;
  latitude: number;
}

interface INewlauncherProjectDetails {
  id: string;
  url: string;
  name: string;
  projectInfo: Record<string, string>;
  facilities: string[];
  essentialAmenities: Record<string, string>[];
  unitMix: Record<string, string>[];
  balanceUnits: Record<string, string>[];
  floorPlans: unknown[];
  documents: Record<string, unknown>;
  coordinates: INewlauncherCoordinates | null;
}

interface INewlauncherScrapeOptions {
  limit?: number;
  downloadAssets?: boolean;
  skipDelays?: boolean;
}

interface INewlauncherScrapeSummary {
  id: string;
  name: string;
  url: string;
  district: string;
  propertyType: string;
  expectedTop: string;
  coordinates: INewlauncherCoordinates | null;
}

interface IGoogleGeocodeResult {
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
}

interface IGoogleGeocodeResponse {
  status?: string;
  error_message?: string;
  results?: IGoogleGeocodeResult[];
}

@Injectable()
export class NewlauncherScraperService {
  private readonly logger = new Logger(NewlauncherScraperService.name);
  private readonly baseUrl = 'https://newlauncher.com.sg';
  private readonly searchUrl = `${this.baseUrl}/search/page=MQ&sort_by=NA&`;
  private readonly defaultHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: `${this.baseUrl}/`,
  };
  private running = false;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly playwrightFetcher: PlaywrightFetcherService,
    @InjectRepository(NewlauncherProjectEntity)
    private readonly projectRepository: Repository<NewlauncherProjectEntity>,
  ) {}

  @Cron('0 3 * * *', {
    name: 'newlauncher-scraper',
    timeZone: 'Asia/Singapore',
  })
  async syncDailyNewlauncher() {
    await this.scrape();
  }

  async scrape(options: INewlauncherScrapeOptions = {}) {
    if (this.running) {
      throw new Error('NewLauncher scrape is already running');
    }

    this.running = true;

    try {
      return await this.playwrightFetcher.withPage(async (page) => {
        const projectLinks = await this.fetchProjectLinks(page);
        const limit = this.normalizeLimit(options.limit);
        const linksToScrape =
          limit == null ? projectLinks : projectLinks.slice(0, limit);
        const summaries: INewlauncherScrapeSummary[] = [];
        let failed = 0;

        this.logger.log(
          `Found ${projectLinks.length} NewLauncher projects. Scraping ${linksToScrape.length}.`,
        );

        await mkdir(this.dataDirectory, { recursive: true });

        for (let index = 0; index < linksToScrape.length; index += 1) {
          const url = linksToScrape[index];

          try {
            const details = await this.scrapeProjectDetails(page, url, options);
            const summary = this.toSummary(details);

            await this.projectRepository.upsert(
              this.toProjectEntity(details, summary),
              ['externalId'],
            );

            await this.writeProjectSnapshot(details);
            summaries.push(summary);
            this.logger.log(
              `Persisted NewLauncher project ${index + 1}/${linksToScrape.length}: ${details.name || details.id}`,
            );
          } catch (error) {
            failed += 1;
            const message =
              error instanceof Error ? error.message : 'Unknown scrape error';
            this.logger.error(`Failed to scrape ${url}: ${message}`);
          }

          if (index < linksToScrape.length - 1 && options.skipDelays !== true) {
            await this.randomDelay(5000, 15000);
          }
        }

        await this.writeSummarySnapshot(summaries);
        this.logger.log(
          `NewLauncher scrape complete. Persisted ${summaries.length}; failed ${failed}.`,
        );

        return {
          totalFound: projectLinks.length,
          processed: summaries.length,
          failed,
          projects: summaries,
        };
      });
    } finally {
      this.running = false;
    }
  }

  async fetchProjectLinks(page: Page): Promise<string[]> {
    const html = await this.playwrightFetcher.fetchHtml(page, this.searchUrl, {
      waitUntil: 'networkidle',
    });
    const $ = load(html);
    const seen = new Set<string>();
    const urls: string[] = [];

    $(
      'a[href^="https://newlauncher.com.sg/project/"], a[href^="/project/"]',
    ).each((_, element) => {
      const href = $(element).attr('href');
      const url = this.resolveUrl(href, this.baseUrl);

      if (url != null && !seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    });

    return urls;
  }

  async scrapeProjectDetails(
    page: Page,
    url: string,
    options: INewlauncherScrapeOptions = {},
  ): Promise<INewlauncherProjectDetails> {
    const html = await this.playwrightFetcher.fetchHtml(page, url, {
      waitUntil: 'domcontentloaded',
      scroll: options.skipDelays !== true,
    });
    const $ = load(html);
    const id = this.projectIdFromUrl(url);
    const name = this.normalizeText($('h1').first().text());
    const projectInfo = this.extractProjectInfo($);
    const coordinates = await this.geocodeProject(
      name,
      projectInfo['Street Address'],
    );
    const floorPlans = this.extractFloorPlans(html);
    const downloadAssets = this.shouldDownloadAssets(options.downloadAssets);
    const projectFolder = join(this.dataDirectory, id);
    const documentsFolder = join(projectFolder, 'documents');
    const documents = downloadAssets
      ? await this.downloadDocuments($, url, documentsFolder)
      : {};
    const persistedFloorPlans = downloadAssets
      ? await this.downloadFloorPlanAssets(
          floorPlans,
          join(documentsFolder, 'floor_plans'),
        )
      : floorPlans;

    return {
      id,
      url,
      name,
      projectInfo,
      facilities: this.extractList(
        $,
        '#section-3 .swiper-wrapper ul.swiper-slide li',
      ),
      essentialAmenities: this.extractTableData(
        $,
        '#section-4 table.table-location-map',
      ),
      unitMix: this.extractTableData($, '#section-5 .card-body table'),
      balanceUnits: this.extractTableData($, '#section-6 .card-body table'),
      floorPlans: persistedFloorPlans,
      documents,
      coordinates,
    };
  }

  private get dataDirectory() {
    return (
      this.configService.get<string>('NEWLAUNCHER_DATA_DIR') ||
      join(process.cwd(), 'data', 'newlauncher')
    );
  }

  private normalizeLimit(limit?: number) {
    if (limit == null || Number.isNaN(limit) || limit <= 0) {
      return null;
    }

    return Math.floor(limit);
  }

  private shouldDownloadAssets(downloadAssets?: boolean) {
    if (downloadAssets != null) {
      return downloadAssets;
    }

    return (
      this.configService.get<string>('NEWLAUNCHER_DOWNLOAD_ASSETS') !== 'false'
    );
  }

  private extractProjectInfo($: ReturnType<typeof load>) {
    const projectInfo: Record<string, string> = {};

    $('.text_info_item').each((_, element) => {
      const label = this.normalizeText($(element).find('small').first().text());
      const value = this.normalizeText($(element).find('p').first().text());

      if (label !== '') {
        projectInfo[label.replace(/:$/, '')] = value;
      }
    });

    return projectInfo;
  }

  private extractList($: ReturnType<typeof load>, selector: string) {
    return $(selector)
      .map((_, element) => this.normalizeText($(element).text()))
      .get()
      .filter((value) => value !== '');
  }

  private extractTableData($: ReturnType<typeof load>, selector: string) {
    const table = $(selector).first();
    if (table.length === 0) {
      return [];
    }

    const headers = table
      .find('thead th')
      .map((_, element) => this.normalizeText($(element).text()))
      .get();

    const rows = table.find('tbody tr').length
      ? table.find('tbody tr')
      : table.find('tr').filter((_, row) => $(row).find('td').length > 0);
    const tableData: Record<string, string>[] = [];

    rows.each((_, row) => {
      const cells = $(row).find('td');
      const rowData: Record<string, string> = {};

      cells.each((cellIndex, cell) => {
        const header = headers[cellIndex] || `column_${cellIndex}`;
        rowData[header] = this.normalizeText($(cell).text());
      });

      tableData.push(rowData);
    });

    return tableData;
  }

  private extractFloorPlans(html: string): unknown[] {
    const assignmentMatch = new RegExp(`var\\s+unit_fp\\s*=`).exec(html);
    if (assignmentMatch == null) {
      return [];
    }

    const arrayStart = html.indexOf('[', assignmentMatch.index);
    if (arrayStart < 0) {
      return [];
    }

    const json = this.extractBalancedArray(html, arrayStart);
    if (json == null) {
      return [];
    }

    try {
      return JSON.parse(json);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown JSON parse error';
      this.logger.warn(`Unable to parse unit_fp floor-plan data: ${message}`);
      return [];
    }
  }

  private extractBalancedArray(html: string, arrayStart: number) {
    let depth = 0;
    let inString = false;
    let stringQuote = '';
    let escaped = false;

    for (let index = arrayStart; index < html.length; index += 1) {
      const character = html[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (character === '\\') {
          escaped = true;
        } else if (character === stringQuote) {
          inString = false;
        }

        continue;
      }

      if (character === '"' || character === "'" || character === '`') {
        inString = true;
        stringQuote = character;
        continue;
      }

      if (character === '[') {
        depth += 1;
      } else if (character === ']') {
        depth -= 1;

        if (depth === 0) {
          return html.slice(arrayStart, index + 1);
        }
      }
    }

    return null;
  }

  private async downloadDocuments(
    $: ReturnType<typeof load>,
    projectUrl: string,
    documentsFolder: string,
  ) {
    const documents: Record<string, unknown> = {};

    const galleryDownloads = [
      {
        key: 'site_plan',
        selector: '#site-plan-gallery a',
        filename: 'site_plan',
        defaultExtension: '.jpg',
      },
      {
        key: 'location_map',
        selector: '#location-map-gallery a',
        filename: 'location_map',
        defaultExtension: '.png',
      },
      {
        key: 'unit_mix_map',
        selector: '#unit-mix-gallery a',
        filename: 'unit_mix_map',
        defaultExtension: '.png',
      },
    ];

    for (const item of galleryDownloads) {
      const href = $(item.selector).first().attr('href');
      const url = this.resolveUrl(href, projectUrl);

      if (url == null) {
        continue;
      }

      const extension = this.inferFileExtension(url, item.defaultExtension);
      const localPath = await this.downloadFile(
        url,
        documentsFolder,
        `${item.filename}${extension}`,
      );

      if (localPath != null) {
        documents[item.key] = localPath;
      }

      await this.randomDelay(500, 1200);
    }

    const mediaGalleryUrls = this.extractGalleryImageUrls(
      $,
      '#media-thumbnails-gallery',
      projectUrl,
    );

    if (mediaGalleryUrls.length > 0) {
      const mediaGalleryPaths: string[] = [];
      const mediaGalleryFolder = join(documentsFolder, 'media_gallery');

      for (let index = 0; index < mediaGalleryUrls.length; index += 1) {
        const mediaUrl = mediaGalleryUrls[index];
        const extension = this.inferFileExtension(mediaUrl);
        const localPath = await this.downloadFile(
          mediaUrl,
          mediaGalleryFolder,
          `media_gallery_${String(index + 1).padStart(2, '0')}${extension}`,
        );

        if (localPath != null) {
          mediaGalleryPaths.push(localPath);
        }

        await this.randomDelay(200, 800);
      }

      if (mediaGalleryPaths.length > 0) {
        documents.media_gallery = mediaGalleryPaths;
      }
    }

    return documents;
  }

  private extractGalleryImageUrls(
    $: ReturnType<typeof load>,
    selector: string,
    baseUrl: string,
  ) {
    const gallery = $(selector).first();
    if (gallery.length === 0) {
      return [];
    }

    const attributePriority = [
      'href',
      'data-src',
      'data-image',
      'data-full',
      'data-zoom-image',
      'src',
    ];
    const slideElements = gallery.find('.an-image');
    const elementsToScan = slideElements.length
      ? slideElements.toArray()
      : gallery.find('a, img').toArray();
    const seen = new Set<string>();
    const urls: string[] = [];

    for (const element of elementsToScan) {
      const candidates = [element];

      if ($(element).hasClass('an-image')) {
        candidates.push(...$(element).find('a, img').toArray());
      }

      let resolvedUrl: string | null = null;

      for (const candidate of candidates) {
        for (const attribute of attributePriority) {
          const value = $(candidate).attr(attribute);
          const url = this.resolveUrl(value, baseUrl);

          if (url == null || seen.has(url)) {
            continue;
          }

          resolvedUrl = url;
          break;
        }

        if (resolvedUrl != null) {
          break;
        }
      }

      if (resolvedUrl != null) {
        seen.add(resolvedUrl);
        urls.push(resolvedUrl);
      }
    }

    return urls;
  }

  private async downloadFloorPlanAssets(floorPlans: unknown[], folder: string) {
    const enrichedFloorPlans = JSON.parse(JSON.stringify(floorPlans));

    if (!Array.isArray(enrichedFloorPlans)) {
      return floorPlans;
    }

    for (const unit of enrichedFloorPlans) {
      const unitName = this.sanitizeFilename(unit?.unit_name || 'unknown');
      const unitType = this.sanitizeFilename(unit?.unit_type || 'unknown');
      const plans = Array.isArray(unit?.floorplans) ? unit.floorplans : [];

      for (let index = 0; index < plans.length; index += 1) {
        const plan = plans[index];
        const path = plan?.path;

        if (typeof path !== 'string' || path === '') {
          continue;
        }

        const url = this.resolveUrl(path, this.baseUrl);
        if (url == null) {
          continue;
        }

        const extension = this.inferFileExtension(path, '.png');
        const localPath = await this.downloadFile(
          url,
          folder,
          `${unitType}_${unitName}_${index}${extension}`,
        );

        if (localPath != null) {
          plan.local_path = localPath;
        }

        await this.randomDelay(200, 800);
      }
    }

    return enrichedFloorPlans;
  }

  private async downloadFile(url: string, folder: string, filename: string) {
    await mkdir(folder, { recursive: true });

    const filePath = join(folder, this.sanitizeFilename(filename));
    if (await this.fileExists(filePath)) {
      return this.toRelativePath(filePath);
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<ArrayBuffer>(url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: this.defaultHeaders,
        }),
      );
      const data = Buffer.isBuffer(response.data)
        ? response.data
        : Buffer.from(response.data);

      await writeFile(filePath, data);
      return this.toRelativePath(filePath);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown download error';
      this.logger.warn(`Failed to download ${url}: ${message}`);
      return null;
    }
  }

  private async geocodeProject(
    name: string,
    address?: string,
  ): Promise<INewlauncherCoordinates | null> {
    if (address == null || address === '') {
      return null;
    }

    const apiKey =
      this.configService.get<string>('GOOGLE_MAPS_API_KEY') ||
      this.configService.get<string>('GOOGLE_API_KEY');
    if (apiKey == null || apiKey === '') {
      return null;
    }

    const queries = [`${name}, ${address}`, address].filter(
      (query) => query.trim() !== '',
    );

    for (const query of queries) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<IGoogleGeocodeResponse>(
            'https://maps.googleapis.com/maps/api/geocode/json',
            {
              params: {
                address: `${query}, Singapore`,
                components: 'country:SG',
                key: apiKey,
              },
              timeout: 10000,
            },
          ),
        );
        const location = response.data.results?.[0]?.geometry?.location;

        if (
          response.data.status === 'OK' &&
          location != null &&
          typeof location.lng === 'number' &&
          typeof location.lat === 'number'
        ) {
          return {
            longitude: location.lng,
            latitude: location.lat,
          };
        }

        if (response.data.status != null && response.data.status !== 'OK') {
          this.logger.warn(
            `Google geocoding returned ${response.data.status} for "${query}"${
              response.data.error_message
                ? `: ${response.data.error_message}`
                : ''
            }`,
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown geocoding error';
        this.logger.warn(`Failed to geocode "${query}": ${message}`);
      }
    }

    return null;
  }

  private toProjectEntity(
    details: INewlauncherProjectDetails,
    summary: INewlauncherScrapeSummary,
  ) {
    return {
      externalId: details.id,
      url: details.url,
      name: details.name,
      district: summary.district,
      propertyType: summary.propertyType,
      expectedTop: summary.expectedTop,
      projectInfo: details.projectInfo,
      facilities: details.facilities,
      essentialAmenities: details.essentialAmenities,
      unitMix: details.unitMix,
      balanceUnits: details.balanceUnits,
      floorPlans: details.floorPlans,
      documents: details.documents,
      geometry: this.toPoint(details.coordinates),
    };
  }

  private toSummary(
    details: INewlauncherProjectDetails,
  ): INewlauncherScrapeSummary {
    return {
      id: details.id,
      name: details.name,
      url: details.url,
      district: details.projectInfo['Postal District'] || '',
      propertyType: details.projectInfo['Project Category'] || '',
      expectedTop: details.projectInfo['Expected TOP'] || '',
      coordinates: details.coordinates,
    };
  }

  private toPoint(coordinates: INewlauncherCoordinates | null): Point | null {
    if (coordinates == null) {
      return null;
    }

    return {
      type: 'Point',
      coordinates: [coordinates.longitude, coordinates.latitude],
    };
  }

  private async writeProjectSnapshot(details: INewlauncherProjectDetails) {
    const projectFolder = join(this.dataDirectory, details.id);
    await mkdir(projectFolder, { recursive: true });
    await writeFile(
      join(projectFolder, 'details.json'),
      JSON.stringify(details, null, 2),
    );
  }

  private async writeSummarySnapshot(summaries: INewlauncherScrapeSummary[]) {
    await mkdir(this.dataDirectory, { recursive: true });
    await writeFile(
      join(this.dataDirectory, 'projects_summary.json'),
      JSON.stringify(summaries, null, 2),
    );
  }

  private projectIdFromUrl(url: string) {
    const pathname = new URL(url).pathname;
    return pathname.split('/').filter(Boolean).pop() || 'unknown-project';
  }

  private resolveUrl(value?: string, baseUrl = this.baseUrl) {
    if (value == null || value === '') {
      return null;
    }

    const trimmedValue = value.trim();
    if (
      trimmedValue.startsWith('data:') ||
      trimmedValue.startsWith('javascript:')
    ) {
      return null;
    }

    try {
      const resolvedUrl = new URL(trimmedValue, baseUrl);
      resolvedUrl.hash = '';
      return resolvedUrl.toString();
    } catch {
      return null;
    }
  }

  private inferFileExtension(url: string, defaultExtension = '.jpg') {
    try {
      const extension = extname(new URL(url, this.baseUrl).pathname);
      return extension || defaultExtension;
    } catch {
      return extname(url) || defaultExtension;
    }
  }

  private sanitizeFilename(value: string) {
    return this.normalizeText(String(value))
      .replace(/[\/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, '_');
  }

  private normalizeText(value?: string | null) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  private async fileExists(path: string) {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  private toRelativePath(path: string) {
    return relative(process.cwd(), path).split(sep).join('/');
  }

  private randomDelay(minMs: number, maxMs: number) {
    const delay = minMs + Math.random() * (maxMs - minMs);
    return this.sleep(delay);
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
