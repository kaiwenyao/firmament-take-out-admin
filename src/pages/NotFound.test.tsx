import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "./NotFound";

describe("NotFound page", () => {
  it("renders the not-found heading", () => {
    render(<NotFound />);
    expect(
      screen.getByText("Page not found")
    ).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<NotFound />);
    expect(
      screen.getByText("The page you requested does not exist.")
    ).toBeInTheDocument();
  });
});
