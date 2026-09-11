import { unprocessable } from '../lib/errors.js';

/// validate({ body: schema, query: schema, params: schema })
export const validate = (schemas) => (req, _res, next) => {
  for (const key of ['body', 'query', 'params']) {
    if (!schemas[key]) continue;
    const result = schemas[key].safeParse(req[key]);
    if (!result.success) {
      return next(unprocessable('Validation failed', result.error.issues.map((i) => ({
        field: i.path.join('.'), message: i.message,
      }))));
    }
    if (key === 'query') Object.assign(req.query, result.data);
    else req[key] = result.data;
  }
  next();
};
