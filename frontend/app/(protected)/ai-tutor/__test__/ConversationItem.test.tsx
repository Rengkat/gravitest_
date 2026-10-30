import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import ConversationItem from "../components/ConversationItem";

const convo = { id: "c1", title: "Photosynthesis", lastMessage: "", timestamp: new Date(), messageCount: 2, subject: "general" as const };
const setup = (over: Partial<React.ComponentProps<typeof ConversationItem>> = {}) => {
  const props = {
    conversation: convo,
    active: false,
    onSelect: vi.fn(),
    onRename: vi.fn().mockResolvedValue(true),
    onDelete: vi.fn().mockResolvedValue(true),
    ...over,
  };
  render(<ul><ConversationItem {...props} /></ul>);
  return props;
};

describe("ConversationItem", () => {
  test("clicking the title opens the chat", async () => {
    const p = setup();
    await userEvent.click(screen.getByRole("button", { name: /open conversation: photosynthesis/i }));
    expect(p.onSelect).toHaveBeenCalledTimes(1);
  });

  test("the ⋯ button opens a menu with Rename and Delete; Escape closes it", async () => {
    setup();
    const dots = screen.getByRole("button", { name: /actions for photosynthesis/i });
    expect(dots).toHaveAttribute("aria-haspopup", "menu");
    await userEvent.click(dots);
    expect(screen.getByRole("menuitem", { name: /rename/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  test("Rename: edits inline and saves on Enter", async () => {
    const p = setup();
    await userEvent.click(screen.getByRole("button", { name: /actions for/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /rename/i }));
    const input = screen.getByRole("textbox", { name: /conversation title/i });
    await userEvent.clear(input);
    await userEvent.type(input, "Plants and light{Enter}");
    expect(p.onRename).toHaveBeenCalledWith("Plants and light");
  });

  test("Rename: Escape cancels without saving", async () => {
    const p = setup();
    await userEvent.click(screen.getByRole("button", { name: /actions for/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /rename/i }));
    await userEvent.type(screen.getByRole("textbox"), " extra{Escape}");
    expect(p.onRename).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /open conversation: photosynthesis/i })).toBeInTheDocument();
  });

  test("an empty title is never saved", async () => {
    const p = setup();
    await userEvent.click(screen.getByRole("button", { name: /actions for/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /rename/i }));
    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.keyboard("{Enter}");
    expect(p.onRename).not.toHaveBeenCalled();
  });

  test("Delete asks for confirmation first, and Cancel deletes nothing", async () => {
    const p = setup();
    await userEvent.click(screen.getByRole("button", { name: /actions for/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /delete/i }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent(/can't be undone/i);
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(p.onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  test("confirming Delete calls onDelete once", async () => {
    const p = setup();
    await userEvent.click(screen.getByRole("button", { name: /actions for/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /delete/i }));
    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => expect(p.onDelete).toHaveBeenCalledTimes(1));
  });

  test("a failed delete keeps the chat and closes the dialog so it can be retried", async () => {
    const p = setup({ onDelete: vi.fn().mockResolvedValue(false) });
    await userEvent.click(screen.getByRole("button", { name: /actions for/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /delete/i }));
    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: /open conversation/i })).toBeInTheDocument();
    expect(p.onDelete).toHaveBeenCalledTimes(1);
  });
});
