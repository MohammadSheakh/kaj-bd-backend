//@ts-ignore
import express from 'express';
import * as validation from './banner.validation';
import { BannerController} from './banner.controller';
import { IBanner } from './banner.interface';
import { validateFiltersForQuery } from '../../middlewares/queryValidation/paginationQueryValidationMiddleware';
import validateRequest from '../../shared/validateRequest';
import auth from '../../middlewares/auth';
//@ts-ignore
import multer from "multer";
import { TRole } from '../../middlewares/roles';
import { imageUploadPipelineForCreateBanner } from './banner.middleware';
import { setQueryOptions } from '../../middlewares/setQueryOptions';
import { defaultExcludes } from '../../constants/queryOptions';
import { setRequestFiltersV2, setRequstFilterAndValue } from '../../middlewares/setRequstFilterAndValue';
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

export const optionValidationChecking = <T extends keyof IBanner | 'sortBy' | 'page' | 'limit' | 'populate'>(
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
const controller = new BannerController();

router.route('/paginate').get(
  //auth('common'),
  validateFiltersForQuery(optionValidationChecking(['_id', ...paginationOptions])),
  setRequestFiltersV2({
    isDeleted: false,
  }),
  controller.getAllWithPaginationV2
);

router.route('/:id').get(
  // auth('common'),
  controller.getById
);

router.route('/update/:id').put(
  //auth('common'),
  // validateRequest(validation.createHelpMessageValidationSchema),
  controller.updateById
);

//[🚧][🧑‍💻✅][🧪] // 🆗
router.route('/').get(
  // auth(TRole.admin),
  setQueryOptions({
    populate: [
      { path: 'attachments', select: 'attachment' },
    ],
    select: `${defaultExcludes}`
  }),
  setRequestFiltersV2({
    isDeleted: false,
  }),
  controller.getAllV2//getAll
);

/** ----------------------------------------------
   * @role Admin
   * @Section Unknown
   * @module |
   * @figmaIndex 0-0
   * @desc create banner from admin dashboard for users home page .. 
   * 
   *----------------------------------------------*/
router.route('/').post(
  // auth(TRole.commonAdmin),
  ...imageUploadPipelineForCreateBanner,
  controller.create
);

router.route('/delete/:id').delete(
  //auth('common'),
  controller.deleteById
); // FIXME : change to admin

router.route('/softDelete/:id').put(
  //auth('common'),
  controller.softDeleteById
);

////////////
//[🚧][🧑‍💻✅][🧪] // 🆗


export const BannerRoute = router;
