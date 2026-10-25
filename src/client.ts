import {
  Campaign,
  CampaignStats,
  Character,
  CharacterCard,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  ListCharactersParams,
  Item,
  CreateItemRequest,
  UpdateItemRequest,
  ListItemsParams,
  GameSession,
  GameSessionDetail,
  UpdateSessionRequest,
  ListSessionsParams,
  Beat,
  BeatHierarchyRead,
  Moment,
  MomentCard,
  Faction,
  Location,
  Quest,
  AskRequest,
  AskResponse,
  AskQuotaResponse,
  PaginatedResponse,
  PaginationParams,
} from './types';

export class ArchivistApiError extends Error {
  public status: number;
  public detail?: string;

  constructor(status: number, message: string, detail?: string) {
    super(`Archivist API error (${status}): ${detail || message}`);
    this.name = 'ArchivistApiError';
    this.status = status;
    this.detail = detail;
  }
}

export interface ArchivistClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

function resolveFetch(customFetch?: typeof fetch): typeof fetch {
  if (customFetch) return customFetch;
  if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    return window.fetch.bind(window);
  }
  throw new Error('No fetch implementation available. Pass options.fetchFn or use in a Node 18+ / browser environment.');
}

export class ArchivistClient {
  private apiKey: string;
  private baseUrl: string;
  private fetchFn: typeof fetch;

