import { HttpService } from '@nestjs/axios';
import { Logger, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { LocationEntity } from '../location/location.entity';
import { LocationService } from '../location/location.service';
import { GetToken } from './dtos/get-token.dto';
import { Cron } from '@nestjs/schedule';
import { TransactionService } from '../transaction/transaction.service';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class UraScraperService {
  private readonly logger = new Logger(UraScraperService.name);

  constructor(
    private httpService: HttpService,
    private locationService: LocationService,
    private transactionService: TransactionService,
    private configService: ConfigService,
  ) {}

  //runs everyday 12am
  // @Cron('0 */2 * * *')
  // cronJob1(){
  //     const key = this.configService.get<string>('URA_API_KEY');

  //     //scrape batch 1
  //     this.scrape( key, 1)
  //         .then( () =>{
  //             this.scrape(key,2)
  //         })
  //         .then( () =>{
  //             this.scrape(key,3)
  //         })
  //         .then( () =>{
  //             this.scrape(key,4)
  //         })
  //         .catch( (err) => {
  //             console.log(err);
  //         })

  // }
  @Cron('0 0 * * *')
  batch1() {
    // const key = this.configService.get<string>('URA_API_KEY');
    this.scrape(1);
  }
  @Cron('0 1 * * *')
  batch2() {
    // const key = this.configService.get<string>('URA_API_KEY');
    this.scrape(2);
  }
  @Cron('0 2 * * *')
  batch3() {
    // const key = this.configService.get<string>('URA_API_KEY');
    this.scrape(3);
  }
  @Cron('0 3 * * *')
  batch4() {
    // const key = this.configService.get<string>('URA_API_KEY');
    this.scrape(4);
  }

  async scrape(batch: number) {
    this.logger.log(`Scraping batch ${batch}...`);
    const key = this.configService.get<string>('URA_API_KEY');
    const token = await this.getToken(key);

    if (token == null) {
      this.logger.log('Failed to retrieve URA token. Exiting...');
      return;
    }

    const locations = await this.getAllPrivateResidentialTransactions(
      batch,
      key,
      token.Result,
    );

    let newLocationsCount = 0;
    let newTransactionsCount = 0;
    //class-transformer
    //convert json object to location entity
    if (locations.Result.length > 0) {
      for (let i = 0; i < locations.Result.length; i++) {
        const location = locations.Result[i];

        const converted_location = plainToClass(LocationEntity, location);

        //console.log(converted_location);

        //if does not exist, create location
        const location_db = await this.locationService.findLocationByParam(
          converted_location,
        );
        //if location exists
        if (location_db.length > 0) {
          this.logger.log('Existing locations found... ');
          //iterate transactions
          for (let j = 0; j < converted_location.transactions.length; j++) {
            const transaction = converted_location.transactions[j];
            const transaction_db =
              await this.transactionService.findTransactionByParam(
                transaction,
                location_db[0].id,
              );
            //if transaction does not exist, create transaction
            //if exist
            if (transaction_db.length === 0) {
              transaction.locationId = location_db[0].id;
              const new_transaction =
                await this.transactionService.createTransaction(transaction);

              //Add count for logging
              newTransactionsCount += 1;
            }
          }
        } else {
          this.logger.log('no location el found in db');
          this.logger.log(converted_location.project);
          const location_db = await this.locationService.createLocation(
            converted_location,
          );

          //Add count for logging
          newLocationsCount += 1;
          newTransactionsCount += location_db.transactions.length;
        }
      }

      this.logger.log('New locations added: ' + newLocationsCount);
      this.logger.log('New Transactions added: ' + newTransactionsCount);
      this.logger.log(`Scrape batch ${batch} complete!`);
    }
  }

  async getToken(key: string): Promise<GetToken> {
    try {
      const config = {
        headers: {
          AccessKey: key,
        },
      };
      const url = 'https://www.ura.gov.sg/uraDataService/insertNewToken.action';

      const response = await firstValueFrom(this.httpService.get(url, config));

      return response.data;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getAllPrivateResidentialTransactions(
    batch: number,
    key: string,
    token: string,
  ) {
    try {
      const config = {
        headers: {
          AccessKey: key,
          Token: token,
        },
      };
      const url = `https://www.ura.gov.sg/uraDataService/invokeUraDS?service=PMI_Resi_Transaction&batch=${batch}`;

      const response = await firstValueFrom(this.httpService.get(url, config));

      this.logger.log(
        `Batch ${batch} Locations : ${response.data.Result.length}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
