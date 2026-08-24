import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Header from "./Header";

const mocks = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLogout: vi.fn(),
  mockGetStatus: vi.fn(),
  mockSetStatus: vi.fn(),
  mockUpdatePassword: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.mockNavigate }));

vi.mock("@/api/auth", () => ({ employeeLogoutAPI: mocks.mockLogout }));

vi.mock("@/api/shop", () => ({
  getShopStatusAPI: mocks.mockGetStatus,
  setShopStatusAPI: mocks.mockSetStatus,
}));

vi.mock("@/api/employee", () => ({
  updatePasswordAPI: mocks.mockUpdatePassword,
}));

vi.mock("sonner", () => ({
  toast: {
    success: (...a: any[]) => mocks.mockToastSuccess(...a),
    error: (...a: any[]) => mocks.mockToastError(...a),
  },
}));

beforeEach(() => {
  mocks.mockNavigate.mockClear();
  mocks.mockLogout.mockReset();
  mocks.mockGetStatus.mockReset();
  mocks.mockSetStatus.mockReset();
  mocks.mockUpdatePassword.mockReset();
  mocks.mockToastSuccess.mockClear();
  mocks.mockToastError.mockClear();
  localStorage.clear();
  localStorage.setItem("userName", "admin");
  mocks.mockGetStatus.mockResolvedValue(1);
  mocks.mockLogout.mockResolvedValue(undefined);
});

const openStatusDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByText("Business status"));
};

