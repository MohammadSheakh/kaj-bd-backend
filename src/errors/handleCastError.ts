import { IErrorMessage } from "../types/errors.types";
//@ts-ignore
import mongoose from "mongoose";

interface ICastErrorResponse {
  code: number;
  message: string;
  errorMessages: IErrorMessage[];
}

const handleCastError = (
  error: mongoose.Error.CastError
): ICastErrorResponse => {
  const errorMessages: IErrorMessage[] = [
    {
      path: error.path || '',
      message: `Invalid ${error.path}: "${error.value}". Please provide a valid ID.`,
    },
  ];

  const code = 400; // Bad Request for invalid format
  const message = 'Invalid ID format';

  return {
    code,
    message,
    errorMessages,
  };
};

export default handleCastError;
