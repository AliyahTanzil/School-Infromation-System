import { Router } from 'express';
import { z } from 'zod';
import authenticate from '../../../middleware/auth/authenticate.js';
import singleSchoolContext from '../../../middleware/auth/singleSchoolContext.js';
import requirePermission from '../../../middleware/auth/permissionMiddleware.js';
import validate from '../../../middleware/validation/validate.js';
import prisma from '../../../infrastructure/orm/prismaClient.js';
import { clearSingleSchoolCache } from '../../../application/services/singleSchoolContextService.js';

const router = Router();
const updateSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(200).optional(),
      code: z.string().trim().min(1).max(50).optional(),
      address: z.string().trim().max(500).nullable().optional(),
      city: z.string().trim().max(100).nullable().optional(),
      country: z.string().trim().max(100).nullable().optional(),
      phone: z.string().trim().max(50).nullable().optional(),
      email: z.string().trim().email().max(320).nullable().optional(),
      website: z.string().trim().url().max(500).nullable().optional(),
      motto: z.string().trim().max(300).nullable().optional(),
      logoUrl: z.string().trim().url().max(2000).nullable().optional(),
      principalName: z.string().trim().max(200).nullable().optional(),
      settings: z.record(z.unknown()).optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, 'At least one field is required'),
});

router.use(authenticate, singleSchoolContext);

router.get('/', (req, res) => {
  res.json({ success: true, data: req.school });
});

router.patch('/', requirePermission('schools.update'), validate(updateSchema), async (req, res) => {
  const school = await prisma.school.update({
    where: { id: req.schoolContext.schoolId },
    data: { ...req.body, isConfigured: true },
    select: {
      id: true,
      name: true,
      code: true,
      address: true,
      city: true,
      country: true,
      phone: true,
      email: true,
      website: true,
      motto: true,
      logoUrl: true,
      principalName: true,
      settings: true,
      isConfigured: true,
      updatedAt: true,
    },
  });
  clearSingleSchoolCache();
  res.json({ success: true, data: school });
});

export default router;
