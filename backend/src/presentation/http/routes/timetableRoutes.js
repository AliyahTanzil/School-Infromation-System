import { Router } from 'express';
import authenticate from '../../../middleware/auth/authenticate.js';
import authorize from '../../../middleware/auth/authorize.js';
import teacherContext from '../../../middleware/auth/teacherContext.js';
import validate from '../../../middleware/validation/validate.js';
import * as controller from '../controllers/timetableController.js';
import {
  createTimetableSchema,
  entrySchema,
  entryUpdateSchema,
  statusSchema,
  substitutionSchema,
  timetableSettingsSchema,
  teachingAssignmentIdSchema,
  teachingAssignmentQuerySchema,
  teachingAssignmentSchema,
  teachingAssignmentUpdateSchema,
  subjectPeriodSchema,
  subjectPeriodUpdateSchema,
  subjectPeriodIdSchema,
  subjectPeriodQuerySchema,
  teacherAvailabilityListSchema,
  teacherAvailabilitySchema,
  teacherAvailabilityUpdateSchema,
  teacherAvailabilityIdSchema,
  timetableRoomSchema,
  timetableRoomUpdateSchema,
} from '../../../application/validators/timetableValidators.js';
const router = Router();
router.use(authenticate, teacherContext, authorize('PLATFORM_ADMIN', 'SCHOOL_ADMIN'));
router.get('/settings', controller.settings);
router.get('/options', controller.options);
router.get('/rooms', controller.listRooms);
router.post('/rooms', validate(timetableRoomSchema), controller.createRoom);
router.patch('/rooms/:id', validate(timetableRoomUpdateSchema), controller.updateRoom);
router.delete('/rooms/:id', validate(subjectPeriodIdSchema), controller.removeRoom);
router.put('/settings', validate(timetableSettingsSchema), controller.updateSettings);
router.get('/generated-slots', controller.generatedSlots);
router.get(
  '/teachers/:teacherId/availability',
  validate(teacherAvailabilityListSchema),
  controller.listTeacherAvailability
);
router.post(
  '/teachers/:teacherId/availability',
  validate(teacherAvailabilitySchema),
  controller.createTeacherAvailability
);
router.patch(
  '/teachers/:teacherId/availability/:id',
  validate(teacherAvailabilityUpdateSchema),
  controller.updateTeacherAvailability
);
router.delete(
  '/teachers/:teacherId/availability/:id',
  validate(teacherAvailabilityIdSchema),
  controller.removeTeacherAvailability
);
router.get(
  '/subject-period-requirements',
  validate(subjectPeriodQuerySchema),
  controller.listSubjectPeriodRequirements
);
router.post(
  '/subject-period-requirements',
  validate(subjectPeriodSchema),
  controller.createSubjectPeriodRequirement
);
router.patch(
  '/subject-period-requirements/:id',
  validate(subjectPeriodUpdateSchema),
  controller.updateSubjectPeriodRequirement
);
router.delete(
  '/subject-period-requirements/:id',
  validate(subjectPeriodIdSchema),
  controller.removeSubjectPeriodRequirement
);
router.get(
  '/teaching-assignments',
  validate(teachingAssignmentQuerySchema),
  controller.listTeachingAssignments
);
router.post(
  '/teaching-assignments',
  validate(teachingAssignmentSchema),
  controller.createTeachingAssignment
);
router.patch(
  '/teaching-assignments/:id',
  validate(teachingAssignmentUpdateSchema),
  controller.updateTeachingAssignment
);
router.delete(
  '/teaching-assignments/:id',
  validate(teachingAssignmentIdSchema),
  controller.removeTeachingAssignment
);
router.get(
  '/teachers/:teacherId/workload',
  validate(teachingAssignmentQuerySchema),
  controller.teacherWorkload
);
router.get('/', controller.list);
router.post('/', validate(createTimetableSchema), controller.create);
router.get('/:id/readiness', validate(teachingAssignmentIdSchema), controller.readiness);
router.post('/:id/generate-slots', controller.generateSlots);
router.post('/:id/generate-schedule', controller.generateSchedule);
router.post('/:id/entries', validate(entrySchema), controller.addEntry);
router.patch('/:id/entries/:entryId', validate(entryUpdateSchema), controller.updateEntry);
router.patch('/:id/status', validate(statusSchema), controller.changeStatus);
router.post('/:id/substitutions', validate(substitutionSchema), controller.createSubstitution);
export default router;
