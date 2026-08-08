import ValidationError from '../../shared/errors/ValidationError.js';

/**
 * Request validation middleware factory.
 *
 * Accepts a Zod schema shaped as `{ body?, query?, params? }`, validates the
 * matching parts of the request, and replaces them with the parsed (coerced,
 * trimmed, defaulted) values. On failure it throws a ValidationError which the
 * global error handler renders into the standard error envelope.
 *
 * @param {import('zod').ZodTypeAny} schema
 */
export default function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.').replace(/^(body|query|params)\.?/, ''),
        code: issue.code,
        message: issue.message,
      }));
      throw new ValidationError('Request validation failed', details);
    }

    if (result.data.body !== undefined) req.body = result.data.body;
    if (result.data.params !== undefined) req.params = result.data.params;
    // req.query is a getter-only in some Express versions; assign defensively.
    if (result.data.query !== undefined) {
      try {
        req.query = result.data.query;
      } catch {
        req.validatedQuery = result.data.query;
      }
    }

    next();
  };
}
