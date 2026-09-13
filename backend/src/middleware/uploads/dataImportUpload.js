import multer from 'multer';
import ValidationError from '../../shared/errors/ValidationError.js';

const ALLOWED_EXTENSIONS = /\.(csv|tsv|json|xlsx|xls)$/i;

/**
 * In-memory upload for data-import files. Spreadsheet MIME types vary by browser and
 * OS, so the file extension is the authoritative check.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (ALLOWED_EXTENSIONS.test(file.originalname)) {
      callback(null, true);
      return;
    }
    callback(
      new ValidationError('Unsupported file type. Upload a .csv, .tsv, .json, .xlsx, or .xls file')
    );
  },
});

export default upload.single('file');
