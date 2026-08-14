"use client";

import { applyActionCode } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LoginButton } from "../components/LoginButton";
import WelcomePanel from "../components/WelcomePanel/WelcomePanel";
import { auth } from "../firebase-config.js";

import styles from "./Auth.module.css";

export default function Auth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionExecuted = useRef(false);

  const [titleMessage, setTitleMessage] = useState("Redirecting...");
  const [message, setMessage] = useState("Please wait a moment...");
  const [hasError, setHasError] = useState(false);

  const redirect = () => {
    window.location.href = "/signin";
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && hasError) {
      event.preventDefault();
      redirect();
    }
  };

  useEffect(() => {
    if (actionExecuted.current) return;
    actionExecuted.current = true;

    const run = async () => {
      await new Promise((res) => {
        setTimeout(res, 250);
      });

      const urlParams = new URLSearchParams(window.location.search);
      const mode = searchParams.get("mode") ?? urlParams.get("mode");
      const oobCode = searchParams.get("oobCode") ?? urlParams.get("oobCode");

      // Firebase can consume the verification code before returning to the
      // configured continuation URL. In that flow, /auth has no query string.
      if (!mode && !oobCode) {
        router.replace("/emailverified");
        return;
      }

      if (!oobCode) {
        setTitleMessage("Error Authenticating");
        setMessage("The verification link is incomplete. Please request a new email.");
        setHasError(true);
        return;
      }

      switch (mode) {
        case "resetPassword":
          router.replace(`/resetpassword?oobCode=${oobCode}`);
          break;
        case "verifyEmail":
          setTitleMessage("Verifying Email...");
          setMessage("");

          applyActionCode(auth, oobCode)
            .then(() => {
              router.replace("/emailverified");
            })
            .catch((error) => {
              const code = (error as { code?: string })?.code ?? "unknown";

              if (code === "auth/invalid-action-code") {
                setTitleMessage("Your email may already be verified.");
                setMessage("Try signing in again or request a new verification email.");
              } else {
                console.error("Verification error:", error);
                setTitleMessage("Error Verifying Email");
                setMessage("Please try again or contact support.");
              }

              setHasError(true);
            });
          break;
        default:
          setTitleMessage("Error Authenticating");
          setMessage("The verification link is not supported.");
          setHasError(true);
      }
    };

    void run();
  }, [router, searchParams]);

  return (
    <main className={styles.container} onKeyDown={handleKeyDown}>
      <section className={styles.leftSide}>
        <WelcomePanel />
      </section>
      <section className={styles.rightSide}>
        <div className={styles.content}>
          <div className={styles.title}>
            <h1>{titleMessage}</h1>
            <p className={styles.text}>{message}</p>
          </div>
          {hasError && <LoginButton disabled={false} label="Back to Sign In" onClick={redirect} />}
        </div>
      </section>
    </main>
  );
}
