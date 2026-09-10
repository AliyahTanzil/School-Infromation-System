const listeners = new Set();
const setupResource = /^\/(schools|academic-periods|classes|users|subjects|students)(\/|$)/;

export function subscribeSetupChanges(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifySetupChanges(response) {
  const method = response.config?.method?.toLowerCase();
  const path = response.config?.url?.split('?')[0];
  if (['post', 'put', 'patch', 'delete'].includes(method) && setupResource.test(path ?? '')) {
    listeners.forEach((listener) => listener());
  }
  return response;
}
