import PostCard from "./PostCard";
import type { Post } from "./blogData";
import { Search } from "lucide-react";

interface Props {
  posts:    Post[];
  total:    number;
}

export default function BlogGrid({ posts, total }: Props) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
          <Search size={28} strokeWidth={1.5} className="text-green-600" />
        </div>
        <h3 className="font-serif text-[22px] text-green-900 mb-2">No articles found</h3>
        <p className="text-text-muted text-sm max-w-[300px]">
          Try a different search term or browse all categories.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-text-light uppercase tracking-[0.08em] mb-5">
        {posts.length === total
          ? `${total} articles`
          : `${posts.length} of ${total} articles`}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {posts.map((post, i) => (
          <PostCard key={post.slug} post={post} index={i} />
        ))}
      </div>
    </div>
  );
}
