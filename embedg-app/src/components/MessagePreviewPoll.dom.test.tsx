import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { Poll } from "../discord/schema";
import MessagePreviewPoll, { formatPollDuration } from "./MessagePreviewPoll";

const poll: Poll = {
  question: { text: "Pizza or pasta?" },
  answers: [
    { poll_media: { text: "Pizza", emoji: { name: "🍕", animated: false } } },
    {
      poll_media: {
        text: "Pasta",
        emoji: { id: "123", name: "pasta", animated: false },
      },
    },
  ],
  duration: 24,
  allow_multiselect: false,
};

test("shows the question, the answers and how long the poll stays open", () => {
  render(<MessagePreviewPoll poll={poll} />);

  expect(screen.getByText("Pizza or pasta?")).toBeInTheDocument();
  expect(screen.getByText("Select one answer")).toBeInTheDocument();
  expect(screen.getByText("Pizza")).toBeInTheDocument();
  expect(screen.getByText("Pasta")).toBeInTheDocument();
  expect(screen.getByText(/0 votes/)).toHaveTextContent("24 hours left");
  expect(screen.getByAltText("pasta")).toHaveAttribute(
    "src",
    "https://cdn.discordapp.com/emojis/123.webp",
  );
});

test("says so when more than one answer can be picked", () => {
  render(<MessagePreviewPoll poll={{ ...poll, allow_multiselect: true }} />);

  expect(screen.getByText("Select one or more answers")).toBeInTheDocument();
});

test("counts the time left in days from two days on", () => {
  expect(formatPollDuration(1)).toBe("1 hour left");
  expect(formatPollDuration(47)).toBe("47 hours left");
  expect(formatPollDuration(72)).toBe("3 days left");
  expect(formatPollDuration(768)).toBe("32 days left");
});
