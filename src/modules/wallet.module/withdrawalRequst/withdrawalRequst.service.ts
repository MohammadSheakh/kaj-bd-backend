//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { WithdrawalRequst } from './withdrawalRequst.model';
import { IWithdrawalRequst } from './withdrawalRequst.interface';
import { GenericService } from '../../_generic-module/generic.services';


export class WithdrawalRequstService extends GenericService<
  typeof WithdrawalRequst,
  IWithdrawalRequst
> {
  constructor() {
    super(WithdrawalRequst);
  }
}
