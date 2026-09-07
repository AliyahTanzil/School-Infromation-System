import * as service from '../../../application/services/timetableService.js';
import * as rooms from '../../../application/services/timetableRoomService.js';
export const options = async (req, res) =>
  res.json({ data: await service.getTimetableOptions(req.schoolContext) });
export const listRooms = async (req, res) =>
  res.json({ data: await rooms.listTimetableRooms(req.schoolContext) });
export const createRoom = async (req, res) =>
  res
    .status(201)
    .json({ data: await rooms.createTimetableRoom({ ...req.body, ...req.schoolContext }) });
export const updateRoom = async (req, res) =>
  res.json({
    data: await rooms.updateTimetableRoom({ ...req.body, ...req.schoolContext, id: req.params.id }),
  });
export const removeRoom = async (req, res) => {
  await rooms.removeTimetableRoom({ ...req.schoolContext, id: req.params.id });
  return res.status(204).send();
};
import * as availabilityService from '../../../application/services/teacherAvailabilityService.js';
export const listTeacherAvailability = async (req, res) =>
  res.json({
    data: await availabilityService.listTeacherAvailability(
      req.schoolContext,
      req.params.teacherId
    ),
  });
export const createTeacherAvailability = async (req, res) =>
  res.status(201).json({
    data: await availabilityService.createTeacherAvailability({
      ...req.body,
      ...req.schoolContext,
      teacherId: req.params.teacherId,
    }),
  });
export const updateTeacherAvailability = async (req, res) =>
  res.json({
    data: await availabilityService.updateTeacherAvailability({
      ...req.body,
      ...req.schoolContext,
      teacherId: req.params.teacherId,
      id: req.params.id,
    }),
  });
export const removeTeacherAvailability = async (req, res) => {
  await availabilityService.removeTeacherAvailability({
    ...req.schoolContext,
    teacherId: req.params.teacherId,
    id: req.params.id,
  });
  return res.status(204).send();
};
export const listSubjectPeriodRequirements = async (req, res) =>
  res.json({
    data: await service.listSubjectPeriodRequirements(
      req.schoolContext,
      req.validatedQuery ?? req.query
    ),
  });
export const createSubjectPeriodRequirement = async (req, res) =>
  res.status(201).json({
    data: await service.createSubjectPeriodRequirement({ ...req.body, ...req.schoolContext }),
  });
export const updateSubjectPeriodRequirement = async (req, res) =>
  res.json({
    data: await service.updateSubjectPeriodRequirement({
      ...req.body,
      ...req.schoolContext,
      id: req.params.id,
    }),
  });
export const removeSubjectPeriodRequirement = async (req, res) => {
  await service.removeSubjectPeriodRequirement({ ...req.schoolContext, id: req.params.id });
  return res.status(204).send();
};
export const list = async (req, res) =>
  res.json({ data: await service.listTimetables(req.schoolContext) });
export const create = async (req, res) =>
  res.status(201).json({
    data: await service.createTimetable({
      ...req.schoolContext,
      actorId: req.user.id,
      ...req.body,
    }),
  });
export const addEntry = async (req, res) =>
  res.status(201).json({
    data: await service.addEntry({
      ...req.schoolContext,
      timetableId: req.params.id,
      actorId: req.user.id,
      data: req.body,
    }),
  });
export const changeStatus = async (req, res) =>
  res.json({
    data: await service.changeStatus({
      ...req.schoolContext,
      timetableId: req.params.id,
      actorId: req.user.id,
      status: req.body.status,
    }),
  });
export const createSubstitution = async (req, res) =>
  res.status(201).json({
    data: await service.createSubstitution({
      ...req.schoolContext,
      timetableId: req.params.id,
      createdBy: req.user.id,
      ...req.body,
    }),
  });
export const settings = async (req, res) =>
  res.json({ data: await service.getTimetableSettings(req.schoolContext) });
export const updateSettings = async (req, res) =>
  res.json({
    data: await service.upsertTimetableSettings({
      ...req.schoolContext,
      ...req.body,
    }),
  });
export const generatedSlots = async (req, res) =>
  res.json({ data: await service.generateSlotsFromSettings(req.schoolContext) });
export const readiness = async (req, res) =>
  res.json({
    data: await service.getTimetableReadiness({
      ...req.schoolContext,
      timetableId: req.params.id,
    }),
  });
export const generateSlots = async (req, res) =>
  res.json({
    data: await service.generateSlotsForTimetable({
      ...req.schoolContext,
      timetableId: req.params.id,
      actorId: req.user.id,
    }),
  });
export const generateSchedule = async (req, res) =>
  res.json({
    data: await service.generateCompleteSchedule({
      ...req.schoolContext,
      timetableId: req.params.id,
      actorId: req.user.id,
    }),
  });
export const listTeachingAssignments = async (req, res) =>
  res.json({
    data: await service.listTeachingAssignments(req.schoolContext, req.validatedQuery ?? req.query),
  });
export const createTeachingAssignment = async (req, res) =>
  res.status(201).json({
    data: await service.createTeachingAssignment({
      ...req.schoolContext,
      ...req.body,
    }),
  });
export const updateTeachingAssignment = async (req, res) =>
  res.json({
    data: await service.updateTeachingAssignment({
      ...req.schoolContext,
      id: req.params.id,
      ...req.body,
    }),
  });
export const removeTeachingAssignment = async (req, res) => {
  await service.removeTeachingAssignment({ ...req.schoolContext, id: req.params.id });
  return res.status(204).send();
};
export const teacherWorkload = async (req, res) =>
  res.json({
    data: await service.getTeacherWorkload(
      req.schoolContext,
      req.params.teacherId,
      req.validatedQuery ?? req.query
    ),
  });

export const updateEntry = async (req, res) =>
  res.json({
    data: await service.updateEntry({
      ...req.schoolContext,
      timetableId: req.params.id,
      entryId: req.params.entryId,
      actorId: req.user.id,
      data: req.body,
    }),
  });