  constructor(options: ArchivistClientOptions) {
    if (!options.apiKey) {
      throw new Error('ArchivistClient requires an apiKey');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'https://api.myarchivist.ai').replace(/\/+$/, '');
    this.fetchFn = resolveFetch(options.fetchFn);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      'x-api-key': this.apiKey,
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await this.fetchFn.call(globalThis, url, { ...options, headers });

    if (!response.ok) {
      let detail = '';
      try {
        const errorJson = await response.json();
        detail = errorJson.detail || JSON.stringify(errorJson);
      } catch {
        detail = await response.text().catch(() => '');
      }
      throw new ArchivistApiError(response.status, response.statusText, detail);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
  }

  // -------------------------------------------------------------------------
  // Campaigns
  // -------------------------------------------------------------------------

  public campaigns = {
    list: (params?: PaginationParams): Promise<PaginatedResponse<Campaign>> => {
      const q = new URLSearchParams();
      if (params?.page !== undefined) q.set('page', String(params.page));
      if (params?.size !== undefined) q.set('size', String(params.size));
      const qs = q.toString() ? `?${q.toString()}` : '';
      return this.request<PaginatedResponse<Campaign>>(`/v1/campaigns${qs}`);
    },

    get: (id: string): Promise<Campaign> => {
      return this.request<Campaign>(`/v1/campaigns/${encodeURIComponent(id)}`);
    },

    stats: (id: string): Promise<CampaignStats> => {
      return this.request<CampaignStats>(`/v1/campaigns/${encodeURIComponent(id)}/stats`);
    },
  };

  // -------------------------------------------------------------------------
  // Characters
  // -------------------------------------------------------------------------

  public characters = {
    list: (params: ListCharactersParams): Promise<PaginatedResponse<Character> | PaginatedResponse<CharacterCard>> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      if (params.page !== undefined) q.set('page', String(params.page));
      if (params.size !== undefined) q.set('size', String(params.size));
      if (params.type) q.set('type', params.type);
      if (params.fields) q.set('fields', params.fields);
      return this.request<PaginatedResponse<Character>>(`/v1/characters?${q.toString()}`);
    },

    get: (id: string): Promise<Character> => {
      return this.request<Character>(`/v1/characters/${encodeURIComponent(id)}`);
    },

    create: (payload: CreateCharacterRequest): Promise<Character> => {
      return this.request<Character>('/v1/characters', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    update: (id: string, payload: UpdateCharacterRequest): Promise<Character> => {
      return this.request<Character>(`/v1/characters/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },

    delete: (id: string): Promise<void> => {
      return this.request<void>(`/v1/characters/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  };

  // -------------------------------------------------------------------------
  // Items
  // -------------------------------------------------------------------------

  public items = {
    list: (params: ListItemsParams): Promise<PaginatedResponse<Item>> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      if (params.page !== undefined) q.set('page', String(params.page));
      if (params.size !== undefined) q.set('size', String(params.size));
      return this.request<PaginatedResponse<Item>>(`/v1/items?${q.toString()}`);
    },

    get: (id: string): Promise<Item> => {
      return this.request<Item>(`/v1/items/${encodeURIComponent(id)}`);
    },

    create: (payload: CreateItemRequest): Promise<Item> => {
      return this.request<Item>('/v1/items', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    update: (id: string, payload: UpdateItemRequest): Promise<Item> => {
      return this.request<Item>(`/v1/items/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },

    delete: (id: string): Promise<void> => {
      return this.request<void>(`/v1/items/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  };

  // -------------------------------------------------------------------------
  // Sessions
  // -------------------------------------------------------------------------

  public sessions = {
    list: (params: ListSessionsParams): Promise<PaginatedResponse<GameSession>> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      if (params.page !== undefined) q.set('page', String(params.page));
      if (params.size !== undefined) q.set('size', String(params.size));
      return this.request<PaginatedResponse<GameSession>>(`/v1/sessions?${q.toString()}`);
    },

    get: (id: string): Promise<GameSessionDetail> => {
      return this.request<GameSessionDetail>(`/v1/sessions/${encodeURIComponent(id)}`);
    },

    update: (id: string, payload: UpdateSessionRequest): Promise<GameSession> => {
      return this.request<GameSession>(`/v1/sessions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
  };

  // -------------------------------------------------------------------------
  // Beats & Moments
  // -------------------------------------------------------------------------

  public beats = {
    list: (params: { session_id?: string; campaign_id?: string; include_hierarchy?: boolean }): Promise<Beat[] | BeatHierarchyRead[]> => {
      const q = new URLSearchParams();
      if (params.session_id) q.set('session_id', params.session_id);
      if (params.campaign_id) q.set('campaign_id', params.campaign_id);
      if (params.include_hierarchy) q.set('include_hierarchy', 'true');
      return this.request<Beat[]>(`/v1/beats?${q.toString()}`);
    },

    get: (id: string): Promise<Beat> => {
      return this.request<Beat>(`/v1/beats/${encodeURIComponent(id)}`);
    },
  };

  public moments = {
    list: (params: { session_id?: string; campaign_id?: string; fields?: 'card' } & PaginationParams): Promise<PaginatedResponse<Moment> | PaginatedResponse<MomentCard>> => {
      const q = new URLSearchParams();
      if (params.session_id) q.set('session_id', params.session_id);
      if (params.campaign_id) q.set('campaign_id', params.campaign_id);
      if (params.fields) q.set('fields', params.fields);
      if (params.page !== undefined) q.set('page', String(params.page));
      if (params.size !== undefined) q.set('size', String(params.size));
      return this.request<PaginatedResponse<Moment>>(`/v1/moments?${q.toString()}`);
    },

    get: (id: string): Promise<Moment> => {
      return this.request<Moment>(`/v1/moments/${encodeURIComponent(id)}`);
    },
  };

  // -------------------------------------------------------------------------
  // Factions, Locations & Quests
  // -------------------------------------------------------------------------

  public factions = {
    list: (params: { campaign_id: string } & PaginationParams): Promise<PaginatedResponse<Faction>> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      if (params.page !== undefined) q.set('page', String(params.page));
      if (params.size !== undefined) q.set('size', String(params.size));
      return this.request<PaginatedResponse<Faction>>(`/v1/factions?${q.toString()}`);
    },

    get: (id: string): Promise<Faction> => {
      return this.request<Faction>(`/v1/factions/${encodeURIComponent(id)}`);
    },
  };

  public locations = {
    list: (params: { campaign_id: string } & PaginationParams): Promise<PaginatedResponse<Location>> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      if (params.page !== undefined) q.set('page', String(params.page));
      if (params.size !== undefined) q.set('size', String(params.size));
      return this.request<PaginatedResponse<Location>>(`/v1/locations?${q.toString()}`);
    },

    get: (id: string): Promise<Location> => {
      return this.request<Location>(`/v1/locations/${encodeURIComponent(id)}`);
    },
  };

  public quests = {
    list: (params: { campaign_id: string } & PaginationParams): Promise<PaginatedResponse<Quest>> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      if (params.page !== undefined) q.set('page', String(params.page));
      if (params.size !== undefined) q.set('size', String(params.size));
      return this.request<PaginatedResponse<Quest>>(`/v1/quests?${q.toString()}`);
    },

    get: (id: string): Promise<Quest> => {
      return this.request<Quest>(`/v1/quests/${encodeURIComponent(id)}`);
    },
  };

  // -------------------------------------------------------------------------
  // Ask (RAG)
  // -------------------------------------------------------------------------

  public ask = {
    query: (payload: AskRequest): Promise<AskResponse> => {
      return this.request<AskResponse>('/v1/ask', {
        method: 'POST',
        body: JSON.stringify({ ...payload, stream: false }),
      });
    },

    quota: (): Promise<AskQuotaResponse> => {
      return this.request<AskQuotaResponse>('/v1/ask/quota');
    },
  };
}
