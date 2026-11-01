import { describe, it, expect, vi } from "vitest";
import { ArchivistClient, ArchivistApiError } from "../src";

describe("ArchivistClient", () => {
  it("throws an error if apiKey is not provided", () => {
    expect(() => new ArchivistClient({ apiKey: "" })).toThrow("requires an apiKey");
  });

  it("attaches x-api-key header and calls correct endpoints", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ id: "camp_1", title: "Curse of Strahd", system: "5e" }],
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      }),
    });

    const client = new ArchivistClient({
      apiKey: "test-api-key-123",
      fetchFn: mockFetch as any,
    });

    const res = await client.campaigns.list({ page: 1, size: 5 });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.myarchivist.ai/v1/campaigns?page=1&size=5");
    expect(init.headers["x-api-key"]).toBe("test-api-key-123");
    expect(init.headers["Accept"]).toBe("application/json");
    expect(res.data[0].title).toBe("Curse of Strahd");
  });

  it("creates a character via POST with JSON body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: "char_100",
        character_name: "Thorin",
        type: "PC",
        campaign_id: "camp_1",
      }),
    });

    const client = new ArchivistClient({
      apiKey: "key-abc",
      fetchFn: mockFetch as any,
    });

    const created = await client.characters.create({
      campaign_id: "camp_1",
      character_name: "Thorin",
      type: "PC",
      description: "Dwarven fighter",
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.myarchivist.ai/v1/characters");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      campaign_id: "camp_1",
      character_name: "Thorin",
      type: "PC",
      description: "Dwarven fighter",
    });
    expect(created.id).toBe("char_100");
  });

  it("creates and lists items properly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [{ id: "item_1", name: "Sunblade", campaign_id: "camp_1" }],
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      }),
    });

    const client = new ArchivistClient({
      apiKey: "key-abc",
      fetchFn: mockFetch as any,
    });

    const items = await client.items.list({ campaign_id: "camp_1" });
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.myarchivist.ai/v1/items?campaign_id=camp_1&with_links=true");
    expect(items.data[0].name).toBe("Sunblade");
  });

  it("handles API errors properly with ArchivistApiError", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      json: async () => ({ detail: "image must be an HTTPS URL" }),
    });

    const client = new ArchivistClient({
      apiKey: "key-abc",
      fetchFn: mockFetch as any,
    });

    await expect(
      client.characters.create({
        campaign_id: "camp_1",
        character_name: "Invalid",
        type: "PC",
        image: "http://insecure.com/img.png",
      })
    ).rejects.toThrow(ArchivistApiError);

    try {
      await client.characters.create({
        campaign_id: "camp_1",
        character_name: "Invalid",
        type: "PC",
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(ArchivistApiError);
      expect(err.status).toBe(422);
      expect(err.detail).toBe("image must be an HTTPS URL");
    }
  });

  // -------------------------------------------------------------------------
  // Journals & Markdown tests
  // -------------------------------------------------------------------------

  describe("journals", () => {
    it("lists journals with format=markdown and with_links=true", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: "journal_1",
              worldId: "camp_1",
              title: "Session 1 Notes",
              content: "# Session 1\n| Player | Character |\n|---|---|\n| Bob | Thorin |",
            },
          ],
          total: 1,
          page: 1,
          size: 20,
          pages: 1,
        }),
      });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      const res = await client.journals.list({
        campaign_id: "camp_1",
        format: "markdown",
        with_links: true,
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.myarchivist.ai/v1/journals?campaign_id=camp_1&format=markdown&with_links=true");
      expect(res.data[0].title).toBe("Session 1 Notes");
      expect(res.data[0].content).toContain("| Player | Character |");
    });

    it("gets journal detail and unwraps entry object if nested", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          entry: {
            id: "journal_2",
            worldId: "camp_1",
            title: "Krin Calendar",
            content: "### Months\n| Month | Earth |\n|---|---|\n| Cuiva | March |",
          },
        }),
      });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      const journal = await client.journals.get("journal_2", {
        format: "markdown",
        with_links: true,
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.myarchivist.ai/v1/journals/journal_2?with_links=true&format=markdown");
      expect(journal.id).toBe("journal_2");
      expect(journal.title).toBe("Krin Calendar");
      expect(journal.content).toContain("| Cuiva | March |");
    });

    it("getMarkdown convenience helper fetches markdown content directly", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          entry: {
            id: "journal_3",
            title: "Rules",
            content: "# House Rules\n\n1. Flanking provides +2\n2. Potions are bonus actions",
          },
        }),
      });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      const md = await client.journals.getMarkdown("journal_3");
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.myarchivist.ai/v1/journals/journal_3?with_links=true&format=markdown");
      expect(md).toBe("# House Rules\n\n1. Flanking provides +2\n2. Potions are bonus actions");
    });

    it("creates journal entry with markdown format", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: "journal_new",
          worldId: "camp_1",
          title: "Party Roster",
          content: "| Name | Class |\n|---|---|\n| [[Thorin]] | Fighter |",
        }),
      });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      const created = await client.journals.create({
        worldId: "camp_1",
        title: "Party Roster",
        content: "| Name | Class |\n|---|---|\n| [[Thorin]] | Fighter |",
        contentFormat: "markdown",
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.myarchivist.ai/v1/journals");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body);
      expect(body.worldId).toBe("camp_1");
      expect(body.title).toBe("Party Roster");
      expect(body.contentFormat).toBe("markdown");
      expect(body.content_format).toBe("markdown");
      expect(created.id).toBe("journal_new");
    });

    it("createMarkdown convenience helper creates entry with contentFormat=markdown", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          entry: {
            id: "journal_sheet",
            worldId: "camp_1",
            title: "Thorin Sheet",
            content: "# Thorin Ironforge\n\n**AC:** 18",
          },
        }),
      });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      const sheetMd = "# Thorin Ironforge\n\n**AC:** 18";
      const created = await client.journals.createMarkdown("camp_1", "Thorin Sheet", sheetMd, {
        status: "published",
        folderId: "folder_sheets",
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.myarchivist.ai/v1/journals");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body);
      expect(body.worldId).toBe("camp_1");
      expect(body.title).toBe("Thorin Sheet");
      expect(body.content).toBe(sheetMd);
      expect(body.contentFormat).toBe("markdown");
      expect(body.content_format).toBe("markdown");
      expect(body.status).toBe("published");
      expect(body.folderId).toBe("folder_sheets");
      expect(created.id).toBe("journal_sheet");
    });

    it("updateMarkdown updates journal entry with markdown format", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          entry: {
            id: "journal_sheet",
            title: "Thorin Sheet",
            content: "# Thorin (Updated)",
          },
        }),
      });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      const updated = await client.journals.updateMarkdown("journal_sheet", "# Thorin (Updated)");

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.myarchivist.ai/v1/journals");
      expect(init.method).toBe("PUT");
      const body = JSON.parse(init.body);
      expect(body.id).toBe("journal_sheet");
      expect(body.content).toBe("# Thorin (Updated)");
      expect(body.contentFormat).toBe("markdown");
      expect(body.content_format).toBe("markdown");
      expect(updated.id).toBe("journal_sheet");
    });

    it("deletes a journal entry via DELETE /v1/journals?id=...", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      await client.journals.delete("journal_to_delete");

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.myarchivist.ai/v1/journals?id=journal_to_delete");
      expect(init.method).toBe("DELETE");
    });
  });

  // -------------------------------------------------------------------------
  // Journal Folders tests
  // -------------------------------------------------------------------------

  describe("journalFolders", () => {
    it("lists and gets journal folders", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          { id: "f_1", worldId: "camp_1", name: "Character Sheets", path: "/Character Sheets" },
        ],
      });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      const folders = await client.journalFolders.list({ campaign_id: "camp_1" });
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.myarchivist.ai/v1/journal-folders?campaign_id=camp_1");
      expect(folders).toHaveLength(1);
      expect(folders[0].name).toBe("Character Sheets");
    });

    it("creates a journal folder", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: "f_2",
          worldId: "camp_1",
          name: "Monsters",
          path: "/Monsters",
        }),
      });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      const folder = await client.journalFolders.create({
        worldId: "camp_1",
        name: "Monsters",
        path: "/Monsters",
      });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.myarchivist.ai/v1/journal-folders");
      expect(init.method).toBe("POST");
      expect(folder.id).toBe("f_2");
    });

    it("ensure helper finds existing folder without creating duplicate", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          { id: "f_existing", worldId: "camp_1", name: "Character Sheets", path: "/Character Sheets" },
        ],
      });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      const folder = await client.journalFolders.ensure("camp_1", "Character Sheets");
      expect(mockFetch).toHaveBeenCalledOnce(); // Only list, no create
      expect(folder.id).toBe("f_existing");
    });

    it("ensure helper creates folder if not found", async () => {
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: async () => ({
            id: "f_new",
            worldId: "camp_1",
            name: "Loot",
            path: "/Loot",
          }),
        });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      const folder = await client.journalFolders.ensure("camp_1", "Loot");
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(folder.id).toBe("f_new");
    });

    it("fetches journal tree", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "f_root",
            name: "Root",
            children: [],
          },
        ],
      });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      const tree = await client.journalFolders.tree("camp_1");
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.myarchivist.ai/v1/campaigns/camp_1/journal-tree");
      expect(tree).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Session transcript markdown tests
  // -------------------------------------------------------------------------

  describe("sessions transcript", () => {
    it("transcriptMarkdown fetches markdown formatted session transcript", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          transcript: "# Session 5 Transcript\n\n**DM:** The door opens...",
        }),
      });

      const client = new ArchivistClient({
        apiKey: "key-abc",
        fetchFn: mockFetch as any,
      });

      const transcript = await client.sessions.transcriptMarkdown("sess_123");
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.myarchivist.ai/v1/sessions/sess_123/transcript?format=markdown");
      expect(transcript).toContain("# Session 5 Transcript");
    });
  });
});
