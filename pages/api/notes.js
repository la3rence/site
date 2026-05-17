import { listNotes, getNote, createNote, updateNote, deleteNote } from "../../lib/notes";
import { renderMarkdown } from "../../lib/markdown-simple.mjs";
import cache from "../../lib/cache";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const NOTES_TTL = 1800; // 30 minutes

const checkAuth = req => {
  const auth = req.headers.authorization;
  if (!auth || !ADMIN_TOKEN) return false;
  return auth === `Bearer ${ADMIN_TOKEN}`;
};

const serialize = note => ({
  id: note._id.toString(),
  content: note.content,
  html: note.html,
  hidden: note.hidden ?? false,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

const hasAuthHeader = req => !!req.headers.authorization;

const invalidateNotesCache = noteId => {
  cache.del("notes_list_true");
  cache.del("notes_list_false");
  if (noteId) cache.del(`note_${noteId}`);
};

export default async function handler(req, res) {
  const isAuthed = checkAuth(req);
  const { id } = req.query;

  // Reject bad tokens early
  if (hasAuthHeader(req) && !isAuthed) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // GET a single note by id
  if (req.method === "GET" && id) {
    const cached = cache.get(`note_${id}`);
    if (cached) return res.json(cached);

    const note = await getNote(id);
    if (!note) return res.status(404).json({ error: "not found" });

    const data = serialize(note);
    cache.set(`note_${id}`, data, NOTES_TTL);
    return res.json(data);
  }

  // GET list
  if (req.method === "GET") {
    const cacheKey = `notes_list_${isAuthed}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);
    const notes = await listNotes(isAuthed);
    const data = notes.map(serialize);
    cache.set(cacheKey, data, NOTES_TTL);
    return res.json(data);
  }

  // POST — require auth
  if (req.method === "POST") {
    if (!isAuthed) return res.status(401).json({ error: "unauthorized" });

    const { content, hidden } = req.body;
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "content is required" });
    }

    const html = await renderMarkdown(content);
    const note = await createNote(content, html, !!hidden);
    invalidateNotesCache();
    try {
      await res.revalidate("/notes");
    } catch {
      // revalidation error is non-fatal (first build, etc.)
    }

    return res.json(serialize(note));
  }

  // DELETE — require auth
  if (req.method === "DELETE") {
    if (!isAuthed) return res.status(401).json({ error: "unauthorized" });
    if (!id) return res.status(400).json({ error: "id is required" });
    await deleteNote(id);
    invalidateNotesCache(id);
    try {
      await res.revalidate("/notes");
    } catch {
      // non-fatal
    }

    return res.json({ ok: true });
  }

  // PUT — update a note (require auth)
  if (req.method === "PUT") {
    if (!isAuthed) return res.status(401).json({ error: "unauthorized" });
    if (!id) return res.status(400).json({ error: "id is required" });

    const { content, hidden } = req.body;
    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "content is required" });
    }

    const html = await renderMarkdown(content);
    const note = await updateNote(id, content, html, hidden);

    if (!note) return res.status(404).json({ error: "not found" });
    invalidateNotesCache(id);
    try {
      await res.revalidate("/notes");
    } catch {
      // non-fatal
    }

    return res.json(serialize(note));
  }

  return res.status(405).json({ error: "method not allowed" });
}
