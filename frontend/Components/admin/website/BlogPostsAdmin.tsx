"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import FieldEditor, { inputCls } from "./FieldEditor";
import { extractErrorMessage } from "@/lib/api/client";
import {
  adminCreatePost, adminDeletePost, adminListPosts, adminSetPostPublished, adminUpdatePost,
  type AdminPostInput, type BackendPost,
} from "@/lib/api/blog";
import { useAdminItems } from "@/lib/hooks/useSiteContent";
import type { FieldSpec } from "@/lib/api/site-content";

const KEY = ["admin", "blog", "posts"] as const;

type Form = Required<Omit<AdminPostInput, "readTimeMinutes">> & { readTimeMinutes: number | null };

const blank = (category: string): Form => ({
  title: "", slug: "", excerpt: "", content: "", category, tag: "", authorName: "", authorRole: "",
  authorInitials: "", coverImageUrl: "", readTimeMinutes: null, isFeatured: false, isPublished: false,
});

const fromPost = (p: BackendPost): Form => ({
  title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content, category: p.category, tag: p.tag,
  authorName: p.authorName, authorRole: p.authorRole ?? "", authorInitials: p.authorInitials ?? "",
  coverImageUrl: p.coverImageUrl ?? "", readTimeMinutes: p.readTimeMinutes, isFeatured: p.isFeatured, isPublished: p.isPublished,
});

function text(name: keyof Form, label: string, extra: Partial<FieldSpec> = {}): FieldSpec {
  return { name, label, type: "text", ...extra };
}

