// This used to be a full second copy of PageClient.tsx (templates, form,
// upload flow — all of it), hand-duplicated instead of imported. The two
// drifted apart over time: this file was the one Next.js actually routes
// to, but PageClient.tsx was the one that kept getting updated (most
// recently with the candidateType column in the bulk-import templates),
// so every fix made there silently never reached the live page. Re-export
// instead of duplicating so there's exactly one implementation to edit.
export { default } from "./PageClient";
