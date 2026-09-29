import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMine } from '@/src/api/awards';

const get = vi.hoisted(() => vi.fn());

vi.mock('@/src/api/client', () => ({
  apiClient: { get },
}));

describe('GET /auth/me/awards', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('returns the page and forwards cursor and limit', async () => {
    const page = {
      awards: [
        {
          id: 'award-1',
          type: 'zone_first',
          zoneId: '8811aa',
          createdAt: '2026-09-28T00:00:00.000Z',
        },
      ],
      nextCursor: 'cursor-2',
    };
    get.mockResolvedValue({ data: page });

    await expect(getMine({ cursor: 'cursor-1', limit: 20 })).resolves.toEqual(page);
    expect(get).toHaveBeenCalledWith('/auth/me/awards', {
      params: { cursor: 'cursor-1', limit: 20 },
    });
  });

  it('requests the first page without a cursor', async () => {
    get.mockResolvedValue({ data: { awards: [], nextCursor: null } });

    await getMine();

    expect(get).toHaveBeenCalledWith('/auth/me/awards', { params: undefined });
  });
});
