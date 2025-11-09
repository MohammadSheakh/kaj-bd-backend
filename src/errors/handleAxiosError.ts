import { IErrorMessage } from "../types/errors.types";

export default function handleAxiosError(error: any) {
  const statusCode = error.response?.status || 502;
  const message =
    error.response?.data?.message ||
    "Failed to communicate with external service.";

  const errorMessages: IErrorMessage[] = [
    { path: "network", message }
  ];

  return { code: statusCode, message, errorMessages };
}