import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import UserMenu from "./UserMenu";
import { useAuthStore } from "@/lib/store/authStore";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock("@/lib/api/auth", () => ({ performLogout: vi.fn() }));

const asUser = (role: string) =>
  useAuthStore.setState({ user: { id: "u1", firstName: "Alex", lastName: "R", email: "a@b.c", role } as never });

const open = () => render(<UserMenu userMenuOpen setUserMenuOpen={() => {}} />);

describe("UserMenu", () => {
  beforeEach(() => useAuthStore.setState({ user: null } as never));

  it.each(["admin", "super_admin"])("%s: gets an Admin dashboard link to /admin, Profile at /admin/profile, and no Billing", (role) => {
    asUser(role);
    open();
    expect(screen.getByRole("link", { name: /Admin dashboard/ })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: /Profile/ })).toHaveAttribute("href", "/admin/profile");
    expect(screen.queryByRole("link", { name: /Billing/ })).toBeNull();
  });

  it("a student does NOT see the admin link, and keeps Profile + Billing", () => {
    asUser("student");
    open();
    expect(screen.queryByRole("link", { name: /Admin dashboard/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Profile/ })).toHaveAttribute("href", "/dashboard/profile");
    expect(screen.getByRole("link", { name: /Billing/ })).toHaveAttribute("href", "/dashboard/billing");
  });

  it("closed menu renders no links", () => {
    asUser("admin");
    render(<UserMenu userMenuOpen={false} setUserMenuOpen={() => {}} />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});