describe("Header", () => {
  it("renders the header with logo, title and toggle button", () => {
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByAltText("Firmament")).toBeInTheDocument();
    expect(screen.getByText("Business status")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls onToggleSidebar when the collapse button is clicked", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<Header onToggleSidebar={onToggle} />);
    await user.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalled();
  });

  it("shows the Open badge when the shop is open", async () => {
    mocks.mockGetStatus.mockResolvedValue(1);
    render(<Header onToggleSidebar={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Open")).toBeInTheDocument());
  });

  it("shows the Closed badge when the shop is closed", async () => {
    mocks.mockGetStatus.mockResolvedValue(0);
    render(<Header onToggleSidebar={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Closed")).toBeInTheDocument());
  });

  it("falls back to open status when fetching the shop status fails", async () => {
    mocks.mockGetStatus.mockRejectedValue(new Error("boom"));
    render(<Header onToggleSidebar={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Open")).toBeInTheDocument());
  });

  it("opens the business status dialog and sets the shop open", async () => {
    mocks.mockGetStatus.mockResolvedValue(0);
    mocks.mockSetStatus.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Closed")).toBeInTheDocument());

    await openStatusDialog(user);
    expect(await screen.findByText("Shop status")).toBeInTheDocument();
    await user.click(screen.getAllByText("Open")[0]);

    await waitFor(() => expect(mocks.mockSetStatus).toHaveBeenCalledWith(1));
    expect(mocks.mockToastSuccess).toHaveBeenCalledWith("Shop is now open");
  });

  it("sets the shop closed from the dialog", async () => {
    mocks.mockGetStatus.mockResolvedValue(1);
    mocks.mockSetStatus.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Open")).toBeInTheDocument());

    await openStatusDialog(user);
    await screen.findByText("Shop status");
    await user.click(screen.getAllByText("Closed")[0]);
    await waitFor(() => expect(mocks.mockSetStatus).toHaveBeenCalledWith(0));
    expect(mocks.mockToastSuccess).toHaveBeenCalledWith("Shop is now closed");
  });

  it("shows an error toast when setting the shop status fails", async () => {
    mocks.mockGetStatus.mockResolvedValue(0);
    mocks.mockSetStatus.mockRejectedValue(new Error("denied"));
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("Closed")).toBeInTheDocument());

    await openStatusDialog(user);
    await screen.findByText("Shop status");
    await user.click(screen.getAllByText("Open")[0]);
    await waitFor(() =>
      expect(mocks.mockToastError).toHaveBeenCalledWith("Could not update shop status", {
        description: "denied",
      })
    );
  });

  it("closes the status dialog via the Cancel button", async () => {
    mocks.mockGetStatus.mockResolvedValue(0);
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await openStatusDialog(user);
    await screen.findByText("Shop status");
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByText("Shop status")).not.toBeInTheDocument());
  });

  it("clears per-field password errors while typing and re-validates confirm password", async () => {
    localStorage.setItem("userId", "3");
    mocks.mockUpdatePassword.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await user.click(screen.getByText("admin"));
    await user.click(await screen.findByText("Change password"));
    await screen.findByText("Current password");

    // Trigger validation errors by submitting empty fields.
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() =>
      expect(mocks.mockToastError).toHaveBeenCalledWith("Validation failed", {
        description: "Please check all fields and try again.",
      })
    );

    // Type confirm first so its value exists, then change new password to trigger re-validation.
    const confirmInput = screen.getByPlaceholderText("Re-enter new password");
    const newInput = screen.getByPlaceholderText(
      "6–20 characters, letters and numbers, case-sensitive"
    );
    const oldInput = screen.getByPlaceholderText("Enter current password");
    await user.type(oldInput, "old123"); // clears oldPassword error
    await user.type(confirmInput, "newpass1"); // clears confirmPassword error
    await user.type(newInput, "newpass1"); // clears newPassword error + re-validates confirm

    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(mocks.mockUpdatePassword).toHaveBeenCalled());
  });

  it("closes the password dialog via the Cancel button", async () => {
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await user.click(screen.getByText("admin"));
    await user.click(await screen.findByText("Change password"));
    await screen.findByText("Current password");
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => expect(screen.queryByText("Current password")).not.toBeInTheDocument());
  });

  it("shows the user name from localStorage in the dropdown", () => {
    localStorage.setItem("userName", "admin");
    render(<Header onToggleSidebar={vi.fn()} />);
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("validates the password form and rejects empty fields", async () => {
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await user.click(screen.getByText("admin"));
    await user.click(await screen.findByText("Change password"));

    await screen.findByText("Current password");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(mocks.mockToastError).toHaveBeenCalledWith("Validation failed", {
        description: "Please check all fields and try again.",
      })
    );
    expect(mocks.mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("submits a valid password change", async () => {
    localStorage.setItem("userId", "3");
    mocks.mockUpdatePassword.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await user.click(screen.getByText("admin"));
    await user.click(await screen.findByText("Change password"));
    await screen.findByText("Current password");

    await user.type(screen.getByPlaceholderText("Enter current password"), "old123");
    await user.type(
      screen.getByPlaceholderText("6–20 characters, letters and numbers, case-sensitive"),
      "newpass1"
    );
    await user.type(screen.getByPlaceholderText("Re-enter new password"), "newpass1");

    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() =>
      expect(mocks.mockUpdatePassword).toHaveBeenCalledWith({
        empId: 3,
        oldPassword: "old123",
        newPassword: "newpass1",
      })
    );
    expect(mocks.mockToastSuccess).toHaveBeenCalledWith("Password updated");
  });

  it("shows an error toast when the password update fails", async () => {
    localStorage.setItem("userId", "3");
    mocks.mockUpdatePassword.mockRejectedValue({
      response: { data: { msg: "Old password is wrong" } },
    });
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await user.click(screen.getByText("admin"));
    await user.click(await screen.findByText("Change password"));
    await screen.findByText("Current password");

    await user.type(screen.getByPlaceholderText("Enter current password"), "wrong1");
    await user.type(
      screen.getByPlaceholderText("6–20 characters, letters and numbers, case-sensitive"),
      "newpass1"
    );
    await user.type(screen.getByPlaceholderText("Re-enter new password"), "newpass1");
    await user.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() =>
      expect(mocks.mockToastError).toHaveBeenCalledWith("Could not change password", {
        description: "Old password is wrong",
      })
    );
  });

  it("signs out and navigates to the login page", async () => {
    const user = userEvent.setup();
    render(<Header onToggleSidebar={vi.fn()} />);
    await user.click(screen.getByText("admin"));
    await user.click(await screen.findByText("Sign out"));

    await waitFor(() => expect(mocks.mockLogout).toHaveBeenCalled());
    expect(mocks.mockToastSuccess).toHaveBeenCalledWith("Signed out");
    expect(mocks.mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });
});
