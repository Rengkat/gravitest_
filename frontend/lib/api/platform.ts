import { apiClient } from "./client";

export interface PlatformAppearance {
  accentColor: string; // '#RRGGBB'
  updatedAt: string;
}

/** Public — works before login. */
export async function getPlatformAppearance(): Promise<PlatformAppearance> {
  const { data } = await apiClient.get("/platform/appearance");
  return data;
}

/** Admin / super-admin only. Changes the accent for every user. */
export async function updatePlatformAppearance(accentColor: string): Promise<PlatformAppearance> {
  const { data } = await apiClient.patch("/admin/platform/appearance", { accentColor });
  return data;
}
