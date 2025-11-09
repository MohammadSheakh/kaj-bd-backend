import { IErrorMessage } from "../types/errors.types";
//@ts-ignore
import multer from "multer";

interface IMulterErrorResponse {
  code: number;
  message: string;
  errorMessages: IErrorMessage[];
}

const handleMulterError = (error: multer.MulterError): IMulterErrorResponse => {
  let message = "File upload error";
  const errorMessages: IErrorMessage[] = [];

  switch (error.code) {
    case "LIMIT_UNEXPECTED_FILE":
      message = `Too many files uploaded. Only the allowed number of files are permitted for field '${error.field}'.`;
      errorMessages.push({
        path: error.field || "",
        message,
      });
      break;

    case "LIMIT_FILE_SIZE":
      message = "File size too large.";
      errorMessages.push({
        path: error.field || "",
        message,
      });
      break;

    case "LIMIT_FILE_COUNT":
      message = "Too many files uploaded.";
      errorMessages.push({
        path: error.field || "",
        message,
      });
      break;

    default:
      errorMessages.push({
        path: error.field || "",
        message: error.message,
      });
  }

  return {
    code: 400,
    message,
    errorMessages,
  };
};

export default handleMulterError;