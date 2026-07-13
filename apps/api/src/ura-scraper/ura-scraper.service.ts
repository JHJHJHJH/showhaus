import { HttpService } from '@nestjs/axios';
import { Logger, Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { UraPrivateResiEntity } from '../ura-private-resi/ura-private-resi.entity';
import { UraPrivateResiService } from '../ura-private-resi/ura-private-resi.service';
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
    private uraPrivateResiService: UraPrivateResiService,
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

    const ura_private_resis = await this.getAllPrivateResidentialTransactions(
      batch,
      key,
      token.Result,
    );

    let newUraPrivateResisCount = 0;
    let newTransactionsCount = 0;
    //class-transformer
    //convert json object to ura-private-resi entity
    if (ura_private_resis.Result.length > 0) {
      for (let i = 0; i < ura_private_resis.Result.length; i++) {
        const ura_private_resi = ura_private_resis.Result[i];

        const converted_ura_private_resi = plainToClass(
          UraPrivateResiEntity,
          ura_private_resi,
        );

        //console.log(converted_ura_private_resi);

        //if does not exist, create ura-private-resi
        const ura_private_resi_db =
          await this.uraPrivateResiService.findUraPrivateResiByParam(
            converted_ura_private_resi,
          );
        //if ura-private-resi exists
        if (ura_private_resi_db.length > 0) {
          // this.logger.log(
          //   `${ura_private_resi_db.length} existing ura-private-resis found. Checking for existing transactions...`,
          // );
          //iterate transactions
          for (
            let j = 0;
            j < converted_ura_private_resi.transactions.length;
            j++
          ) {
            const transaction = converted_ura_private_resi.transactions[j];
            const transaction_db =
              await this.transactionService.findTransactionByParam(
                transaction,
                ura_private_resi_db[0].id,
              );
            //if transaction does not exist, create transaction
            //if exist
            if (transaction_db.length === 0) {
              transaction.uraPrivateResiId = ura_private_resi_db[0].id;
              await this.transactionService.createTransaction(transaction);

              //Add count for logging
              newTransactionsCount += 1;
            }
          }
        } else {
          //this.logger.log('no ura-private-resi el found in db');
          this.logger.log(converted_ura_private_resi.project);
          const ura_private_resi_db =
            await this.uraPrivateResiService.createUraPrivateResi(
              converted_ura_private_resi,
            );

          //Add count for logging
          newUraPrivateResisCount += 1;
          newTransactionsCount += ura_private_resi_db.transactions.length;
        }
      }

      this.logger.log(
        'New ura-private-resis added: ' + newUraPrivateResisCount,
      );
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
      const url =
        'https://eservice.ura.gov.sg/uraDataService/insertNewToken/v1';

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
      const url = `https://eservice.ura.gov.sg/uraDataService/invokeUraDS/v1?service=PMI_Resi_Transaction&batch=${batch}`;

      const response = await firstValueFrom(this.httpService.get(url, config));

      this.logger.log(
        `Batch ${batch} Ura-Private-Resis : ${response.data.Result.length}`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
