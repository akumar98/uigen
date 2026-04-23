import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackDialog } from "../FeedbackDialog";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

// Open the dialog — shared helper used across tests
const openDialog = async () => {
  await userEvent.click(screen.getByRole("button", { name: /give feedback/i }));
};

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

afterEach(() => {
  cleanup();
});

test("renders feedback trigger button", () => {
  render(<FeedbackDialog />);
  expect(screen.getByRole("button", { name: /give feedback/i })).toBeDefined();
});

test("dialog is not visible by default", () => {
  render(<FeedbackDialog />);
  expect(screen.queryByTestId("dialog")).toBeNull();
});

test("opens dialog when trigger button is clicked", async () => {
  render(<FeedbackDialog />);
  await openDialog();
  expect(screen.getByTestId("dialog")).toBeDefined();
  expect(screen.getByRole("heading", { name: "Send Feedback" })).toBeDefined();
});

test("shows description text in dialog", async () => {
  render(<FeedbackDialog />);
  await openDialog();
  expect(screen.getByText(/help us improve uigen/i)).toBeDefined();
});

test("textarea accepts input", async () => {
  render(<FeedbackDialog />);
  await openDialog();

  const textarea = screen.getByRole("textbox", { name: /your feedback/i });
  await userEvent.type(textarea, "Great app!");
  expect((textarea as HTMLTextAreaElement).value).toBe("Great app!");
});

test("submit button is disabled when textarea is empty", async () => {
  render(<FeedbackDialog />);
  await openDialog();

  expect(
    screen.getByRole("button", { name: /^send feedback$/i })
  ).toHaveProperty("disabled", true);
});

test("submit button is enabled when textarea has content", async () => {
  render(<FeedbackDialog />);
  await openDialog();

  await userEvent.type(
    screen.getByRole("textbox", { name: /your feedback/i }),
    "Great app!"
  );

  expect(
    screen.getByRole("button", { name: /^send feedback$/i })
  ).toHaveProperty("disabled", false);
});

test("submit button is disabled when input is only whitespace", async () => {
  render(<FeedbackDialog />);
  await openDialog();

  await userEvent.type(
    screen.getByRole("textbox", { name: /your feedback/i }),
    "   "
  );

  expect(
    screen.getByRole("button", { name: /^send feedback$/i })
  ).toHaveProperty("disabled", true);
});

test("shows success message after successful submission", async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

  render(<FeedbackDialog />);
  await openDialog();
  await userEvent.type(
    screen.getByRole("textbox", { name: /your feedback/i }),
    "Great app!"
  );
  await userEvent.click(
    screen.getByRole("button", { name: /^send feedback$/i })
  );

  await waitFor(() => {
    expect(screen.getByTestId("feedback-success")).toBeDefined();
    expect(screen.getByText(/thanks for your feedback/i)).toBeDefined();
  });
});

test("hides textarea after successful submission", async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

  render(<FeedbackDialog />);
  await openDialog();
  await userEvent.type(
    screen.getByRole("textbox", { name: /your feedback/i }),
    "Nice!"
  );
  await userEvent.click(
    screen.getByRole("button", { name: /^send feedback$/i })
  );

  await waitFor(() => {
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});

test("shows error message when server returns non-ok response", async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

  render(<FeedbackDialog />);
  await openDialog();
  await userEvent.type(
    screen.getByRole("textbox", { name: /your feedback/i }),
    "Great app!"
  );
  await userEvent.click(
    screen.getByRole("button", { name: /^send feedback$/i })
  );

  await waitFor(() => {
    expect(screen.getByText(/something went wrong/i)).toBeDefined();
  });
});

test("shows error message when fetch throws", async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
    new Error("Network error")
  );

  render(<FeedbackDialog />);
  await openDialog();
  await userEvent.type(
    screen.getByRole("textbox", { name: /your feedback/i }),
    "Great app!"
  );
  await userEvent.click(
    screen.getByRole("button", { name: /^send feedback$/i })
  );

  await waitFor(() => {
    expect(screen.getByText(/something went wrong/i)).toBeDefined();
  });
});

test("form remains after error so user can retry", async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });

  render(<FeedbackDialog />);
  await openDialog();
  await userEvent.type(
    screen.getByRole("textbox", { name: /your feedback/i }),
    "Great app!"
  );
  await userEvent.click(
    screen.getByRole("button", { name: /^send feedback$/i })
  );

  await waitFor(() => screen.getByText(/something went wrong/i));

  expect(screen.getByRole("textbox", { name: /your feedback/i })).toBeDefined();
});

test("disables textarea and submit button while submitting", async () => {
  let resolveSubmit!: (v: unknown) => void;
  const pending = new Promise((res) => {
    resolveSubmit = res;
  });
  (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(pending);

  render(<FeedbackDialog />);
  await openDialog();
  await userEvent.type(
    screen.getByRole("textbox", { name: /your feedback/i }),
    "Great app!"
  );

  userEvent.click(screen.getByRole("button", { name: /^send feedback$/i }));

  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: /sending/i })
    ).toHaveProperty("disabled", true);
    expect(
      (
        screen.getByRole("textbox", {
          name: /your feedback/i,
        }) as HTMLTextAreaElement
      ).disabled
    ).toBe(true);
  });

  resolveSubmit({ ok: true });
});

test("cancel button closes the dialog", async () => {
  render(<FeedbackDialog />);
  await openDialog();
  expect(screen.getByTestId("dialog")).toBeDefined();

  await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
  expect(screen.queryByTestId("dialog")).toBeNull();
});

test("dialog resets content when reopened after cancel", async () => {
  render(<FeedbackDialog />);
  await openDialog();
  await userEvent.type(
    screen.getByRole("textbox", { name: /your feedback/i }),
    "Some text"
  );
  await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

  await openDialog();

  expect(
    (
      screen.getByRole("textbox", {
        name: /your feedback/i,
      }) as HTMLTextAreaElement
    ).value
  ).toBe("");
});

test("calls fetch with correct payload", async () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });

  render(<FeedbackDialog />);
  await openDialog();
  await userEvent.type(
    screen.getByRole("textbox", { name: /your feedback/i }),
    "Great app!"
  );
  await userEvent.click(
    screen.getByRole("button", { name: /^send feedback$/i })
  );

  await waitFor(() => screen.getByTestId("feedback-success"));

  expect(global.fetch).toHaveBeenCalledWith("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Great app!" }),
  });
});
