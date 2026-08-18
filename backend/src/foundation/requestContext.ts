import type { Request } from 'express';

export type RequestContext = {
  requestId: string;
  startedAt: number;
  method: string;
  path: string;
  ip: string | undefined;
};

export const getRequestContext = (request: Request): RequestContext => ({
  requestId: request.header('x-request-id') ?? crypto.randomUUID(),
  startedAt: Date.now(),
  method: request.method,
  path: request.originalUrl,
  ip: request.ip,
});
