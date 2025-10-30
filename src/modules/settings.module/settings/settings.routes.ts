//@ts-ignore
import { Router } from 'express';
import auth from '../../middlewares/auth';
import { SettingsController } from './settings.controllers';
import { TRole } from '../../middlewares/roles';
//@ts-ignore
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router
  .route('/')
  /*******
   * 
   * if introduction video response type is string .. which means its a link
   * if introduction video response type is 
   * 
   * ********** */
  .get(SettingsController.getDetailsByType)
  // FIXME : FormData te details send korle kaj hocche na .. raw kaj kortese
  //----------------------------------
  // Admin | Upload Introduction video
  //----------------------------------
  .post(
    auth(TRole.admin),
    [upload.single('introductionVideo')],
    SettingsController.createOrUpdateSettings
  );
export const SettingsRoutes = router;
