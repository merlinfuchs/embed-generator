import { useMemo } from "react";
import { ZodType } from "zod";

export function useValidationError(schema: ZodType, value: any): string | null {
  return useMemo(() => {
    const res = schema.safeParse(value);
    if (res.success) return null;
    return res.error.issues[0].message;
  }, [schema, value]);
}
