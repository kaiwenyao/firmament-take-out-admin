import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateRangePicker } from "./DateRangePicker";

describe("DateRangePicker", () => {
  it("shows the placeholder when no dates are selected", () => {
    render(<DateRangePicker />);
    expect(screen.getByText("Select date range")).toBeInTheDocument();
  });

  it("shows a single formatted date when only beginDate is provided", () => {
    render(<DateRangePicker beginDate={new Date(2024, 0, 5)} />);
    expect(screen.getByText("2024-01-05")).toBeInTheDocument();
  });

  it("shows a range when both dates are provided", () => {
    render(
      <DateRangePicker
        beginDate={new Date(2024, 0, 5)}
        endDate={new Date(2024, 0, 15)}
      />
    );
    expect(screen.getByText("2024-01-05 – 2024-01-15")).toBeInTheDocument();
  });

  it("disables the trigger button when disabled", () => {
    render(<DateRangePicker disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("opens the popover and renders a calendar when clicked", async () => {
    const user = userEvent.setup();
    render(<DateRangePicker />);
    await user.click(screen.getByRole("button"));
    // react-day-picker renders a table for the month grid.
    expect(document.querySelector("table")).toBeTruthy();
  });

  it("emits a range when a day in the grid is picked", async () => {
    const onDateChange = vi.fn();
    const user = userEvent.setup();
    render(<DateRangePicker onDateChange={onDateChange} />);
    await user.click(screen.getByRole("button"));
    const cells = Array.from(document.querySelector("table")!.querySelectorAll("td"));
    const day = cells.find((c) => c.textContent?.trim() === "15")!;
    await user.click(day.querySelector("button")!);
    expect(onDateChange).toHaveBeenCalledTimes(1);
    const [from, to] = onDateChange.mock.calls[0];
    expect(from?.getDate()).toBe(15);
    expect(to?.getDate()).toBe(15);
  });

  it("does not close or throw when a start day is selected first", async () => {
    const onDateChange = vi.fn();
    const user = userEvent.setup();
    render(<DateRangePicker onDateChange={onDateChange} />);
    await user.click(screen.getByRole("button"));
    const cells = Array.from(document.querySelector("table")!.querySelectorAll("td"));
    const day = cells.find((c) => c.textContent?.trim() === "8")!;
    await user.click(day.querySelector("button")!);
    expect(onDateChange.mock.calls.length).toBeGreaterThan(0);
  });
});
