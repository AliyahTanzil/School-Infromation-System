import * as service from '../../../application/services/libraryService.js';
const scope = (req) => ({
  tenantId: req.schoolContext.tenantId,
  schoolId: req.schoolContext.schoolId,
  actorId: req.user?.id,
});
export const createLibrary = async (req, res) =>
  res.status(201).json({ data: await service.createLibrary(scope(req), req.body) });
export const overview = async (req, res) =>
  res.json({ data: await service.overview(scope(req), req.params.libraryId) });
export const books = async (req, res) =>
  res.json({ data: await service.searchBooks(scope(req), req.params.libraryId, req.query.q) });
export const addBook = async (req, res) =>
  res.status(201).json({ data: await service.addBook(scope(req), req.params.libraryId, req.body) });
export const addCopy = async (req, res) =>
  res.status(201).json({
    data: await service.addCopy(scope(req), req.params.libraryId, req.params.bookId, req.body),
  });
export const loans = async (req, res) =>
  res.json({ data: await service.listLoans(scope(req), req.params.libraryId) });
export const borrow = async (req, res) =>
  res.status(201).json({ data: await service.borrow(scope(req), req.params.libraryId, req.body) });
export const returnLoan = async (req, res) =>
  res.json({ data: await service.returnLoan(scope(req), req.params.libraryId, req.params.loanId) });
