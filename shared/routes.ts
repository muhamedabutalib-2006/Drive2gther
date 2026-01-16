import { z } from 'zod';
import { initRequestSchema, playRequestSchema, navigateRequestSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    error: z.string(),
  }),
  notFound: z.object({
    error: z.string(),
  }),
  internal: z.object({
    error: z.string(),
  }),
};

export const api = {
  init: {
    method: 'POST' as const,
    path: '/api/init',
    input: initRequestSchema,
    responses: {
      200: z.object({
        roomId: z.string(),
        episodes: z.array(z.object({ id: z.string(), name: z.string() })),
        currentIndex: z.number(),
      }),
      400: errorSchemas.validation,
      404: errorSchemas.notFound,
      500: errorSchemas.internal,
    },
  },
  state: {
    method: 'GET' as const,
    path: '/api/state',
    responses: {
      200: z.object({
        roomId: z.string().nullable(),
        episodes: z.array(z.object({ id: z.string(), name: z.string() })),
        currentIndex: z.number(),
      }),
    },
  },
  play: {
    method: 'POST' as const,
    path: '/api/play',
    input: playRequestSchema,
    responses: {
      200: z.object({
        currentIndex: z.number(),
        episode: z.object({ id: z.string(), name: z.string() }),
      }),
      400: errorSchemas.validation,
      500: errorSchemas.internal,
    },
  },
  navigate: {
    method: 'POST' as const,
    path: '/api/navigate',
    input: navigateRequestSchema,
    responses: {
      200: z.object({
        currentIndex: z.number(),
        episode: z.object({ id: z.string(), name: z.string() }),
      }),
      400: errorSchemas.validation,
      500: errorSchemas.internal,
    },
  },
  newRoom: {
    method: 'POST' as const,
    path: '/api/new-room',
    responses: {
      200: z.object({
        roomId: z.string(),
      }),
      500: errorSchemas.internal,
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type InitInput = z.infer<typeof api.init.input>;
export type InitResponse = z.infer<typeof api.init.responses[200]>;
export type StateResponse = z.infer<typeof api.state.responses[200]>;
export type PlayInput = z.infer<typeof api.play.input>;
export type PlayResponse = z.infer<typeof api.play.responses[200]>;
export type NavigateInput = z.infer<typeof api.navigate.input>;
export type NavigateResponse = z.infer<typeof api.navigate.responses[200]>;
export type NewRoomResponse = z.infer<typeof api.newRoom.responses[200]>;
