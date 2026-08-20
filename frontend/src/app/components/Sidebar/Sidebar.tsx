"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useLearningProgress } from "../../contexts/LearningProgressContext";

import { MapButton } from "./MapButton";
import { Modules } from "./Modules";
import { ProgressBar } from "./ProgressBar";
import { RestartCourseButton } from "./RestartCourseButton";
import styles from "./Sidebar.module.css";

type SidebarProps = {
  isHomePage?: boolean;
  currentlyOn?: number | null;
};

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed-state";

export default function Sidebar({ isHomePage = false, currentlyOn = null }: SidebarProps) {
  const { currentModule, restart } = useLearningProgress();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedState = sessionStorage.getItem(SIDEBAR_STORAGE_KEY);
        return savedState !== null ? (JSON.parse(savedState) as boolean) : false;
      } catch {
        return false;
      }
    }
    return false;
  });
  const percent = Math.round(Math.min(((currentModule - 1) / 9) * 100, 100));
  const router = useRouter();

  const toggleSidebar = () => {
    setIsCollapsed((current) => {
      const next = !current;

      try {
        sessionStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // The sidebar remains usable when browser storage is unavailable.
      }

      return next;
    });
  };

  const handleRestartCourse = () => {
    if (
      !window.confirm(
        "Are you sure you want to restart the course?\nYou will lose all your progress.",
      )
    )
      return;

    restart();
    router.push("/intro-video");
  };

  return (
    <nav className={`${styles.nav} ${isCollapsed ? styles.collapsed : ""}`}>
      <button
        className={`${styles.collapseButton} ${isCollapsed ? styles.open : ""}`}
        onClick={toggleSidebar}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <Image
            src={"/sidebar_expanded_icon.svg"}
            width={23}
            height={18}
            alt="Sidebar Expand Icon"
          />
        ) : (
          <Image
            src={"/sidebar_collapsed_icon.svg"}
            width={23}
            height={18}
            alt="Sidebar Collapse Icon"
          />
        )}
      </button>
      <ProgressBar isCollapsed={isCollapsed} percentage={percent} />
      <MapButton
        isCollapsed={isCollapsed}
        handleClick={() => {
          router.push("/");
        }}
        isHomePage={isHomePage}
      />
      {currentModule === 10 && (
        <RestartCourseButton isCollapsed={isCollapsed} handleClick={handleRestartCourse} />
      )}
      <Modules
        currentModule={currentModule}
        isCollapsed={isCollapsed}
        earnedCert={currentModule === 10}
        currentlyOn={currentlyOn}
      />
    </nav>
  );
}
