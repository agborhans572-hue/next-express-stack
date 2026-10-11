import { z } from "zod";

export const newsletterBody = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
});
