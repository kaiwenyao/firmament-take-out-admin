import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Sidebar from "./Sidebar";

// NavLink renders its children through a render-prop. We mock it to simply
// render its children so the labels are visible in the DOM.
vi.mock("react-router-dom", () => ({
  NavLink: ({ children, className, ...rest }: any) => (
    <a className={typeof className === "function" ? className({ isActive: false }) : className}>
      {typeof children === "function" ? children({ isActive: false }) : children}
    </a>
  ),
}));

describe("Sidebar", () => {
  it("renders all menu item labels when expanded", () => {
    render(<Sidebar isCollapsed={false} />);
    ["Dashboard", "Statistics", "Orders", "Setmeals", "Dishes", "Categories", "Employees"].forEach(
      (label) => expect(screen.getByText(label)).toBeInTheDocument()
    );
  });

  it("renders the GitHub link", () => {
    render(<Sidebar isCollapsed={false} />);
    expect(screen.getByText("GitHub")).toBeInTheDocument();
  });

  it("uses the expanded width class when not collapsed", () => {
    render(<Sidebar isCollapsed={false} />);
    expect(screen.getByRole("complementary") || document.querySelector("aside")).toBeTruthy();
    const aside = document.querySelector("aside")!;
    expect(aside.className).toContain("w-64");
    expect(aside.className).not.toContain("w-20");
  });

  it("uses the collapsed width class when collapsed", () => {
    render(<Sidebar isCollapsed={true} />);
    const aside = document.querySelector("aside")!;
    expect(aside.className).toContain("w-20");
    expect(aside.className).not.toContain("w-64");
  });

  it("hides the item labels when collapsed", () => {
    render(<Sidebar isCollapsed={true} />);
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Statistics")).not.toBeInTheDocument();
  });
});
