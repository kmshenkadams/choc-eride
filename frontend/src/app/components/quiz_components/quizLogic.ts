export type Question = {
  question: string;
  subQuestion?: string;
  image?: string;
  imageW?: number;
  imageH?: number;
  options: string[];
  correctAnswer: string | string[];
  type: "single" | "multiple";
};

export function calculateQuizScore(
  questions: Question[],
  selectedAnswers: Record<number, string[]>,
): number {
  let correctCount = 0;

  for (const [index, answers] of Object.entries(selectedAnswers)) {
    const question = questions[Number(index)];
    if (!question) continue;

    if (question.type === "multiple") {
      const correctAnswers = question.correctAnswer as string[];
      const isCorrect =
        answers.length === correctAnswers.length &&
        answers.every((answer) => correctAnswers.includes(answer));
      if (isCorrect) correctCount++;
    } else if (answers[0] === question.correctAnswer) {
      correctCount++;
    }
  }

  return questions.length === 0 ? 0 : (correctCount / questions.length) * 100;
}

export function getNextModule(currentModule: number): number {
  return Math.min(currentModule + 1, 10);
}
