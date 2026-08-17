"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { put } from "../../api/requests";
import { useAuth } from "../../contexts/AuthContext";
import { auth } from "../../firebase-config.js";
import { showErrorToast } from "../../utils/toastUtils";

import { ExitNotif } from "./ExitNotif";
import { Grade } from "./Grade";
import { MultiSelectQuestion } from "./MultiSelectQuestion";
import { NextButtons } from "./NextButtons";
import { Question } from "./Question";
import styles from "./Quiz.module.css";
import { Submit } from "./Submit";
import { SubmitNotif } from "./SubmitNotif";
import { calculateQuizScore, getNextModule } from "./quizLogic";

import type { Question as QuizQuestion } from "./quizLogic";

export type { Question } from "./quizLogic";

type QuizProps = {
  title: string;
  description: string;
  questions: QuizQuestion[];
  module: number;
  randomized?: boolean;
};

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function shuffleQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return shuffleArray(
    questions.map((q: QuizQuestion) => {
      const letters = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H."];
      const shuffledOptions = shuffleArray(q.options);

      if (q.type === "multiple") {
        const correctAnswerIndices = (q.correctAnswer as string[]).map((answer) =>
          letters.indexOf(answer),
        );
        const correctOptionTexts = correctAnswerIndices.map((index) => q.options[index]);

        const newCorrectAnswers = correctOptionTexts.map((text) => {
          const newIndex = shuffledOptions.indexOf(text);
          return letters[newIndex];
        });

        return {
          ...q,
          options: shuffledOptions,
          correctAnswer: newCorrectAnswers,
        };
      } else {
        const correctOptionIndex = letters.indexOf(q.correctAnswer as string);
        const correctOptionText = q.options[correctOptionIndex];
        const newCorrectIndex = shuffledOptions.indexOf(correctOptionText);
        const newCorrectAnswer = letters[newCorrectIndex];

        return {
          ...q,
          options: shuffledOptions,
          correctAnswer: newCorrectAnswer,
        };
      }
    }),
  );
}

