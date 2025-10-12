// datefn use korte hobe 

export function formatMessage(userName: string, message: string): object  { 
  return {
    userName,
    message,
    time: new Date().toISOString(),
  };
}

