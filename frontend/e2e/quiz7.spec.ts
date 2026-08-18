import { expect, test } from "@playwright/test";

import { calculateQuizScore, getNextModule } from "../src/app/components/quiz_components/quizLogic";
import { quiz7Questions } from "../src/app/quiz/7/questions";

test.describe("Module 7 quiz COPPA removal", () => {
  test("does not ask the learner to identify as a parent or guardian", () => {
    const quizCopy = quiz7Questions.flatMap((question) => [
      question.question,
      question.subQuestion ?? "",
      ...question.options,
    ]);

    expect(quizCopy).not.toContain("Check with a parent/guardian:");
    expect(quizCopy).not.toContain(
      "I am a parent/guardian and have read and understood the statement above",
    );
    expect(quiz7Questions[1].question).toBe(
      "Which behavior best demonstrates positive role modeling for young E Bike riders?",
    );
  });

  test("can still be completed and advances progress from module 7 to module 8", () => {
    const selectedAnswers: Record<number, string[]> = {};

    quiz7Questions.forEach((question, index) => {
      selectedAnswers[index] = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer];
    });

    const score = calculateQuizScore(quiz7Questions, selectedAnswers);

    expect(score).toBe(100);
    expect(score).toBeGreaterThanOrEqual(75);
    expect(getNextModule(7)).toBe(8);
  });
});
