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
  code: string;
  message: string;
  data?: Record<string, any>;
};
