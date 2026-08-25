import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "./Login";

const mocks = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockLogin: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));
const { mockNavigate, mockLogin, mockToastError, mockToastSuccess } = mocks;

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.mockNavigate,
}));

vi.mock("@/api/auth", () => ({
  employeeLoginAPI: mocks.mockLogin,
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...a: any[]) => mocks.mockToastError(...a),
    success: (...a: any[]) => mocks.mockToastSuccess(...a),
  },
}));

beforeEach(() => {
  mockNavigate.mockClear();
  mockLogin.mockReset();
  mockToastError.mockClear();
  mockToastSuccess.mockClear();
  localStorage.clear();
});

const fill = async (username: string, password: string) => {
  const user = userEvent.setup();
  const uname = screen.getByPlaceholderText("Username");
  const pass = screen.getByPlaceholderText("Password");
  await user.clear(uname);
  await user.type(uname, username);
  await user.clear(pass);
  await user.type(pass, password);
  return user;
};

describe("Login page", () => {
  it("renders the sign-in form", () => {
    render(<Login />);
    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText("View on GitHub")).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<Login />);
    const pass = screen.getByPlaceholderText("Password");
    expect(pass).toHaveAttribute("type", "password");

    const toggle = screen.getByRole("button", { name: /show password/i });
    await user.click(toggle);
    expect(pass).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /hide password/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(pass).toHaveAttribute("type", "password");
  });

  it("redirects to /dashboard when a token already exists", async () => {
    localStorage.setItem("token", "existing");
    render(<Login />);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true }));
  });

  it("shows an error when username is empty", async () => {
    const user = userEvent.setup();
    render(<Login />);
    const uname = screen.getByPlaceholderText("Username");
    const pass = screen.getByPlaceholderText("Password");
    await user.clear(uname); // username defaults to "admin", clear it
    await user.clear(pass);
    await user.type(pass, "123456");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockToastError).toHaveBeenCalledWith("Please enter your username");
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("shows an error when password is empty", async () => {
    const user = userEvent.setup();
    render(<Login />);
    const uname = screen.getByPlaceholderText("Username");
    const pass = screen.getByPlaceholderText("Password");
    await user.clear(pass);
    await user.type(uname, "admin");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(mockToastError).toHaveBeenCalledWith("Please enter your password");
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("logs in successfully and stores credentials", async () => {
    mockLogin.mockResolvedValue({
      token: "tok",
      refreshToken: "rt",
      userName: "admin",
      name: "Admin",
      id: 3,
    });
    render(<Login />);
    const user = await fill("admin", "123456");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ username: "admin", password: "123456" });
      expect(localStorage.getItem("token")).toBe("tok");
      expect(localStorage.getItem("refreshToken")).toBe("rt");
      expect(localStorage.getItem("userName")).toBe("admin");
      expect(localStorage.getItem("userId")).toBe("3");
      expect(mockToastSuccess).toHaveBeenCalledWith("Signed in successfully");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
  });

  it("shows an error when no token is returned", async () => {
    mockLogin.mockResolvedValue({ token: "" });
    render(<Login />);
    const user = await fill("admin", "123456");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Sign-in failed: no token received")
    );
  });

  it("shows the error message when login rejects", async () => {
    mockLogin.mockRejectedValue(new Error("Bad credentials"));
    render(<Login />);
    const user = await fill("admin", "123456");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Bad credentials"));
  });

  it("shows a generic message for an unknown error shape", async () => {
    mockLogin.mockRejectedValue({ weird: true });
    render(<Login />);
    const user = await fill("admin", "123456");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "Sign-in failed. Check your username and password."
      )
    );
  });

  it("shows a string error message directly", async () => {
    mockLogin.mockRejectedValue("server says no");
    render(<Login />);
    const user = await fill("admin", "123456");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("server says no"));
  });
});
