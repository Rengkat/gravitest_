import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const api = vi.hoisted(() => ({
  listQuestions: vi.fn(),
  unpublishQuestion: vi.fn(), publishQuestion: vi.fn(), duplicateQuestion: vi.fn(),
  deleteQuestion: vi.fn(), bulkSetActive: vi.fn(), bulkDeleteQuestions: vi.fn(),
}));
vi.mock("@/lib/api/questions", () => api);

import { useExamQuestions, PAGE_SIZE } from "./useExamQuestions";

const page = (n = 0, total = 0) => ({
  data: Array.from({ length: n }, (_, i) => ({ id: `q${i}`, isActive: true })),
  meta: { totalItems: total, totalPages: Math.ceil(total / PAGE_SIZE) || 1 },
});
const lastCall = () => api.listQuestions.mock.calls.at(-1)![0];

beforeEach(() => {
  vi.resetAllMocks();
  api.listQuestions.mockResolvedValue(page(10, 50));
});

describe("useExamQuestions", () => {
  it("asks for 10 questions per page", async () => {
    const { result } = renderHook(() => useExamQuestions("waec" as never));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(PAGE_SIZE).toBe(10);
    expect(lastCall()).toMatchObject({ examType: "waec", page: 1, limit: 10 });
    expect(result.current.totalPages).toBe(5);
  });

  it("'All statuses' sends NO isActive, so published and drafts both come back", async () => {
    const { result } = renderHook(() => useExamQuestions("waec" as never));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(lastCall().isActive).toBeUndefined();
  });

  it.each([
    ["published", true],
    ["draft", false],
  ])("status '%s' sends isActive=%s", async (status, expected) => {
    const { result } = renderHook(() => useExamQuestions("waec" as never, { status } as never));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(lastCall().isActive).toBe(expected);
  });

  it("switching the status filter refetches from page 1; clearing it drops isActive again", async () => {
    const { result } = renderHook(() => useExamQuestions("waec" as never));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setPage(3));
    await waitFor(() => expect(lastCall().page).toBe(3));

    act(() => result.current.setFilters({ ...result.current.filters, status: "draft" as never }));
    await waitFor(() => expect(lastCall()).toMatchObject({ isActive: false, page: 1 }));

    act(() => result.current.setFilters({ ...result.current.filters, status: "" as never }));
    await waitFor(() => expect(lastCall().isActive).toBeUndefined());
  });
});
