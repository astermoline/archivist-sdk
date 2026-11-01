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
  JournalEntry,
  JournalEntryCard,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
  ListJournalsParams,
  GetJournalParams,
  JournalFolder,
  CreateJournalFolderRequest,
  UpdateJournalFolderRequest,
  JournalTreeNode,
  GameSession,
  GameSessionDetail,
  UpdateSessionRequest,
  ListSessionsParams,
  SessionTranscriptParams,
  Beat,
  BeatHierarchyRead,
  Moment,
  MomentCard,
  Faction,
  ListFactionsParams,
  Location,
  ListLocationsParams,
  Quest,
  ListQuestsParams,
  AskRequest,
  AskResponse,
  AskQuotaResponse,
  PaginatedResponse,
  PaginationParams,
} from "./types";

export class ArchivistApiError extends Error {
  public status: number;
  public detail?: string;

  constructor(status: number, message: string, detail?: string) {
    super(`Archivist API error (${status}): ${detail || message}`);
    this.name = "ArchivistApiError";
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
  if (typeof globalThis !== "undefined" && typeof globalThis.fetch === "function") {
    return globalThis.fetch.bind(globalThis);
  }
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    return window.fetch.bind(window);
  }
  throw new Error("No fetch implementation available. Pass options.fetchFn or use in a Node 18+ / browser environment.");
}

export class ArchivistClient {
  private apiKey: string;
  private baseUrl: string;
  private fetchFn: typeof fetch;

