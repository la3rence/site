import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "../../components/header";
import { listNotes } from "../../lib/notes";

const TOKEN_KEY = "notes_admin_token";
const API = "/api/notes";

const getToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setToken = t => {
  try {
    sessionStorage.setItem(TOKEN_KEY, t);
  } catch {}
};

const clearToken = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
};

const renderMarkdown = async md => {
  const { remark } = await import("remark");
  const remarkGfm = (await import("remark-gfm")).default;
  const remarkRehype = (await import("remark-rehype")).default;
  const rehypeStringify = (await import("rehype-stringify")).default;
  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return String(result);
};

export default function NotesPage({ serverNotes }) {
  const { locale, query, isReady } = useRouter();
  const localeMap = { zh: "zh-CN", en: "en-US" };
  const dateLocale = localeMap[locale] || "zh-CN";
  const showAuthPrompt = isReady && "login" in query;
  const [notes, setNotes] = useState(serverNotes);
  const [token, setTokenState] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [composing, setComposing] = useState(false);
  const [content, setContent] = useState("");
  const [hidden, setHidden] = useState(false);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editHidden, setEditHidden] = useState(false);
  const [editPreview, setEditPreview] = useState(null);
  const composeRef = useRef(null);

  // Restore token from sessionStorage on mount and fetch authed notes
  useEffect(() => {
    const saved = getToken();
    if (saved) {
      setTokenState(saved);
      setComposing(true);
      fetch(API, { headers: { Authorization: `Bearer ${saved}` } })
        .then(r => r.ok && r.json())
        .then(data => data && setNotes(data))
        .catch(() => {});
    }
  }, []);

  const handleAuth = async e => {
    e.preventDefault();
    setAuthError(false);
    try {
      const res = await fetch(API, {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        setToken(password);
        setTokenState(password);
        setComposing(true);
        setShowAuth(false);
        setPassword("");
        const data = await res.json();
        setNotes(data);
      } else {
        setAuthError(true);
      }
    } catch {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    clearToken();
    setTokenState(null);
    setComposing(false);
    setContent("");
    setPreview(null);
    setHidden(false);
    setNotes(serverNotes);
  };

  const handlePreview = async () => {
    if (preview !== null) {
      setPreview(null);
      return;
    }
    if (!content.trim()) return;
    const html = await renderMarkdown(content);
    setPreview(html);
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim(), hidden }),
      });
      if (res.ok) {
        setContent("");
        setHidden(false);
        setPreview(null);
        const newNote = await res.json();
        setNotes(prev => [newNote, ...prev]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async id => {
    if (!confirm("delete this note?")) return;
    try {
      const res = await fetch(`${API}?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setNotes(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const handleEdit = note => {
    setEditingId(note.id);
    setEditContent(note.content);
    setEditHidden(note.hidden);
    setEditPreview(null);
  };

  const handleEditPreview = async () => {
    if (editPreview !== null) {
      setEditPreview(null);
      return;
    }
    if (!editContent.trim()) return;
    const html = await renderMarkdown(editContent);
    setEditPreview(html);
  };

  const handleEditSave = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`${API}?id=${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent.trim(), hidden: editHidden }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));
        setEditingId(null);
        setEditContent("");
        setEditPreview(null);
      }
    } catch {}
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditContent("");
    setEditPreview(null);
  };

  const formatDate = d => {
    const date = new Date(d);
    return date.toLocaleDateString(dateLocale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Header title="Notes" tags="Notes" />
      <Head>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="mx-auto max-w-3xl px-4 mt-10">
        {/* Auth / Compose area */}
        {showAuthPrompt && !composing ? (
          <div className="mb-8">
            {showAuth ? (
              <form onSubmit={handleAuth} className="flex items-center gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="token"
                  className="border border-zinc-300 dark:border-zinc-600 bg-transparent rounded px-3 py-1.5 text-sm outline-none focus:border-zinc-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowAuth(false)}
                  className="text-sm text-zinc-400 hover:text-zinc-600"
                >
                  cancel
                </button>
                {authError && <span className="text-sm text-red-500">wrong token</span>}
              </form>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="text-sm text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                login to post
              </button>
            )}
          </div>
        ) : composing ? (
          <div className="mb-10 space-y-3">
            <textarea
              ref={composeRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="markdown..."
              rows={5}
              className="w-full border border-zinc-300 dark:border-zinc-600 bg-transparent rounded px-3 py-2 text-sm outline-none resize-y focus:border-zinc-500"
            />
            {preview !== null && (
              <div
                className="prose prose-slate dark:prose-invert text-sm p-3 border border-dashed border-zinc-300 dark:border-zinc-600 rounded"
                dangerouslySetInnerHTML={{ __html: preview }}
              />
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreview}
                disabled={!content.trim()}
                className="text-sm px-3 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer disabled:cursor-default"
              >
                {preview !== null ? "edit" : "preview"}
              </button>
              <label className="flex items-center gap-1.5 text-sm text-zinc-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hidden}
                  onChange={e => setHidden(e.target.checked)}
                  className="accent-zinc-800 dark:accent-zinc-200"
                />
                hidden
              </label>
              <div className="flex-1" />
              <button
                onClick={handleLogout}
                className="text-sm text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                logout
              </button>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="text-sm px-4 py-1.5 rounded bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black hover:opacity-80 disabled:opacity-40 cursor-pointer disabled:cursor-default"
              >
                {submitting ? "..." : "post"}
              </button>
            </div>
          </div>
        ) : null}

        {/* Timeline */}
        <div className="space-y-8">
          {notes.map(note => (
            <div key={note.id} className="group">
              <div className="flex items-start gap-2">
                <Link
                  href={`/notes/${note.id}`}
                  className="shrink-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 pt-0.5 no-underline"
                >
                  {formatDate(note.createdAt)}
                </Link>
                {note.hidden && composing && (
                  <span className="shrink-0 text-xs text-amber-500 border border-amber-500 rounded px-1">
                    hidden
                  </span>
                )}
                <div className="flex-1" />
                {composing && editingId !== note.id && (
                  <>
                    <button
                      onClick={() => handleEdit(note)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer transition-opacity mr-2"
                    >
                      edit
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 cursor-pointer transition-opacity"
                    >
                      delete
                    </button>
                  </>
                )}
              </div>
              {editingId === note.id ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={4}
                    className="w-full border border-zinc-300 dark:border-zinc-600 bg-transparent rounded px-3 py-2 text-sm outline-none resize-y focus:border-zinc-500"
                    autoFocus
                  />
                  {editPreview !== null && (
                    <div
                      className="prose prose-slate dark:prose-invert text-sm p-3 border border-dashed border-zinc-300 dark:border-zinc-600 rounded"
                      dangerouslySetInnerHTML={{ __html: editPreview }}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleEditPreview}
                      disabled={!editContent.trim()}
                      className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer disabled:cursor-default"
                    >
                      {editPreview !== null ? "edit" : "preview"}
                    </button>
                    <label className="flex items-center gap-1 text-xs text-zinc-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editHidden}
                        onChange={e => setEditHidden(e.target.checked)}
                        className="accent-zinc-800 dark:accent-zinc-200"
                      />
                      hidden
                    </label>
                    <div className="flex-1" />
                    <button
                      onClick={handleEditCancel}
                      className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      cancel
                    </button>
                    <button
                      onClick={handleEditSave}
                      disabled={!editContent.trim()}
                      className="text-xs px-3 py-1 rounded bg-zinc-800 dark:bg-zinc-200 text-white dark:text-black hover:opacity-80 disabled:opacity-40 cursor-pointer disabled:cursor-default"
                    >
                      save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="prose prose-slate dark:prose-invert text-sm mt-1 prose-p:my-1 prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: note.html }}
                />
              )}
            </div>
          ))}
          {notes.length === 0 && <p className="text-zinc-400 text-sm">no notes yet</p>}
        </div>
      </div>
    </>
  );
}

export const getStaticProps = async () => {
  try {
    const notes = await listNotes(false);
    return {
      props: {
        serverNotes: notes.map(n => ({
          id: n._id.toString(),
          content: n.content,
          html: n.html,
          hidden: n.hidden ?? false,
          createdAt: n.createdAt.toISOString(),
        })),
      },
      revalidate: 300,
    };
  } catch {
    return {
      props: { serverNotes: [] },
      revalidate: 300,
    };
  }
};
