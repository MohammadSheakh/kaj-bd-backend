//@ts-ignore
import express from 'express';
import * as validation from './agoraCalling.validation';
import { AgoraCallingController} from './agoraCalling.controller';
import { IAgoraCalling } from './agoraCalling.interface';
import { validateFiltersForQuery } from '../../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../../shared/validateRequest';
import auth from '../../../middlewares/auth';
//@ts-ignore
import multer from "multer";
import { TRole } from '../../../middlewares/roles';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IAgoraCalling | 'sortBy' | 'page' | 'limit' | 'populate'>(
  filters: T[]
) => {
  return filters;
};

const paginationOptions: Array<'sortBy' | 'page' | 'limit' | 'populate'> = [
  'sortBy',
  'page',
  'limit',
  'populate',
];

// const taskService = new TaskService();
const controller = new AgoraCallingController();


/** ----------------------------------------------
   * @role All
   * @Section Calling With Agora
   * @module |
   * @figmaIndex 0-0
   * @desc app user will call this api to get token 
   * 
   *----------------------------------------------*/
router.route('/token').post(
  auth(TRole.common),
  controller.generateToken
); 


export const AgoraCallingRoute = router;