  constructor(options: ArchivistClientOptions) {
    if (!options.apiKey) {
      throw new Error("ArchivistClient requires an apiKey");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || "https://api.myarchivist.ai").replace(/\/+$/, "");
    this.fetchFn = resolveFetch(options.fetchFn);
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
      Accept: "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.body && typeof options.body === "string" && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await this.fetchFn.call(globalThis, url, { ...options, headers });

    if (!response.ok) {
      let detail = "";
      try {
        const errorJson = await response.json();
        detail = errorJson.detail || JSON.stringify(errorJson);
      } catch {
        detail = await response.text().catch(() => "");
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
      if (params?.page !== undefined) q.set("page", String(params.page));
      if (params?.size !== undefined) q.set("size", String(params.size));
      const qs = q.toString() ? `?${q.toString()}` : "";
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
      if (params.page !== undefined) q.set("page", String(params.page));
      if (params.size !== undefined) q.set("size", String(params.size));
      if (params.type) q.set("type", params.type);
      if (params.fields) q.set("fields", params.fields);
      q.set("with_links", params.with_links !== undefined ? String(params.with_links) : "true");
      return this.request<PaginatedResponse<Character>>(`/v1/characters?${q.toString()}`);
    },

    get: (id: string, params?: { with_links?: boolean }): Promise<Character> => {
      const q = new URLSearchParams();
      q.set("with_links", params?.with_links !== undefined ? String(params.with_links) : "true");
      return this.request<Character>(`/v1/characters/${encodeURIComponent(id)}?${q.toString()}`);
    },

    create: (payload: CreateCharacterRequest): Promise<Character> => {
      return this.request<Character>("/v1/characters", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    update: (id: string, payload: UpdateCharacterRequest): Promise<Character> => {
      return this.request<Character>(`/v1/characters/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    delete: (id: string): Promise<void> => {
      return this.request<void>(`/v1/characters/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  };

  // -------------------------------------------------------------------------
  // Items
  // -------------------------------------------------------------------------

  public items = {
    list: (params: ListItemsParams): Promise<PaginatedResponse<Item>> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      if (params.page !== undefined) q.set("page", String(params.page));
      if (params.size !== undefined) q.set("size", String(params.size));
      q.set("with_links", params.with_links !== undefined ? String(params.with_links) : "true");
      return this.request<PaginatedResponse<Item>>(`/v1/items?${q.toString()}`);
    },

    get: (id: string, params?: { with_links?: boolean }): Promise<Item> => {
      const q = new URLSearchParams();
      q.set("with_links", params?.with_links !== undefined ? String(params.with_links) : "true");
      return this.request<Item>(`/v1/items/${encodeURIComponent(id)}?${q.toString()}`);
    },

    create: (payload: CreateItemRequest): Promise<Item> => {
      return this.request<Item>("/v1/items", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    update: (id: string, payload: UpdateItemRequest): Promise<Item> => {
      return this.request<Item>(`/v1/items/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    delete: (id: string): Promise<void> => {
      return this.request<void>(`/v1/items/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  };

  // -------------------------------------------------------------------------
  // Journals
  // -------------------------------------------------------------------------

  public journals = {
    list: async (params: ListJournalsParams): Promise<PaginatedResponse<JournalEntry>> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      if (params.page !== undefined) q.set("page", String(params.page));
      if (params.size !== undefined) q.set("size", String(params.size));
      if (params.fields) q.set("fields", params.fields);
      if (params.format) q.set("format", params.format);
      if (params.with_links !== undefined) q.set("with_links", String(params.with_links));
      const res = await this.request<any>(`/v1/journals?${q.toString()}`);
      if (Array.isArray(res)) {
        return {
          data: res,
          total: res.length,
          page: params.page ?? 1,
          size: params.size ?? res.length,
          pages: 1,
        };
      }
      return res;
    },

    get: async (id: string, params?: GetJournalParams): Promise<JournalEntry> => {
      const q = new URLSearchParams();
      if (params?.with_links !== undefined) q.set("with_links", String(params.with_links));
      if (params?.format) q.set("format", params.format);
      const qs = q.toString() ? `?${q.toString()}` : "";
      const res = await this.request<any>(`/v1/journals/${encodeURIComponent(id)}${qs}`);
      return (res && typeof res === "object" && "entry" in res && res.entry) ? res.entry : res;
    },

    /**
     * Convenience helper to fetch a journal entry formatted as Markdown.
     * Sets format=markdown and with_links=true by default so headings,
     * pipe tables, and [[wikilinks]] are returned intact.
     * Returns the markdown content string.
     */
    getMarkdown: async (id: string, options?: { withLinks?: boolean }): Promise<string> => {
      const journal = await this.journals.get(id, {
        format: "markdown",
        with_links: options?.withLinks ?? true,
      });
      return journal.content || "";
    },

    create: async (payload: CreateJournalEntryRequest): Promise<JournalEntry> => {
      const body: Record<string, unknown> = { ...payload };
      if (!body.worldId && body.campaign_id) {
        body.worldId = body.campaign_id;
      }
      if (body.contentFormat || body.content_format) {
        const fmt = body.contentFormat || body.content_format;
        body.contentFormat = fmt;
        body.content_format = fmt;
      }
      const res = await this.request<any>("/v1/journals", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return (res && typeof res === "object" && "entry" in res && res.entry) ? res.entry : res;
    },

    /**
     * Convenience helper to create a journal entry with content formatted as Markdown.
     * Automatically sets contentFormat and content_format to markdown.
     */
    createMarkdown: (
      worldId: string,
      title: string,
      markdown: string,
      options?: Partial<Omit<CreateJournalEntryRequest, "worldId" | "title" | "content" | "contentFormat" | "content_format">>
    ): Promise<JournalEntry> => {
      return this.journals.create({
        ...options,
        worldId,
        title,
        content: markdown,
        contentFormat: "markdown",
        content_format: "markdown",
      });
    },

    update: async (
      idOrPayload: string | UpdateJournalEntryRequest,
      payload?: UpdateJournalEntryRequest
    ): Promise<JournalEntry> => {
      const body: Record<string, unknown> = typeof idOrPayload === "string"
        ? { ...(payload || {}), id: idOrPayload }
        : { ...idOrPayload };

      if (body.contentFormat || body.content_format) {
        const fmt = body.contentFormat || body.content_format;
        body.contentFormat = fmt;
        body.content_format = fmt;
      }
      const res = await this.request<any>("/v1/journals", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      return (res && typeof res === "object" && "entry" in res && res.entry) ? res.entry : res;
    },

    /**
     * Convenience helper to update a journal entry with content formatted as Markdown.
     * Automatically sets contentFormat and content_format to markdown.
     */
    updateMarkdown: (
      id: string,
      markdown: string,
      options?: Partial<Omit<UpdateJournalEntryRequest, "id" | "content" | "contentFormat" | "content_format">>
    ): Promise<JournalEntry> => {
      return this.journals.update(id, {
        ...options,
        content: markdown,
        contentFormat: "markdown",
        content_format: "markdown",
      });
    },

    delete: (id: string): Promise<void> => {
      return this.request<void>(`/v1/journals?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },
  };

  // -------------------------------------------------------------------------
  // Journal Folders
  // -------------------------------------------------------------------------

  public journalFolders = {
    list: async (params: { campaign_id: string }): Promise<JournalFolder[]> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      const res = await this.request<any>(`/v1/journal-folders?${q.toString()}`);
      if (Array.isArray(res)) return res;
      return res?.data || res?.folders || [];
    },

    get: async (id: string): Promise<JournalFolder> => {
      const res = await this.request<any>(`/v1/journal-folders/${encodeURIComponent(id)}`);
      return (res && typeof res === "object" && "folder" in res && res.folder) ? res.folder : res;
    },

    create: async (payload: CreateJournalFolderRequest): Promise<JournalFolder> => {
      const body: Record<string, unknown> = { ...payload };
      if (!body.worldId && body.campaign_id) {
        body.worldId = body.campaign_id;
      }
      const res = await this.request<any>("/v1/journal-folders", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return (res && typeof res === "object" && "folder" in res && res.folder) ? res.folder : res;
    },

    update: async (
      idOrPayload: string | UpdateJournalFolderRequest,
      payload?: UpdateJournalFolderRequest
    ): Promise<JournalFolder> => {
      const body: Record<string, unknown> = typeof idOrPayload === "string"
        ? { ...(payload || {}), id: idOrPayload }
        : { ...idOrPayload };
      const res = await this.request<any>("/v1/journal-folders", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      return (res && typeof res === "object" && "folder" in res && res.folder) ? res.folder : res;
    },

    delete: (id: string): Promise<void> => {
      return this.request<void>(`/v1/journal-folders?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    },

    tree: (campaignId: string): Promise<JournalTreeNode[] | any> => {
      return this.request<any>(`/v1/campaigns/${encodeURIComponent(campaignId)}/journal-tree`);
    },

    /**
     * Convenience helper to find an existing folder by name or path,
     * or create it if it does not already exist.
     */
    ensure: async (
      campaignId: string,
      name: string,
      options?: { path?: string; parentId?: string | null; description?: string }
    ): Promise<JournalFolder> => {
      const targetPath = options?.path || `/${name}`;
      const folders = await this.journalFolders.list({ campaign_id: campaignId });
      const existing = folders.find(
        (f) =>
          f.name?.trim().toLowerCase() === name.trim().toLowerCase() ||
          f.path?.trim().toLowerCase() === targetPath.trim().toLowerCase() ||
          f.path?.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (existing) {
        return existing;
      }

      return this.journalFolders.create({
        worldId: campaignId,
        campaign_id: campaignId,
        name,
        path: targetPath,
        parentId: options?.parentId ?? null,
        description: options?.description,
      });
    },
  };

  // -------------------------------------------------------------------------
  // Sessions
  // -------------------------------------------------------------------------

  public sessions = {
    list: (params: ListSessionsParams): Promise<PaginatedResponse<GameSession>> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      if (params.page !== undefined) q.set("page", String(params.page));
      if (params.size !== undefined) q.set("size", String(params.size));
      return this.request<PaginatedResponse<GameSession>>(`/v1/sessions?${q.toString()}`);
    },

    get: (id: string): Promise<GameSessionDetail> => {
      return this.request<GameSessionDetail>(`/v1/sessions/${encodeURIComponent(id)}`);
    },

    update: (id: string, payload: UpdateSessionRequest): Promise<GameSession> => {
      return this.request<GameSession>(`/v1/sessions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    transcript: (id: string, params?: SessionTranscriptParams): Promise<any> => {
      const q = new URLSearchParams();
      if (params?.format) q.set("format", params.format);
      const qs = q.toString() ? `?${q.toString()}` : "";
      return this.request<any>(`/v1/sessions/${encodeURIComponent(id)}/transcript${qs}`);
    },

    /**
     * Convenience helper to fetch a session transcript formatted as Markdown.
     */
    transcriptMarkdown: async (id: string): Promise<string> => {
      const res = await this.sessions.transcript(id, { format: "markdown" });
      if (typeof res === "string") return res;
      return res?.transcript || res?.content || JSON.stringify(res);
    },
  };

  // -------------------------------------------------------------------------
  // Beats & Moments
  // -------------------------------------------------------------------------

  public beats = {
    list: (params: { session_id?: string; campaign_id?: string; include_hierarchy?: boolean }): Promise<Beat[] | BeatHierarchyRead[]> => {
      const q = new URLSearchParams();
      if (params.session_id) q.set("session_id", params.session_id);
      if (params.campaign_id) q.set("campaign_id", params.campaign_id);
      if (params.include_hierarchy) q.set("include_hierarchy", "true");
      return this.request<Beat[]>(`/v1/beats?${q.toString()}`);
    },

    get: (id: string): Promise<Beat> => {
      return this.request<Beat>(`/v1/beats/${encodeURIComponent(id)}`);
    },
  };

  public moments = {
    list: (params: { session_id?: string; campaign_id?: string; fields?: "card" } & PaginationParams): Promise<PaginatedResponse<Moment> | PaginatedResponse<MomentCard>> => {
      const q = new URLSearchParams();
      if (params.session_id) q.set("session_id", params.session_id);
      if (params.campaign_id) q.set("campaign_id", params.campaign_id);
      if (params.fields) q.set("fields", params.fields);
      if (params.page !== undefined) q.set("page", String(params.page));
      if (params.size !== undefined) q.set("size", String(params.size));
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
    list: (params: ListFactionsParams): Promise<PaginatedResponse<Faction>> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      if (params.page !== undefined) q.set("page", String(params.page));
      if (params.size !== undefined) q.set("size", String(params.size));
      if (params.with_links !== undefined) q.set("with_links", String(params.with_links));
      return this.request<PaginatedResponse<Faction>>(`/v1/factions?${q.toString()}`);
    },

    get: (id: string, params?: { with_links?: boolean }): Promise<Faction> => {
      const q = new URLSearchParams();
      if (params?.with_links !== undefined) q.set("with_links", String(params.with_links));
      const qs = q.toString() ? `?${q.toString()}` : "";
      return this.request<Faction>(`/v1/factions/${encodeURIComponent(id)}${qs}`);
    },
  };

  public locations = {
    list: (params: ListLocationsParams): Promise<PaginatedResponse<Location>> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      if (params.page !== undefined) q.set("page", String(params.page));
      if (params.size !== undefined) q.set("size", String(params.size));
      if (params.with_links !== undefined) q.set("with_links", String(params.with_links));
      return this.request<PaginatedResponse<Location>>(`/v1/locations?${q.toString()}`);
    },

    get: (id: string, params?: { with_links?: boolean }): Promise<Location> => {
      const q = new URLSearchParams();
      if (params?.with_links !== undefined) q.set("with_links", String(params.with_links));
      const qs = q.toString() ? `?${q.toString()}` : "";
      return this.request<Location>(`/v1/locations/${encodeURIComponent(id)}${qs}`);
    },
  };

  public quests = {
    list: (params: ListQuestsParams): Promise<PaginatedResponse<Quest>> => {
      const q = new URLSearchParams({ campaign_id: params.campaign_id });
      if (params.page !== undefined) q.set("page", String(params.page));
      if (params.size !== undefined) q.set("size", String(params.size));
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
      return this.request<AskResponse>("/v1/ask", {
        method: "POST",
        body: JSON.stringify({ ...payload, stream: false }),
      });
    },

    quota: (): Promise<AskQuotaResponse> => {
      return this.request<AskQuotaResponse>("/v1/ask/quota");
    },
  };
}
