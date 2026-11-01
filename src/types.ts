export type ID = string;
export type ISODate = string;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
}

// ---------------------------------------------------------------------------
// Campaign
// ---------------------------------------------------------------------------

export interface Campaign {
  id: ID;
  title: string;
  description?: string;
  system: string;
  summary?: string;
  language: string;
  image?: string;
  public: boolean;
  mature: boolean;
  owner_id: ID;
  created_at: ISODate;
  updated_at?: ISODate;
}

export interface CampaignStats {
  campaign_id: ID;
  title: string;
  characters: number;
  sessions: number;
  moments: number;
  public: boolean;
  created_at: ISODate;
}

// ---------------------------------------------------------------------------
// Character
// ---------------------------------------------------------------------------

export type CharacterType = "PC" | "NPC" | "Other";

export interface CharacterPlayer {
  id: ID;
  name?: string;
  handle?: string;
  roles: string[];
  campaign_id: ID;
  created_at: ISODate;
}

export interface CharacterCard {
  id: ID;
  character_name: string;
  type: CharacterType;
  image?: string;
}

/**
 * Character entity.
 * Note: Compendium text fields (description, backstory) support Markdown
 * including tables, code blocks, math ($$...$$), mermaid diagrams, and images.
 */
export interface Character {
  id: ID;
  campaign_id: ID;
  character_name: string;
  character_alias?: string;
  character_aliases: string[];
  player_name?: string | null;
  player_handle?: string;
  player?: CharacterPlayer | null;
  description?: string;
  backstory?: string;
  type: CharacterType;
  image?: string;
  tcg_image?: string;
  merge: boolean;
  created_at: ISODate;
  updated_at?: ISODate;
}

export interface CreateCharacterRequest {
  campaign_id: ID;
  character_name: string;
  character_aliases?: string[];
  character_alias?: string;
  description?: string;
  backstory?: string;
  type: CharacterType;
  image?: string;
  speaker_id?: ID;
}

export interface UpdateCharacterRequest {
  character_name?: string;
  character_aliases?: string[];
  character_alias?: string;
  description?: string;
  backstory?: string;
  type?: CharacterType;
  image?: string;
  speaker_id?: ID;
}

