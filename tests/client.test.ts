import { describe, it, expect, vi } from 'vitest';
import { ArchivistClient, ArchivistApiError } from '../src';

describe('ArchivistClient', () => {
  it('throws an error if apiKey is not provided', () => {
    expect(() => new ArchivistClient({ apiKey: '' })).toThrow('requires an apiKey');
  });

  it('attaches x-api-key header and calls correct endpoints', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ id: 'camp_1', title: 'Curse of Strahd', system: '5e' }],
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      }),
    });

    const client = new ArchivistClient({
      apiKey: 'test-api-key-123',
      fetchFn: mockFetch as any,
    });

    const res = await client.campaigns.list({ page: 1, size: 5 });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.myarchivist.ai/v1/campaigns?page=1&size=5');
    expect(init.headers['x-api-key']).toBe('test-api-key-123');
    expect(init.headers['Accept']).toBe('application/json');
    expect(res.data[0].title).toBe('Curse of Strahd');
  });

  it('creates a character via POST with JSON body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'char_100',
        character_name: 'Thorin',
        type: 'PC',
        campaign_id: 'camp_1',
      }),
    });

    const client = new ArchivistClient({
      apiKey: 'key-abc',
      fetchFn: mockFetch as any,
    });

    const created = await client.characters.create({
      campaign_id: 'camp_1',
      character_name: 'Thorin',
      type: 'PC',
      description: 'Dwarven fighter',
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.myarchivist.ai/v1/characters');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({
      campaign_id: 'camp_1',
      character_name: 'Thorin',
      type: 'PC',
      description: 'Dwarven fighter',
    });
    expect(created.id).toBe('char_100');
  });

  it('creates and lists items properly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ id: 'item_1', name: 'Sunblade', campaign_id: 'camp_1' }],
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      }),
    });

    const client = new ArchivistClient({
      apiKey: 'key-abc',
      fetchFn: mockFetch as any,
    });

    const items = await client.items.list({ campaign_id: 'camp_1' });
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.myarchivist.ai/v1/items?campaign_id=camp_1&with_links=true');
    expect(items.data[0].name).toBe('Sunblade');
  });

  it('handles API errors properly with ArchivistApiError', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      json: async () => ({ detail: 'image must be an HTTPS URL' }),
    });

    const client = new ArchivistClient({
      apiKey: 'key-abc',
      fetchFn: mockFetch as any,
    });

    await expect(
      client.characters.create({
        campaign_id: 'camp_1',
        character_name: 'Invalid',
        type: 'PC',
        image: 'http://insecure.com/img.png',
      })
    ).rejects.toThrow(ArchivistApiError);

    try {
      await client.characters.create({
        campaign_id: 'camp_1',
        character_name: 'Invalid',
        type: 'PC',
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(ArchivistApiError);
      expect(err.status).toBe(422);
      expect(err.detail).toBe('image must be an HTTPS URL');
    }
  });
});
