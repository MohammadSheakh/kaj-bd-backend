import { IErrorMessage } from "../types/errors.types";

export default function handleMongooseServerError(error: any) {
  const message = "Database operation failed.";
  const errorMessages: IErrorMessage[] = [
    { path: "", message: error.message || message }
  ];

  return { code: 500, message, errorMessages };
}