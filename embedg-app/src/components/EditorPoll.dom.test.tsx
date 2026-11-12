import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { useCollapsedStatesStore } from "../state/collapsed";
import { currentMessage, loadMessage, renderEditor } from "../test/editor";
import EditorPoll from "./EditorPoll";

const poll = {
  question: { text: "Pizza or pasta?" },
  answers: [
    { poll_media: { text: "Pizza" } },
    { poll_media: { text: "Pasta" } },
  ],
  duration: 24,
  allow_multiselect: false,
};

// The section starts collapsed, and the state outlives a test.
beforeEach(() => useCollapsedStatesStore.setState({ states: {} }));

function open() {
  fireEvent.click(screen.getByText("Poll"));
}

test("adding a poll starts with a question and two answers", () => {
  loadMessage({ content: "Vote!" });
  renderEditor(<EditorPoll />);
  open();

  expect(currentMessage().poll).toBeUndefined();

  fireEvent.click(screen.getByRole("button", { name: "Add Poll" }));

  expect(currentMessage().poll).toEqual({
    question: { text: "" },
    answers: [{ poll_media: { text: "" } }, { poll_media: { text: "" } }],
    duration: 24,
    allow_multiselect: false,
  });
  expect(screen.getByLabelText("Answer 2")).toBeInTheDocument();
});

test("editing the question and the answers changes the message", () => {
  loadMessage({ poll });
  renderEditor(<EditorPoll />);
  open();

  fireEvent.change(screen.getByLabelText("Question"), {
    target: { value: "Tea or coffee?" },
  });
  fireEvent.change(screen.getByLabelText("Answer 2"), {
    target: { value: "Coffee" },
  });

  expect(currentMessage().poll?.question.text).toBe("Tea or coffee?");
  expect(currentMessage().poll?.answers.map((a) => a.poll_media.text)).toEqual([
    "Pizza",
    "Coffee",
  ]);
});

test("answers can be added until Discord's limit and removed again", () => {
  loadMessage({ poll });
  renderEditor(<EditorPoll />);
  open();

  for (let i = 0; i < 8; i++) {
    fireEvent.click(screen.getByRole("button", { name: "Add Answer" }));
  }
  expect(currentMessage().poll?.answers).toHaveLength(10);
  expect(screen.getByRole("button", { name: "Add Answer" })).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: "Remove answer 1" }));

  expect(currentMessage().poll?.answers).toHaveLength(9);
  expect(currentMessage().poll?.answers[0].poll_media.text).toBe("Pasta");
});

test("the last answer can't be removed", () => {
  loadMessage({
    poll: { ...poll, answers: [{ poll_media: { text: "Pizza" } }] },
  });
  renderEditor(<EditorPoll />);
  open();

  expect(
    screen.getByRole("button", { name: "Remove answer 1" }),
  ).toBeDisabled();
});

test("duration and multiple answers can be changed", () => {
  loadMessage({ poll });
  renderEditor(<EditorPoll />);
  open();

  fireEvent.change(screen.getByLabelText("Duration"), {
    target: { value: "168" },
  });
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Allow multiple answers" }),
  );

  expect(currentMessage().poll?.duration).toBe(168);
  expect(currentMessage().poll?.allow_multiselect).toBe(true);
});

test("a duration the list doesn't offer is kept", () => {
  loadMessage({ poll: { ...poll, duration: 30 } });
  renderEditor(<EditorPoll />);
  open();

  expect(screen.getByLabelText("Duration")).toHaveValue("30");
  expect(screen.getByRole("option", { name: "30 hours" })).toBeInTheDocument();
});

test("removing the poll takes it out of the message", () => {
  loadMessage({ content: "Vote!", poll });
  renderEditor(<EditorPoll />);
  open();

  fireEvent.click(screen.getByRole("button", { name: "Remove Poll" }));

  expect(currentMessage().poll).toBeUndefined();
  expect(screen.getByRole("button", { name: "Add Poll" })).toBeInTheDocument();
});
