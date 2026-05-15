import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SchoolScrapeDto, SchoolType } from './dtos/school-scrape.dto';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { SchoolEntity } from './school.entity';
import { Repository } from 'typeorm';

interface OneMapSearchResult {
  SEARCHVAL: string;
  BLK_NO: string;
  ROAD_NAME: string;
  BUILDING: string;
  ADDRESS: string;
  POSTAL: string;
  X: string;
  Y: string;
  LATITUDE: string;
  LONGITUDE: string;
}

interface OneMapSearchResponse {
  found: number;
  totalNumPages: number;
  pageNum: number;
  results: OneMapSearchResult[];
}

@Injectable()
export class SchoolScraperService {
  private readonly logger = new Logger(SchoolScraperService.name);
  private readonly onemapSearchUrl = 'https://www.onemap.gov.sg/api/common/elastic/search';

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(SchoolEntity)
    private readonly schoolRepository: Repository<SchoolEntity>,
  ) {}

  async scrape(dto: SchoolScrapeDto) {
    this.logger.log(`Starting school scrape... dto: ${JSON.stringify(dto)}`);

    const schoolTypes = dto.school_type ? [dto.school_type] : Object.values(SchoolType);
    const allResults: any[] = [];
    const seenNames = new Set<string>();

    for (const type of schoolTypes) {
      this.logger.log(`Scraping type: ${type}`);
      const queries = this.getQueriesForType(type);
      
      for (const query of queries) {
        this.logger.log(`Executing query: ${query}`);
        const results = await this.scrapeByQuery(type, query, dto.limit);
        
        for (const result of results) {
          if (!seenNames.has(result.name)) {
            allResults.push(result);
            seenNames.add(result.name);
          }
        }
        
        if (dto.limit && allResults.length >= dto.limit) break;
        
        // Delay between different queries
        await this.sleep(1000 + Math.random() * 2000);
      }
      
      if (dto.limit && allResults.length >= dto.limit) break;
    }

    // Save to database
    this.logger.log(`Saving ${allResults.length} schools to database...`);
    for (const result of allResults) {
      await this.schoolRepository.upsert({
        name: result.name,
        schoolType: result.school_type,
        address: result.address,
        postal: result.postal,
        geometry: {
          type: 'Point',
          coordinates: [result.coordinates.longitude, result.coordinates.latitude],
        },
      }, ['name', 'postal']);
    }

    // Save to file as in the original Python script
    const outputPath = join(process.cwd(), 'schools_onemap.json');
    await writeFile(outputPath, JSON.stringify(allResults, null, 2));
    this.logger.log(`Scraping complete. Saved ${allResults.length} schools to ${outputPath} and database.`);

    return allResults;
  }

  private async scrapeByQuery(type: SchoolType, query: string, limit?: number): Promise<any[]> {
    const results: any[] = [];
    let pageNum = 1;
    let foundCount = 0;

    while (true) {
      const response = await this.searchOnemap(query, pageNum);
      if (!response || response.results.length === 0) break;

      for (const item of response.results) {
        if (limit && foundCount >= limit) break;

        // Filtering to ensure it's likely a school
        const searchVal = item.SEARCHVAL.toUpperCase();
        const building = item.BUILDING.toUpperCase();
        
        const isLikelySchool = 
          searchVal.includes('SCHOOL') || 
          building.includes('SCHOOL') ||
          searchVal.includes('COLLEGE') ||
          searchVal.includes('POLYTECHNIC') ||
          searchVal.includes('ITE') ||
          searchVal.includes('KINDERGARTEN') ||
          searchVal.includes('HIGH SCHOOL') ||
          searchVal.includes('CHIJ') ||
          searchVal.includes('ACADEMY') ||
          searchVal.includes('INSTITUTE') ||
          searchVal.includes('MADRASAH');

        if (isLikelySchool) {
          results.push({
            name: item.SEARCHVAL,
            school_type: type,
            address: item.ADDRESS,
            coordinates: {
              latitude: parseFloat(item.LATITUDE),
              longitude: parseFloat(item.LONGITUDE),
            },
            postal: item.POSTAL === 'NIL' ? null : item.POSTAL,
          });

          foundCount++;
        }
      }

      if (limit && foundCount >= limit) break;
      if (pageNum >= response.totalNumPages) break;
      pageNum++;
      
      // Delay to avoid rate limiting - matching original script (1-3s)
      await this.sleep(1000 + Math.random() * 2000);
    }

    return results;
  }

  private getQueriesForType(type: SchoolType): string[] {
    switch (type) {
      case SchoolType.PRIMARY:
        return ['PRIMARY SCHOOL', 'CHIJ', 'ST ', 'ANGLO-CHINESE'];
      case SchoolType.SECONDARY:
        return ['SECONDARY SCHOOL', 'HIGH SCHOOL', 'CHIJ', 'ST ', 'ANGLO-CHINESE'];
      case SchoolType.POST_SECONDARY:
        return ['JUNIOR COLLEGE', 'POLYTECHNIC', 'ITE', 'CENTRALIZED INSTITUTE', 'UNIVERSITY'];
      case SchoolType.MOE_KINDERGARTEN:
        return ['MOE KINDERGARTEN'];
      default:
        return ['SCHOOL'];
    }
  }

  private async searchOnemap(query: string, pageNum: number, retryCount = 0): Promise<OneMapSearchResponse | null> {
    try {
      const url = `${this.onemapSearchUrl}?searchVal=${encodeURIComponent(query)}&returnGeom=Y&getAddrDetails=Y&pageNum=${pageNum}`;
      const response = await firstValueFrom(
        this.httpService.get<OneMapSearchResponse>(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Referer': 'https://www.onemap.gov.sg/school',
          },
        }),
      );
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      if (status === 429 && retryCount < 5) {
        const delay = Math.pow(2, retryCount) * 2000 + Math.random() * 1000;
        this.logger.warn(`Rate limited (429) for "${query}" page ${pageNum}. Retrying in ${Math.round(delay)}ms... (Attempt ${retryCount + 1})`);
        await this.sleep(delay);
        return this.searchOnemap(query, pageNum, retryCount + 1);
      }

      this.logger.error(`Error searching OneMap for "${query}" page ${pageNum}: ${error.message}`);
      return null;
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
