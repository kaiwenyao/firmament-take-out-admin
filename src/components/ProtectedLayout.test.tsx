import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProtectedLayout from "./ProtectedLayout";

const mockNavigate = vi.fn();

// Mock react-router-dom so we can assert on the Navigate component.
vi.mock("react-router-dom", () => ({
  Navigate: (props: any) => {
    mockNavigate(props);
    return <div data-testid="navigate" />;
  },
  Outlet: () => <div data-testid="outlet" />,
}));

beforeEach(() => {
  mockNavigate.mockClear();
  localStorage.clear();
});

describe("ProtectedLayout", () => {
  it("redirects to /login when there is no token", () => {
    render(<ProtectedLayout />);
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/login", replace: true })
    );
    expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();
  });

  it("renders the outlet when a token is present", () => {
    localStorage.setItem("token", "abc");
    render(<ProtectedLayout />);
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });
});
