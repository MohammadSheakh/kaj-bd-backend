//@ts-ignore
import { Router } from 'express';
import { AuthController } from './auth.controller';
import validateRequest from '../../shared/validateRequest';
import { AuthValidation } from './auth.validations';
import auth from '../../middlewares/auth';
//@ts-ignore
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = Router();


//---------------------------------
// (Doctor | Patient) (Registration) | as doctor and patient need to provide their documents while registration
// TODO : validation add kora lagbe .. 
//---------------------------------
router.post(
  '/register',
  // validateRequest(AuthValidation.createHelpMessageValidationSchema),
  AuthController.register,
);

// TODO  : Login er shomoy  FCM token store korte hobe .. 
//[🚧][🧑‍💻✅][🧪] // 🆗 
router.post(
  '/login',
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login,
);

// Route for Google login
router.post(
  '/google-login',
  validateRequest(AuthValidation.googleLoginValidationSchema),
  AuthController.googleLogin,
);


//[🚧][🧑‍💻✅][🧪] // 🆗 
router.post(
  '/forgot-password',
  validateRequest(AuthValidation.forgotPasswordValidationSchema),
  AuthController.forgotPassword,
);

router.post('/resend-otp', AuthController.resendOtp);

//[🚧][🧑‍💻✅][🧪] // 🆗 
router.post(
  '/reset-password',
  validateRequest(AuthValidation.resetPasswordValidationSchema),
  AuthController.resetPassword,
);

router.post(
  '/change-password',
  auth('common'),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword,
);

//[🚧][🧑‍💻✅][🧪] // 🆗 
router.post(
  '/verify-email',
  validateRequest(AuthValidation.verifyEmailValidationSchema),
  AuthController.verifyEmail,
);

router.post('/logout', AuthController.logout);

router.post('/refresh-auth', AuthController.refreshToken);

export const AuthRoutes = router;
