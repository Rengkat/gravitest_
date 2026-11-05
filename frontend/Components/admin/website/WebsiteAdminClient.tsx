"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BlockEditor from "./BlockEditor";
import CollectionManager from "./CollectionManager";
import BlogPostsAdmin from "./BlogPostsAdmin";
import { useAdminBlocks, useContentSchema } from "@/lib/hooks/useSiteContent";

/** Admin hub for everything on the public website. Sections are built from the server-side schema. */
export default function WebsiteAdminClient() {
  const schema = useContentSchema();
  const blocks = useAdminBlocks();
  const [active, setActive] = useState<string>("Site-wide");

  const groups = useMemo(() => {
    const names: string[] = [];
    for (const d of [...(schema.data?.blocks ?? []), ...(schema.data?.collections ?? [])]) {
      if (!names.includes(d.group)) names.push(d.group);
    }
    return names;
  }, [schema.data]);

  if (schema.isLoading || blocks.isLoading) return <p role="status" className="p-6 text-sm text-text-muted">Loading website content…</p>;
  if (schema.isError || blocks.isError || !schema.data || !blocks.data) {
    return <p role="alert" className="p-6 text-sm text-red-700">Couldn&apos;t load website content. Refresh and try again.</p>;
  }

  const current = groups.includes(active) ? active : groups[0];
  const groupBlocks = schema.data.blocks.filter((b) => b.group === current);
  const groupCollections = schema.data.collections.filter((c) => c.group === current);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="font-serif text-2xl text-green-900">Website Content</h1>
        <p className="text-sm text-text-muted">
          Everything visitors see on the public website. Changes go live within seconds — no developer needed.
        </p>
      </header>

      <nav aria-label="Website sections">
        <ul className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <li key={g}>
              <button
                type="button"
                aria-current={g === current ? "page" : undefined}
                onClick={() => setActive(g)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-green-600 ${
                  g === current ? "bg-green-800 text-white" : "border border-cream-border bg-white text-green-800 hover:bg-cream"
                }`}>
                {g}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-8">
        {current === "Pricing" && (
          <p className="rounded-xl border border-cream-border bg-white p-4 text-sm text-green-900">
            Plans, prices, billing intervals and the features each plan includes are managed under{" "}
            <Link href="/admin/billing" className="font-semibold underline">Plans &amp; Access</Link>.
          </p>
        )}

        {groupBlocks.map((def) => (
          <BlockEditor
            key={`${def.key}:${blocks.data.find((b) => b.key === def.key)?.updatedAt ?? "new"}`}
            def={def}
            saved={blocks.data.find((b) => b.key === def.key)}
          />
        ))}

        {current === "Blog" && <BlogPostsAdmin />}

        {groupCollections.map((def) => (
          <CollectionManager key={def.key} def={def} />
        ))}
      </div>
    </div>
  );
}