/** Blog posts: full create / edit / publish / unpublish / feature / delete, stored in the database. */
export default function BlogPostsAdmin() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);
  const categories = useAdminItems("blog-categories");
  const posts = useQuery({ queryKey: [...KEY, page], queryFn: () => adminListPosts({ page, limit: 15 }), placeholderData: keepPreviousData });

  const refresh = () => qc.invalidateQueries({ queryKey: KEY });
  const onError = (e: unknown) => toast.error(extractErrorMessage(e));

  const save = useMutation({
    mutationFn: (v: { id: string | null; form: Form }) => {
      const { readTimeMinutes, slug, ...rest } = v.form;
      const body: AdminPostInput = { ...rest, ...(readTimeMinutes ? { readTimeMinutes } : {}), ...(slug ? { slug } : {}) };
      return v.id ? adminUpdatePost(v.id, body) : adminCreatePost(body);
    },
    onSuccess: async () => { toast.success("Post saved"); setEditing(null); await refresh(); },
    onError,
  });
  const publish = useMutation({
    mutationFn: (v: { id: string; published: boolean }) => adminSetPostPublished(v.id, v.published),
    onSuccess: async (_r, v) => { toast.success(v.published ? "Published" : "Unpublished"); await refresh(); },
    onError,
  });
  const remove = useMutation({
    mutationFn: adminDeletePost,
    onSuccess: async () => { toast.success("Post deleted"); await refresh(); },
    onError,
  });

  const cats = categories.data ?? [];
  const catLabel = (slug: string) => String(cats.find((c) => c.slug === slug)?.label ?? slug);

  const submit = () => {
    if (!editing) return;
    const f = editing.form;
    const missing = [["Title", f.title], ["Excerpt", f.excerpt], ["Content", f.content], ["Category", f.category], ["Label chip", f.tag], ["Author name", f.authorName]]
      .filter(([, v]) => !String(v).trim()).map(([l]) => l);
    if (missing.length) return toast.error(`Please fill in: ${missing.join(", ")}`);
    save.mutate(editing);
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  return (
    <section aria-labelledby="blog-posts-h" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="blog-posts-h" className="font-serif text-lg text-green-900">Blog posts</h3>
          <p className="text-[13px] text-text-muted">Write, publish and feature posts. Drafts are never shown publicly.</p>
        </div>
        {!editing && (
          <button type="button" disabled={!cats.length} onClick={() => setEditing({ id: null, form: blank(String(cats[0]?.slug ?? "")) })}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            <Plus size={14} aria-hidden="true" /> New post
          </button>
        )}
      </div>
      {!categories.isLoading && !cats.length && <p className="text-sm text-text-muted">Create at least one blog category first (see “Blog categories”).</p>}

      {editing && (
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4 rounded-2xl border border-green-700/30 bg-white p-5" aria-label={editing.id ? "Edit post" : "New post"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><FieldEditor spec={text("title", "Title", { required: true, max: 200 })} value={editing.form.title} onChange={(v) => set("title", String(v))} /></div>
            <FieldEditor spec={text("slug", "URL slug", { max: 220, help: "Leave empty to generate from the title." })} value={editing.form.slug} onChange={(v) => set("slug", String(v))} />
            <div>
              <label htmlFor="post-category" className="mb-1 block text-sm font-medium text-green-900">Category <span aria-hidden="true" className="text-red-600">*</span></label>
              <select id="post-category" className={inputCls} value={editing.form.category} onChange={(e) => set("category", e.target.value)}>
                {cats.map((c) => <option key={c.id} value={String(c.slug)}>{String(c.label)}</option>)}
              </select>
            </div>
            <FieldEditor spec={text("tag", "Label chip on cards", { required: true, max: 60, placeholder: "JAMB Guide" })} value={editing.form.tag} onChange={(v) => set("tag", String(v))} />
            <FieldEditor spec={{ name: "readTimeMinutes", label: "Read time (minutes)", type: "number", min: 1, help: "Leave empty to estimate from length." }} value={editing.form.readTimeMinutes} onChange={(v) => set("readTimeMinutes", typeof v === "number" ? v : null)} />
            <div className="sm:col-span-2"><FieldEditor spec={{ name: "excerpt", label: "Excerpt", type: "textarea", required: true, max: 400 }} value={editing.form.excerpt} onChange={(v) => set("excerpt", String(v))} /></div>
            <div className="sm:col-span-2"><FieldEditor spec={{ name: "content", label: "Content (Markdown)", type: "markdown", required: true }} value={editing.form.content} onChange={(v) => set("content", String(v))} /></div>
            <div className="sm:col-span-2"><FieldEditor spec={{ name: "coverImageUrl", label: "Cover image", type: "image" }} value={editing.form.coverImageUrl} onChange={(v) => set("coverImageUrl", String(v))} /></div>
            <FieldEditor spec={text("authorName", "Author name", { required: true, max: 120 })} value={editing.form.authorName} onChange={(v) => set("authorName", String(v))} />
            <FieldEditor spec={text("authorRole", "Author role", { max: 120 })} value={editing.form.authorRole} onChange={(v) => set("authorRole", String(v))} />
            <FieldEditor spec={text("authorInitials", "Author initials", { max: 4, help: "Defaults to the name's initials." })} value={editing.form.authorInitials} onChange={(v) => set("authorInitials", String(v))} />
            <div className="flex flex-col justify-end gap-2">
              <FieldEditor spec={{ name: "isFeatured", label: "Feature on the blog page", type: "boolean" }} value={editing.form.isFeatured} onChange={(v) => set("isFeatured", v === true)} />
              <FieldEditor spec={{ name: "isPublished", label: "Published (visible on the website)", type: "boolean" }} value={editing.form.isPublished} onChange={(v) => set("isPublished", v === true)} />
            </div>
          </div>
          <div className="flex gap-2 border-t border-cream-border pt-4">
            <button type="submit" disabled={save.isPending} className="inline-flex items-center gap-2 rounded-full bg-green-800 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
              {save.isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />} Save post
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-full px-4 py-2 text-sm font-semibold text-text-muted hover:text-green-900">Cancel</button>
          </div>
        </form>
      )}

      {posts.isLoading && <p role="status" className="text-sm text-text-muted">Loading posts…</p>}
      {posts.isError && <p role="alert" className="text-sm text-red-700">Couldn&apos;t load posts.</p>}
      {posts.data && posts.data.data.length === 0 && <p className="rounded-xl border border-dashed border-cream-border p-6 text-center text-sm text-text-muted">No posts yet.</p>}

      <ul className="space-y-2">
        {posts.data?.data.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-cream-border bg-white p-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-green-900">
                {p.isFeatured && <Star size={13} className="shrink-0 text-gold-dark" aria-label="Featured" />}{p.title}
              </p>
              <p className="truncate text-xs text-text-muted">{catLabel(p.category)} · {p.authorName} · {p.viewCount.toLocaleString()} views</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${p.isPublished ? "bg-green-500/15 text-green-800" : "bg-gold/20 text-gold-dark"}`}>{p.isPublished ? "Published" : "Draft"}</span>
            <div className="flex gap-1.5">
              <button type="button" aria-label={`${p.isPublished ? "Unpublish" : "Publish"} ${p.title}`} title={p.isPublished ? "Unpublish" : "Publish"} disabled={publish.isPending}
                onClick={() => publish.mutate({ id: p.id, published: !p.isPublished })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-border text-green-800 hover:bg-cream disabled:opacity-30">
                {p.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button type="button" aria-label={`Edit ${p.title}`} title="Edit" onClick={() => setEditing({ id: p.id, form: fromPost(p) })} className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream-border text-green-800 hover:bg-cream"><Pencil size={14} /></button>
              <button type="button" aria-label={`Delete ${p.title}`} title="Delete" disabled={remove.isPending}
                onClick={() => { if (window.confirm(`Delete "${p.title}"? This can't be undone.`)) remove.mutate(p.id); }} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-30"><Trash2 size={14} /></button>
            </div>
          </li>
        ))}
      </ul>

      {posts.data && posts.data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-full border border-green-800 px-4 py-1.5 font-semibold text-green-800 disabled:opacity-40">Previous</button>
          <span className="text-text-muted">Page {posts.data.meta.currentPage} of {posts.data.meta.totalPages}</span>
          <button type="button" disabled={page >= posts.data.meta.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-full border border-green-800 px-4 py-1.5 font-semibold text-green-800 disabled:opacity-40">Next</button>
        </div>
      )}
    </section>
  );
}
