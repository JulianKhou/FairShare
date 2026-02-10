import * as z from "zod"

const formSchema = z.object({
  licenseKey: z.string()
    .min(12, "Der Schlüssel ist zu kurz")
    .regex(/^[A-Z0-9-]+$/, "Ungültiges Format (nur Großbuchstaben, Zahlen, Bindestriche)"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
})