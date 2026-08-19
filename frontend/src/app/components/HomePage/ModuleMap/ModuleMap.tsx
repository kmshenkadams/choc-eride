"use client";

import { useRef } from "react";

import { useLearningProgress } from "../../../contexts/LearningProgressContext";
import AnimatedPath from "../AnimatedPath/AnimatedPath";
import BackgroundPaths from "../BackgroundPaths/BackgroundPaths";
import Bike from "../Bike/Bike";
import ForegroundPaths from "../ForegroundPaths/ForegroundPaths";
import MaskDefinitions from "../MaskDefinitions/MaskDefinitions";
import ModuleMarker from "../ModuleMarker/ModuleMarker";

import styles from "./ModuleMap.module.css";
import { moduleMarkerData } from "./moduleMarkerData";

export type ModuleNumbers = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type UserData = {
  currentModule: ModuleNumbers;
  lastCompletedModule: ModuleNumbers;
};

export default function ModuleMap() {
  const { currentModule } = useLearningProgress();
  const userData: UserData = {
    currentModule: currentModule as ModuleNumbers,
    lastCompletedModule: Math.max(0, currentModule - 1) as ModuleNumbers,
  };
  const bikeIsAnimating = useRef(false);

  return (
    <div className={styles.svg_container}>
      <svg
        className={styles.svg}
        width="1151"
        height="1024"
        viewBox="0 0 1151 1024"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {userData.currentModule && (
          <MaskDefinitions
            modulePreview={userData.currentModule}
            initialModule={userData.lastCompletedModule}
          />
        )}

        {!userData.currentModule && (
          <MaskDefinitions
            modulePreview={userData.currentModule}
            initialModule={userData.lastCompletedModule}
          />
        )}

        <BackgroundPaths />
        {moduleMarkerData.map((moduleMarker, index) => (
          <ModuleMarker
            key={"module-marker-" + index}
            bikeIsAnimating={bikeIsAnimating}
            userData={userData}
            moduleNumber={moduleMarker.number}
            cx={moduleMarker.cx}
            cy={moduleMarker.cy}
          >
            <path d={moduleMarker.pathD} fill="var(--marker-color)" />
            <circle cx={moduleMarker.cx} cy={moduleMarker.cy} r="28.5" fill="white" />
          </ModuleMarker>
        ))}
        <AnimatedPath bikeIsAnimating={bikeIsAnimating} modulePreview={userData.currentModule} />
        <Bike
          bikeIsAnimating={bikeIsAnimating}
          modulePreview={userData.currentModule}
          initialModule={userData.lastCompletedModule}
        />
        <ForegroundPaths />
      </svg>
    </div>
  );
}
