import { useQuery } from "@tanstack/react-query";
import { getFeatureCatalog } from "@/lib/api/entitlements";

/** The public free/paid rules per feature (no login needed). */
export function useFeatureCatalog() {
  return useQuery({
    queryKey: ["billing", "feature-catalog"],
    queryFn: getFeatureCatalog,
    staleTime: 60_000,
  });
}
