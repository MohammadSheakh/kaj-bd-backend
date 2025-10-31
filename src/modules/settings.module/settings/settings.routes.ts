//@ts-ignore
import { Router } from 'express';
import { SettingsController } from './settings.controllers';
//@ts-ignore
import multer from "multer";
import { TRole } from '../../../middlewares/roles';
import auth from '../../../middlewares/auth';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router
  .route('/')
  .get(SettingsController.getDetailsByType)
  // FIXME : FormData te details send korle kaj hocche na .. raw kaj kortese
  //----------------------------------
  // Admin | Upload Introduction video
  //----------------------------------
  .post(
    auth(TRole.commonAdmin),
    SettingsController.createOrUpdateSettings
  );
export const SettingsRoutes = router;
