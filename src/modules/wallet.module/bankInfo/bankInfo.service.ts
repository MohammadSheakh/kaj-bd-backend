//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { BankInfo } from './bankInfo.model';
import { IBankInfo } from './bankInfo.interface';
import { GenericService } from '../../_generic-module/generic.services';

export class BankInfoService extends GenericService<
  typeof BankInfo,
  IBankInfo
> {
  constructor() {
    super(BankInfo);
  }

  //---------------------------------
  // Specialist / Doctor | create or update bank info
  //---------------------------------
  async createOrUpdate(id: string , data: IBankInfo) {
    const bankInfo:IBankInfo = await BankInfo.findOne({
      userId: id
    });


    let bank;
    if (!bankInfo) {
      //---- lets create
      bank = await BankInfo.create(data);

      console.log('if block :: ',bank )
    
    }else{
      //----- lets update
      bankInfo.bankAccountHolderName = data.bankAccountHolderName;
      bankInfo.bankAccountNumber = data.bankAccountNumber;
      bankInfo.bankAccountType = data.bankAccountType;
      bankInfo.bankBranch = data.bankBranch;
      bankInfo.bankName = data.bankName;
      bankInfo.bankRoutingNumber = data.bankRoutingNumber;
      bankInfo.userId = id;

      bank = await BankInfo.findByIdAndUpdate(bankInfo._id,
         bankInfo
         ,{ new: true });
      console.log('else block :: ',bank )

    }

  
    return bank;
  }
}
