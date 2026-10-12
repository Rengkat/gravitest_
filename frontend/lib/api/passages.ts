import { apiClient } from "./client";
import type { Passage, ExamType } from "@/types/questions";

interface PaginatedMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}
interface Paginated<T> {
  data: T[];
  meta: PaginatedMeta;
}

export interface PassageListParams {
  examType?: ExamType;
  subject?: string;
  year?: number;
  page?: number;
  limit?: number;
}

export async function listPassages(params: PassageListParams = {}): Promise<Paginated<Passage>> {
  const { data } = await apiClient.get("/passages", { params });
  return data;
}

export async function getPassage(id: string): Promise<Passage> {
  const { data } = await apiClient.get(`/passages/${id}`);
  return data;
}

export interface CreatePassagePayload {
  examType: ExamType;
  subject: string;
  year: number;
  title?: string;
  instructions?: string;
  passageText?: string;
  passageImageUrl?: string;
  isActive?: boolean;
}

export async function createPassage(payload: CreatePassagePayload): Promise<Passage> {
  const { data } = await apiClient.post("/passages", payload);
  return data;
}

export async function updatePassage(
  id: string,
  payload: Partial<CreatePassagePayload>,
): Promise<Passage> {
  const { data } = await apiClient.patch(`/passages/${id}`, payload);
  return data;
}

export async function deletePassage(id: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/passages/${id}`);
  return data;
}
