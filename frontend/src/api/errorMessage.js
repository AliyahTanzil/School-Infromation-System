export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const value = error?.response?.data?.error;
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return value.message || value.code || fallback;
  return error?.message || fallback;
}
