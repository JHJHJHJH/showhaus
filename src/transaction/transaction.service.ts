import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LocationEntity } from 'src/location/location.entity';
import { Repository } from 'typeorm';
import { TransactionEntity } from './transaction.entity';
import { ITransaction } from './transaction.interface';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  createTransaction(transaction: ITransaction) {
    return this.transactionRepository.save(transaction);
  }

  async findTransactionByParam(transaction: ITransaction, locationId: number) {
    const condition = {
      locationId: locationId,
      price: transaction.price,
      floorRange: transaction.floorRange,
      area: transaction.area,
    };

    const transaction_db = await this.transactionRepository.find({
      where: condition,
    });

    // this.logger.log(
    //   `[ findTransactionByParam ] Found ${transaction_db.length} transctions.`,
    // );
    return transaction_db;
  }
}
