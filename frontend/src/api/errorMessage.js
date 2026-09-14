export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const value = error?.response?.data?.error;
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const message = value.message || value.code || fallback;
    if (value.code === 'VALIDATION_ERROR' && Array.isArray(value.details)) {
      const details = value.details
        .filter((detail) => typeof detail?.message === 'string')
        .map((detail) => [detail.path, detail.message].filter(Boolean).join(': '));
      if (details.length) return `${message}: ${details.join('; ')}`;
    }
    return message;
  }
  return error?.message || fallback;
}
