import { ErrorRequestHandler } from 'express';
import ApiError from '../errors/ApiError';
import handleDuplicateError from '../errors/handleDuplicateError';
import handleValidationError from '../errors/handleValidationError';
import handleZodError from '../errors/handleZodError';
import { errorLogger } from '../shared/logger';
import { IErrorMessage } from '../types/errors.types';
import { config } from '../config';
import handleCastError from '../errors/handleCastError';
import handleMulterError from '../errors/handleMulterError';
//@ts-ignore
import multer from "multer";
import handleJWTError from '../errors/handleJWTError';
import handleAxiosError from '../errors/handleAxiosError';
import handleSyntaxError from '../errors/handleSyntaxError';
import handleMongooseServerError from '../errors/handleMongooseServerError';

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // Log error
  config.environment === 'development'
    ? console.log('🚨 globalErrorHandler ~~ ', error)
    : errorLogger.error('🚨 globalErrorHandler ~~ ', error);

  let code = 500;
  let message = 'Something went wrong';
  let errorMessages: IErrorMessage[] = [];

  // Handle ZodError
  if (error.name === 'ZodError') {
    const simplifiedError = handleZodError(error);
    code = simplifiedError.code;
    message = `${simplifiedError.errorMessages
      .map(err => err.message)
      .join(', ')}`;
    errorMessages = simplifiedError.errorMessages;
  }
  /**********
   * 
   * Mongoose duplicate key ..
   * if(error.code === 11000)
   * duplicate field value entered
   * 
   * ********** */
  // Handle CastError (Invalid MongoDB ObjectId)
  else if (error.name === 'CastError') {
    const simplifiedError = handleCastError(error);
    code = simplifiedError.code;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }

  // ✅ Handle Multer errors (file upload)
  else if (error instanceof multer.MulterError) {
    const simplifiedError = handleMulterError(error);
    code = simplifiedError.code;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }

  // Handle ValidationError (e.g., Mongoose)
  else if (error.name === 'ValidationError') {
    const simplifiedError = handleValidationError(error);
    code = simplifiedError.code;
    message = `${simplifiedError.errorMessages
      .map(err => err.message)
      .join(', ')}`;
    errorMessages = simplifiedError.errorMessages;
  }
  // Handle DuplicateError (e.g., from database unique constraint violation)
  else if (error.name === 'DuplicateError') {
    const simplifiedError = handleDuplicateError(error);
    code = simplifiedError.code;
    message = `${simplifiedError.errorMessages
      .map(err => err.message)
      .join(', ')}`;
    errorMessages = simplifiedError.errorMessages;
  }
   // ✅ JWT token errors
  else if (
    error.name === 'JsonWebTokenError' ||
    error.name === 'TokenExpiredError'
  ) {
    const simplifiedError = handleJWTError(error);
    code = simplifiedError.code;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }
  // ✅ Axios or network errors
  else if (error.isAxiosError) {
    const simplifiedError = handleAxiosError(error);
    code = simplifiedError.code;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }
  // ✅ SyntaxError (invalid JSON in body)
  else if (error instanceof SyntaxError && 'body' in error) {
    const simplifiedError = handleSyntaxError(error);
    code = simplifiedError.code;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }
  // ✅ Mongoose/MongoServerError (general DB failure)
  else if (error.name === 'MongoServerError') {
    const simplifiedError = handleMongooseServerError(error);
    code = simplifiedError.code;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  }

  // Handle ApiError (custom error type)
  else if (error instanceof ApiError) {
    code = error.code;
    message = error.message || 'Something went wrong';
    errorMessages = error.message
      ? [
          {
            path: '',
            message: error.message,
          },
        ]
      : [];
  }
  // Handle other general errors
  else if (error instanceof Error) {
    message = error.message || 'Internal Server Error';
    errorMessages = error.message
      ? [
          {
            path: '',
            message: error.message,
          },
        ]
      : [];
  }

  // Format multiple error messages as a comma-separated list in the message field
  const formattedMessage =
    errorMessages.length > 1
      ? errorMessages.map(err => err.message).join(', ')
      : message;

  // Send response with statusCode, success, message, and error
  res.status(code).json({
    code,
    message: `${formattedMessage}`,
    error: errorMessages, // Error details (path and message)
    stack: config.environment === 'development' ? error?.stack : undefined, // Stack trace in development mode
  });
};

export default globalErrorHandler;