export interface ListCharactersParams extends PaginationParams {
  campaign_id: ID;
  type?: CharacterType;
  fields?: "card";
  with_links?: boolean;
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

/**
 * Item entity.
 * Note: Compendium text fields (description) support Markdown
 * including tables, code blocks, math ($$...$$), mermaid diagrams, and images.
 */
export interface Item {
  id: ID;
  campaign_id: ID;
  name: string;
  aliases: string[];
  description?: string;
  type?: string;
  image?: string;
  tcg_image?: string;
  merge: boolean;
  created_at: ISODate;
  updated_at?: ISODate;
}

export interface CreateItemRequest {
  campaign_id: ID;
  name: string;
  aliases?: string[];
  description?: string;
  type?: string;
  image?: string;
}

export interface UpdateItemRequest {
  name?: string;
  aliases?: string[];
  description?: string;
  type?: string;
  image?: string;
}

export interface ListItemsParams extends PaginationParams {
  campaign_id: ID;
  with_links?: boolean;
}

// ---------------------------------------------------------------------------
// Journal Entries
// ---------------------------------------------------------------------------

export type JournalContentFormat = "plain" | "markdown";
export type JournalFormat = "text" | "markdown";
export type JournalStatus = "draft" | "published" | "archived";

export interface JournalEntry {
  id: ID;
  worldId?: ID;
  campaign_id?: ID;
  title: string;
  summary?: string | null;
  content?: string | null;
  contentFormat?: JournalContentFormat;
  content_format?: JournalContentFormat;
  contentRich?: Record<string, unknown> | null;
  contentMetadata?: Record<string, unknown> | null;
  tags?: string[];
  coverImage?: string | null;
  isPinned?: boolean;
  isPublic?: boolean;
  status?: JournalStatus;
  publishedAt?: ISODate | null;
  archivedAt?: ISODate | null;
  folderId?: string | null;
  authorId?: string | null;
  createdAt?: ISODate;
  updatedAt?: ISODate;
  created_at?: ISODate;
  updated_at?: ISODate;
}

export interface JournalEntryCard {
  id: ID;
  worldId?: ID;
  title: string;
  summary?: string | null;
  coverImage?: string | null;
  isPinned?: boolean;
  isPublic?: boolean;
  status?: JournalStatus;
  folderId?: string | null;
  createdAt?: ISODate;
  updatedAt?: ISODate;
}

export interface CreateJournalEntryRequest {
  worldId?: ID;
  campaign_id?: ID;
  title: string;
  summary?: string | null;
  content?: string | null;
  contentFormat?: JournalContentFormat;
  content_format?: JournalContentFormat;
  contentRich?: Record<string, unknown> | null;
  contentMetadata?: Record<string, unknown> | null;
  tags?: string[];
  coverImage?: string | null;
  isPinned?: boolean;
  isPublic?: boolean;
  status?: JournalStatus;
  publishedAt?: ISODate | null;
  archivedAt?: ISODate | null;
  folderId?: string | null;
}

export interface UpdateJournalEntryRequest {
  id?: ID;
  title?: string | null;
  summary?: string | null;
  content?: string | null;
  contentFormat?: JournalContentFormat;
  content_format?: JournalContentFormat;
  contentRich?: Record<string, unknown> | null;
  contentMetadata?: Record<string, unknown> | null;
  tags?: string[] | null;
  coverImage?: string | null;
  isPinned?: boolean | null;
  isPublic?: boolean | null;
  status?: JournalStatus | null;
  publishedAt?: ISODate | null;
  archivedAt?: ISODate | null;
  folderId?: string | null;
  authorId?: string | null;
  permissions?: Record<string, unknown> | null;
}

export interface ListJournalsParams extends PaginationParams {
  campaign_id: ID;
  with_links?: boolean;
  format?: JournalFormat;
  fields?: "card";
}

export interface GetJournalParams {
  with_links?: boolean;
  format?: JournalFormat;
}

// ---------------------------------------------------------------------------
// Journal Folders
// ---------------------------------------------------------------------------

export interface JournalFolder {
  id: ID;
  worldId?: ID;
  campaign_id?: ID;
  name: string;
  path: string;
  parentId?: string | null;
  description?: string | null;
  position?: number;
  metadata?: Record<string, unknown> | null;
  createdAt?: ISODate;
  updatedAt?: ISODate;
  created_at?: ISODate;
  updated_at?: ISODate;
}

export interface CreateJournalFolderRequest {
  worldId?: ID;
  campaign_id?: ID;
  name: string;
  path: string;
  parentId?: string | null;
  description?: string | null;
  position?: number;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateJournalFolderRequest {
  id?: ID;
  name?: string | null;
  path?: string | null;
  parentId?: string | null;
  description?: string | null;
  position?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface JournalTreeNode {
  id: ID;
  name: string;
  path: string;
  parentId?: string | null;
  type: "folder" | "journal";
  children?: JournalTreeNode[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export type SessionType = "audioUpload" | "playByPost" | "discordVoice" | "txtUpload" | "rawNotes" | "other";
export type TranscriptFormat = "json" | "markdown";

export interface GameSession {
  id: ID;
  campaign_id: ID;
  type: SessionType;
  title: string;
  summary?: string;
  notes?: string;
  session_date: ISODate;
  image?: string;
  index?: number;
  public: boolean;
  pbp_start_msg_url?: string;
  pbp_end_msg_url?: string;
  created_at: ISODate;
  updated_at?: ISODate;
}

export interface GameSessionDetail extends GameSession {
  beats?: Beat[];
  moments?: Moment[];
}

export interface UpdateSessionRequest {
  title?: string;
  summary?: string;
  notes?: string;
  session_date?: ISODate;
  image?: string;
}

export interface ListSessionsParams extends PaginationParams {
  campaign_id: ID;
}

export interface SessionTranscriptParams {
  format?: TranscriptFormat;
}

// ---------------------------------------------------------------------------
// Beat
// ---------------------------------------------------------------------------

export type BeatType = "major" | "minor" | "step";

export interface Beat {
  id: ID;
  campaign_id: ID;
  label: string;
  type: BeatType;
  description?: string;
  index: number;
  parent_id?: ID;
  metadata?: Record<string, unknown>;
  game_session_ids: ID[];
  game_session_id?: ID;
  created_at: ISODate;
  updated_at?: ISODate;
}

export interface BeatLinkedEntities {
  characters: ID[];
  factions: ID[];
  locations: ID[];
  items: ID[];
}

export interface BeatHierarchyRead extends Beat {
  children: BeatHierarchyRead[];
  linkedEntities: BeatLinkedEntities;
}

// ---------------------------------------------------------------------------
// Moment
// ---------------------------------------------------------------------------

export interface Moment {
  id: ID;
  campaign_id: ID;
  session_id: ID;
  label?: string;
  content?: string;
  image?: string;
  index?: number;
  categories?: string[];
  kind: string;
  metadata?: Record<string, unknown> | null;
  created_at: ISODate;
  updated_at?: ISODate;
}

export interface MomentCard {
  id: ID;
  label?: string;
  image?: string;
  session_id: ID;
  created_at: ISODate;
  categories: string[];
}

// ---------------------------------------------------------------------------
// Faction & Location & Quest
// ---------------------------------------------------------------------------

export interface Faction {
  id: ID;
  campaign_id: ID;
  name: string;
  aliases: string[];
  description?: string;
  type?: string;
  image?: string;
  tcg_image?: string;
  merge: boolean;
  created_at: ISODate;
  updated_at?: ISODate;
}

export interface ListFactionsParams extends PaginationParams {
  campaign_id: ID;
  with_links?: boolean;
}

export interface Location {
  id: ID;
  campaign_id: ID;
  name: string;
  aliases: string[];
  description?: string;
  type?: string;
  parent_id?: ID;
  image?: string;
  tcg_image?: string;
  merge: boolean;
  created_at: ISODate;
  updated_at?: ISODate;
}

export interface ListLocationsParams extends PaginationParams {
  campaign_id: ID;
  with_links?: boolean;
}

export interface Quest {
  id: ID;
  campaign_id: ID;
  name: string;
  description?: string;
  status: string;
  category?: string;
  objectives?: Array<Record<string, unknown>>;
  created_at: ISODate;
  updated_at?: ISODate;
}

export interface ListQuestsParams extends PaginationParams {
  campaign_id: ID;
}

// ---------------------------------------------------------------------------
// Ask (RAG)
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AskRequest {
  campaign_id: ID;
  messages: ChatMessage[];
  stream?: boolean;
}

export interface AskResponse {
  answer: string;
  sources?: Array<{
    id: ID;
    type: string;
    title: string;
  }>;
  monthly_remaining_tokens?: number;
  hourly_remaining_tokens?: number;
}

export interface AskQuotaResponse {
  monthly_quota: number;
  monthly_remaining: number;
  hourly_quota: number;
  hourly_remaining: number;
}
