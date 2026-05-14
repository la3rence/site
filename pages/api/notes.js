import { listNotes, getNote, createNote, updateNote, deleteNote } from "../../lib/notes";
import { renderMarkdown } from "../../lib/markdown-simple.mjs";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

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

export default async function handler(req, res) {
  const isAuthed = checkAuth(req);
  const { id } = req.query;

  // Reject bad tokens early
  if (hasAuthHeader(req) && !isAuthed) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // GET a single note by id
  if (req.method === "GET" && id) {
    const note = await getNote(id);
    if (!note) return res.status(404).json({ error: "not found" });
    return res.json(serialize(note));
  }

  // GET list
  if (req.method === "GET") {
    const notes = await listNotes(isAuthed);
    return res.json(notes.map(serialize));
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

    try {
      await res.revalidate("/notes");
    } catch {
      // non-fatal
    }

    return res.json(serialize(note));
  }

  return res.status(405).json({ error: "method not allowed" });
}
