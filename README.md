# @astermoe/archivist-sdk

Strongly-typed, modern TypeScript SDK for the [Archivist API](https://developers.myarchivist.ai) (myarchivist.ai).

Enables developers to programmatically manage TTRPG campaigns, characters, items, sessions, beats, moments, and query campaign lore via AI-powered RAG.

---

## Installation

```bash
npm install @astermoe/archivist-sdk
```

---

## Quick Start

```ts
import { ArchivistClient } from '@astermoe/archivist-sdk';

const client = new ArchivistClient({
  apiKey: process.env.ARCHIVIST_API_KEY!,
});

// 1. List user campaigns
const { data: campaigns } = await client.campaigns.list();
const campaign = campaigns[0];
console.log(`Campaign: ${campaign.title} (${campaign.system})`);

// 2. Create or sync a character
const character = await client.characters.create({
  campaign_id: campaign.id,
  character_name: 'Thorin Ironforge',
  type: 'PC',
  description: 'Level 5 Mountain Dwarf Fighter',
  backstory: 'Exiled from the deep halls...',
  image: 'https://example.com/thorin.png',
});
console.log(`Created character: ${character.character_name} (ID: ${character.id})`);

// 3. Create or sync an item
const item = await client.items.create({
  campaign_id: campaign.id,
  name: 'Sunblade',
  type: 'Weapon',
  description: 'This item appears to be a longsword hilt...',
});
console.log(`Created item: ${item.name}`);

// 4. Query campaign lore using Ask (RAG)
const answer = await client.ask.query({
  campaign_id: campaign.id,
  messages: [
    { role: 'user', content: 'Who is Thorin and where is he from?' }
  ],
});
console.log(`Archivist: ${answer.answer}`);
```

---

## Resources Covered

- **`client.campaigns`**: `list()`, `get(id)`, `stats(id)`
- **`client.characters`**: `list({ campaign_id })`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)`
- **`client.items`**: `list({ campaign_id })`, `get(id)`, `create(data)`, `update(id, data)`, `delete(id)`
- **`client.sessions`**: `list({ campaign_id })`, `get(id)`, `update(id, data)`
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
