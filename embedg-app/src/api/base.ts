export type APIResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: APIError;
    };

export type APIError = {
  Code: string;
  Message: string;
  Data?: Record<string, any>;
};
