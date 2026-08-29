import { z } from 'zod';
export const querySchema = z.object({
  query: z.object({ search: z.string().trim().max(100).optional() }),
});
export const vehicleSchema = z.object({
  body: z
    .object({
      vehicleNumber: z.string().trim().min(1).max(40),
      registrationNumber: z.string().trim().min(1).max(40),
      type: z.string().trim().min(1).max(50),
      capacity: z.coerce.number().int().positive(),
    })
    .strict(),
});
export const vehicleStatusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE', 'RETIRED']) }).strict(),
});
export const driverSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(150),
      phone: z.string().max(30).optional(),
      licenseNumber: z.string().trim().min(1).max(80),
    })
    .strict(),
});
export const routeSchema = z.object({
  body: z
    .object({
      code: z.string().trim().min(1).max(40),
      name: z.string().trim().min(1).max(150),
      stops: z
        .array(
          z
            .object({
              name: z.string().trim().min(1).max(150),
              sequence: z.coerce.number().int().positive(),
              pickupTime: z.string().max(20).optional(),
            })
            .strict()
        )
        .default([]),
    })
    .strict(),
});
export const tripSchema = z.object({
  body: z
    .object({
      routeId: z.string().uuid(),
      vehicleId: z.string().uuid().optional(),
      driverId: z.string().uuid().optional(),
      scheduledAt: z.coerce.date(),
    })
    .strict(),
});
export const inspectionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ passed: z.boolean(), notes: z.string().max(500).optional() }).strict(),
});