export const Quiz = ({
  title,
  description,
  questions: originalQuestions,
  module,
  randomized = true,
}: QuizProps) => {
  const router = useRouter();
  const { currentUser, refreshUser } = useAuth();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string[]>>({});
  const [cancel, setCancel] = useState<boolean>(false);
  const [checkSubmit, setCheckSubmit] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [label, setLabel] = useState<string>("Next Module");
  const [quizTitle, setTitle] = useState<string>(title);
  const [score, setScore] = useState<number>(0);
  const [randomizedQuestions, setRandomizedQuestions] = useState<QuizQuestion[]>(originalQuestions);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only warn if quiz is in progress (not submitted and has answers)
      const hasAnswers = Object.keys(selectedAnswers).length > 0;
      const shouldWarn = !submitted && hasAnswers;

      if (shouldWarn) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
        return ""; // Required for other browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [submitted, selectedAnswers]);

  // Initialize quiz questions with proper randomization
  useEffect(() => {
    if (randomized) {
      setRandomizedQuestions(shuffleQuestions(originalQuestions));
    } else {
      setRandomizedQuestions(originalQuestions);
    }
    setReady(true);
  }, [originalQuestions, randomized]);

  const handlePressCancel = () => {
    setCancel(!cancel);
  };

  const handleNextModule = () => {
    setCancel(false);

    if (score < 75) {
      setSelectedAnswers({});
      setSubmitted(false);
      setScore(0);
      setTitle(title);
      if (module === 9) {
        setLabel("Open Certificate");
      } else {
        setLabel("Next Module");
      }

      if (randomized) {
        setRandomizedQuestions(shuffleQuestions(originalQuestions));
      }

      const quizElement = document.getElementById("Quiz");
      if (quizElement) {
        quizElement.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      // Score >= 75, navigate to home (module already updated in handleSubmit)
      if (module === 9) {
        router.push("/certificate");
      } else {
        router.push("/");
      }
    }
  };

  const handleLeave = () => {
    setCancel(false);
    if (module === 9) {
      router.push("/");
    } else {
      router.push(`/module${module}`);
    }
  };

  const handlePressSubmit = () => {
    setCheckSubmit(!checkSubmit);
  };

  const handleSubmit = async () => {
    const calculatedScore = calculateQuizScore(randomizedQuestions, selectedAnswers);

    // Update module immediately if score is >= 75
    if (calculatedScore >= 75 && currentUser) {
      try {
        if (module < currentUser.module) {
          // Quiz module is behind user's current progress - no update needed
        } else if (module === currentUser.module) {
          const nextModule = getNextModule(currentUser.module);
          const token = await auth.currentUser?.getIdToken();
          const headers: Record<string, string> | undefined = token
            ? { Authorization: `Bearer ${token}` }
            : undefined;
          await put(`/api/user/update/${currentUser.email}`, { module: nextModule }, headers);

          // Refresh the user data in the context
          await refreshUser();
        } else {
          showErrorToast("Error: User is attempting a quiz ahead of their current progress");
        }
      } catch (error) {
        showErrorToast();
      }
    }

    // Set UI state based on score
    if (calculatedScore < 75) {
      setLabel("Retake Quiz");
    } else {
      if (module === 9) {
        setLabel("Open Certificate");
      } else {
        setLabel("Next Module");
      }
    }

    if (calculatedScore < 75 && calculatedScore > 74) {
      setScore(Math.floor(calculatedScore));
    } else {
      setScore(Math.round(calculatedScore));
    }

    const quizElement = document.getElementById("Quiz");
    if (quizElement) {
      quizElement.scrollTo({ top: 0, behavior: "smooth" });
    }

    setTitle(quizTitle + " Results");
    setSubmitted(true);
    setCheckSubmit(false);
  };

  const handleSelect = (questionIndex: number, answer: string) => {
    if (submitted) return;

    setSelectedAnswers((prev) => {
      const currentAnswers = prev[questionIndex] || [];
      const isMultiSelect = randomizedQuestions[questionIndex].type === "multiple";

      if (isMultiSelect) {
        const newAnswers = currentAnswers.includes(answer)
          ? currentAnswers.filter((a) => a !== answer)
          : [...currentAnswers, answer];
        return { ...prev, [questionIndex]: newAnswers };
      } else {
        return { ...prev, [questionIndex]: [answer] };
      }
    });
  };

  return (
    <div id="Quiz" className={styles.bigDiv}>
      <div className={styles.exitQuiz}>
        {!submitted && (
          <div className={styles.exit}>
            <Image
              src={"/close.svg"}
              width={24}
              height={24}
              alt="Exit Image"
              style={{ cursor: "pointer" }}
              onClick={handlePressCancel}
            />
            <span className={styles.exitText} onClick={handlePressCancel}>
              Exit Quiz
            </span>
          </div>
        )}
        <div className={styles.entireQuiz}>
          {submitted && <Grade score={score} />}
          <div className={styles.quizBox}>
            {cancel && (
              <div className={styles.overlay}>
                <ExitNotif cancelFunc={handlePressCancel} exitFunc={handleLeave} />
              </div>
            )}
            {checkSubmit && (
              <div className={styles.overlay}>
                <SubmitNotif cancelFunc={handlePressSubmit} submitFunc={handleSubmit} />
              </div>
            )}
            <div className={styles.title}>
              <span className={styles.titleFont}>{quizTitle}</span>
              {!submitted && <span className={styles.descriptionFont}>{description}</span>}
            </div>
            <div className={styles.questionList}>
              {ready &&
                randomizedQuestions.map((q, index) =>
                  q.type === "multiple" ? (
                    <MultiSelectQuestion
                      key={index}
                      question={`${index + 1}. ${q.question}`}
                      subQuestion={q.subQuestion}
                      image={q.image}
                      imageW={q.imageW}
                      imageH={q.imageH}
                      options={q.options}
                      selected={selectedAnswers[index] || []}
                      onSelect={(answer) => {
                        handleSelect(index, answer);
                      }}
                      isSubmitted={submitted}
                      correctAnswers={q.correctAnswer as string[]}
                    />
                  ) : (
                    <Question
                      key={index}
                      question={`${index + 1}. ${q.question}`}
                      subQuestion={q.subQuestion}
                      image={q.image}
                      imageW={q.imageW}
                      imageH={q.imageH}
                      options={q.options}
                      selected={
                        (selectedAnswers[index]?.[0] as
                          | "A."
                          | "B."
                          | "C."
                          | "D."
                          | "E."
                          | "F."
                          | "G."
                          | "H.") ?? null
                      }
                      onSelect={(answer) => {
                        handleSelect(index, answer);
                      }}
                      isSubmitted={submitted}
                      isCorrect={selectedAnswers[index]?.[0] === q.correctAnswer}
                      correctAnswer={q.correctAnswer as string}
                    />
                  ),
                )}
            </div>
            {ready && !submitted && <Submit handleSubmit={handlePressSubmit} />}
            {submitted && (
              <div className={styles.nextModule}>
                <NextButtons kind="primary" label={label} handleClick={handleNextModule} />
                <NextButtons kind="secondary" label="Go Back" handleClick={handleLeave} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
