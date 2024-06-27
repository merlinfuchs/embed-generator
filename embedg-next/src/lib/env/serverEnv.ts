import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_FRIENDLYCAPTCHA_SITEKEY: z.string(),
  FRIENDLYCAPTCHA_API_KEY: z.string(),
});

export default serverEnvSchema.parse({
  NEXT_PUBLIC_FRIENDLYCAPTCHA_SITEKEY:
    process.env.NEXT_PUBLIC_FRIENDLYCAPTCHA_SITEKEY,
  FRIENDLYCAPTCHA_API_KEY: process.env.FRIENDLYCAPTCHA_API_KEY,
});
