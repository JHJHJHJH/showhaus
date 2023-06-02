import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { LocationEntity } from './location.entity';
import { ILocation } from './location.interface';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @InjectRepository(LocationEntity)
    private readonly locationRepository: Repository<LocationEntity>,
  ) {}

  async createLocation(location: ILocation) {
    const saved = await this.locationRepository.save(location);
    return saved;
  }

  async removeAllLocations() {
    await this.locationRepository.createQueryBuilder().delete().execute();
  }

  async findLocationByParam(location: ILocation): Promise<LocationEntity[]> {
    const condition = {
      project: `${location.project}`,
      street: `${location.street}`,
      x: location.x,
      y: location.y,
    };
    const location_db = await this.locationRepository.find({
      where: condition,
    });

    // this.logger.log(
    //   `[ findLocationByParam ] Found ${location_db.length} locations.`,
    // );
    return location_db;
  }

  async findLocationByBoundingBox(
    minLon: number,
    minLat: number,
    maxLon: number,
    maxLat: number,
  ) {
    const location_db = await this.locationRepository
      .createQueryBuilder('location')
      .innerJoinAndSelect('location.transactions', 'tx')
      .where(
        `location.coordinates && ST_Transform( ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 4326)`,
      )
      .getMany();

    this.logger.log(
      `[ findLocationByBoundingBox ] Found ${location_db.length} locations.`,
    );
    return location_db;
  }

  async getTransactionsGeojson(
    minLon: number,
    minLat: number,
    maxLon: number,
    maxLat: number,
  ) {
    // const location_db = await this.locationRepository.createQueryBuilder('location')
    //                                             .innerJoinAndSelect('location.transactions','tx')
    //                                             .where(`location.geometry && ST_Transform( ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 4326)`)
    //                                             .getMany();

    //console.log(location_db);
    const geojson = await this.locationRepository.query(
      `
                SELECT  json_build_object(
                    'type', 'FeatureCollection',
                    'features', json_agg( ST_AsGeoJSON( joined.*)::json )
                    ) AS data
                    FROM
                    ( 
                        SELECT
                        loc.id AS location_id,
                        loc.geometry,
                        loc.project,
                        loc.street,
                        array_agg( tx ) AS transactions
                    FROM 
                        location loc
                        INNER JOIN
                            transaction tx
                        ON
                            loc.id = tx.location_id 
                        WHERE 
                            loc.geometry && 
                            ST_Transform(ST_MakeEnvelope(${minLon}, ${minLat}, ${maxLon}, ${maxLat}, 4326), 4326)
                        GROUP BY
                            loc.id
                    ) AS joined
            `,
    );

    return geojson[0]['data'];
  }
}
