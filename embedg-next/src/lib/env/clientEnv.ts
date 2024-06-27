import { z } from "zod";

const clientenvSchema = z.object({
  NEXT_PUBLIC_FRIENDLYCAPTCHA_SITEKEY: z.string(),
});

export default clientenvSchema.parse({
  NEXT_PUBLIC_FRIENDLYCAPTCHA_SITEKEY:
    process.env.NEXT_PUBLIC_FRIENDLYCAPTCHA_SITEKEY,
});
