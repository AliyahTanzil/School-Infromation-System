import { createApp as createFoundationApp, isCorsOriginAllowed } from '../foundation/app.js';

export { isCorsOriginAllowed };

export function createApp(...args) {
  return createFoundationApp(...args);
}

export default createApp;
