import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateTimePicker } from "./DateTimePicker";

describe("DateTimePicker", () => {
  it("shows the placeholder when no value is provided", () => {
    render(<DateTimePicker />);
    expect(screen.getByText("Select date and time")).toBeInTheDocument();
  });

  it("shows a custom placeholder when provided", () => {
    render(<DateTimePicker placeholder="Pick a time" />);
    expect(screen.getByText("Pick a time")).toBeInTheDocument();
  });

  it("shows the formatted value when a value is provided", () => {
    render(<DateTimePicker value="2024-01-05T12:30" />);
    expect(screen.getByText("2024-01-05 12:30")).toBeInTheDocument();
  });

  it("disables the trigger button when disabled", () => {
    render(<DateTimePicker disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("opens the popover on click", async () => {
    const user = userEvent.setup();
    render(<DateTimePicker />);
    await user.click(screen.getByRole("button"));
    expect(document.querySelector("table")).toBeTruthy();
  });

  it("fires onChange with a formatted datetime when a day is picked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DateTimePicker onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    // Find the day-15 button inside the calendar grid.
    const day15 = await screen.findByText("15");
    await user.click(day15);

    expect(onChange).toHaveBeenCalledTimes(1);
    const val = onChange.mock.calls[0][0];
    expect(val).toMatch(/^\d{4}-\d{2}-15T\d{2}:\d{2}$/);
    // Display now shows the selected date + time.
    expect(screen.getByText(/^\d{4}-\d{2}-15 \d{2}:\d{2}$/)).toBeInTheDocument();
  });

  it("clears the selection when the picked day is clicked again", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DateTimePicker value="2024-01-15T10:00" onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    const day15 = await screen.findByText("15");
    await user.click(day15); // select 15 (it is already selected)
    const day15b = await screen.findByText("15");
    await user.click(day15b); // clicking again clears the selection
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("updates the time and emits onChange when a date is selected", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DateTimePicker value="2024-01-15T10:00" onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    const timeInput = document.querySelector('input[type="time"]')!;
    fireEvent.change(timeInput as HTMLElement, { target: { value: "14:30" } });
    expect(onChange).toHaveBeenCalledWith("2024-01-15T14:30");
  });

  it("does not emit onChange when time changes without a selected date", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<DateTimePicker onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    const timeInput = document.querySelector('input[type="time"]')!;
    await user.clear(timeInput as HTMLElement);
    await user.type(timeInput as HTMLElement, "14:30");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reflects an externally changed value via rerender", () => {
    const { rerender } = render(<DateTimePicker value="2024-01-05T12:30" />);
    expect(screen.getByText("2024-01-05 12:30")).toBeInTheDocument();
    rerender(<DateTimePicker value="2024-02-20T08:15" />);
    expect(screen.getByText("2024-02-20 08:15")).toBeInTheDocument();
  });

  it("falls back to the placeholder when the external value is cleared", () => {
    const { rerender } = render(<DateTimePicker value="2024-01-05T12:30" />);
    rerender(<DateTimePicker value={undefined} />);
    expect(screen.getByText("Select date and time")).toBeInTheDocument();
  });
});
