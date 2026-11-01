# @astermoe/archivist-sdk

Strongly-typed, modern TypeScript SDK for the [Archivist API](https://developers.myarchivist.ai) (myarchivist.ai).

Enables developers to programmatically manage TTRPG campaigns, characters, items, journals & folders, sessions, beats, moments, and query campaign lore via AI-powered RAG. Fully supports rich **Markdown** with pipe tables, code blocks, mermaid diagrams, math, and `[[wikilinks]]`.

---

## Installation

```bash
npm install @astermoe/archivist-sdk
```

---

## Quick Start

```ts
import { ArchivistClient } from "@astermoe/archivist-sdk";

const client = new ArchivistClient({
  apiKey: process.env.ARCHIVIST_API_KEY!,
});

// 1. List user campaigns
const { data: campaigns } = await client.campaigns.list();
const campaign = campaigns[0];
console.log(`Campaign: ${campaign.title} (${campaign.system})`);

// 2. Create or sync a character (compendium text fields support Markdown)
const character = await client.characters.create({
  campaign_id: campaign.id,
  character_name: "Thorin Ironforge",
  type: "PC",
  description: "Level 5 Mountain Dwarf Fighter",
  backstory: "Exiled from the deep halls...",
  image: "https://example.com/thorin.png",
});
console.log(`Created character: ${character.character_name} (ID: ${character.id})`);

// 3. Create or sync a journal entry in Markdown
// Ensure a folder exists:
const folder = await client.journalFolders.ensure(campaign.id, "Character Sheets");

// Create journal entry with full Markdown (pipe tables, mermaid diagrams, etc.)
const journal = await client.journals.createMarkdown(
  campaign.id,
  "Thorin Ironforge - Sheet",
  `# [[Thorin Ironforge]]

| Stat | Score | Mod |
| :--- | :---: | :---: |
| STR  | 18    | +4    |
| DEX  | 12    | +1    |
| CON  | 16    | +3    |

\`\`\`mermaid
graph TD;
    Thorin-->MountainDwarves;
\`\`\`
`,
  { folderId: folder.id, status: "published" }
);
console.log(`Created journal entry: ${journal.title} (${journal.id})`);

// 4. Read journal content as Markdown
const markdown = await client.journals.getMarkdown(journal.id);
console.log(markdown);

// 5. Query campaign lore using Ask (RAG)
const answer = await client.ask.query({
  campaign_id: campaign.id,
  messages: [
    { role: "user", content: "Who is Thorin and where is he from?" }
  ],
});
console.log(`Archivist: ${answer.answer}`);
```

---

## Working with Markdown

The Archivist API supports full Markdown for both journals and compendium text fields:

- **Journals (`client.journals`)**:
  - `createMarkdown(worldId, title, markdown, options)`: Creates an entry with `contentFormat: "markdown"` so headings, pipe tables, code blocks, and mermaid diagrams render cleanly in the Archivist UI.
  - `updateMarkdown(id, markdown, options)`: Updates an entry with `contentFormat: "markdown"`.
  - `getMarkdown(id, options)`: Fetches a journal with `format="markdown"` and `with_links=true` (preserving `[[wikilinks]]`) and returns the markdown text directly.
  - `list({ campaign_id, format: "markdown", with_links: true })`: Lists journal entries formatted as Markdown.
- **Journal Folders (`client.journalFolders`)**:
  - `ensure(campaignId, name, options)`: Finds an existing folder by name/path or creates it automatically if it does not exist.
  - `tree(campaignId)`: Returns the full nested folder & journal hierarchy tree.
- **Compendium Fields (Characters, Items, etc.)**:
  - `description` and `backstory` support Markdown (tables, code blocks, mermaid diagrams, math `$$...$$`, and images).
- **Session Transcripts**:
  - `client.sessions.transcriptMarkdown(sessionId)`: Fetches the session transcript rendered as Markdown.

---

## Resources Covered

- **`client.campaigns`**: `list()`, `get(id)`, `stats(id)`
- **`client.characters`**: `list({ campaign_id })`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)`
- **`client.items`**: `list({ campaign_id })`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)`
- **`client.journals`**: `list(params)`, `get(id, params)`, `getMarkdown(id, options)`, `create(data)`, `createMarkdown(worldId, title, md, options)`, `update(id, data)`, `updateMarkdown(id, md, options)`, `delete(id)`
- **`client.journalFolders`**: `list({ campaign_id })`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)`, `tree(campaignId)`, `ensure(campaignId, name, options)`
- **`client.sessions`**: `list({ campaign_id })`, `get(id)`, `update(id, data)`, `transcript(id, params)`, `transcriptMarkdown(id)`
- **`client.beats`**: `list({ session_id, include_hierarchy })`, `get(id)`
- **`client.moments`**: `list({ session_id })`, `get(id)`
- **`client.factions`**: `list({ campaign_id })`, `get(id)`
- **`client.locations`**: `list({ campaign_id })`, `get(id)`
- **`client.quests`**: `list({ campaign_id })`, `get(id)`
- **`client.ask`**: `query(request)`, `quota()`

---

## Acknowledgments & Reference

- Built according to the official [Archivist Developer Documentation](https://developers.myarchivist.ai).
- Reference TypeScript examples from [archivistai/api-examples](https://github.com/archivistai/api-examples).

---

## License

MIT © [Aster Moline](https://aster.quest) ([@astermoline](https://github.com/astermoline))
