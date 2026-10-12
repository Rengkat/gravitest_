"use client";

import ComingSoon from "./ComingSoon";

export default function BackupSection() {
  return (
    <ComingSoon
      title="Backups"
      description="There's no backup/restore system in the application layer — database backups for this platform should be handled at the infrastructure level (e.g. your hosting provider's managed Postgres backups), not triggered from this UI."
    />
  );
}
