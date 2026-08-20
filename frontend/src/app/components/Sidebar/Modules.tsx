"use client";
import { useRouter } from "next/navigation";

import { showErrorToast } from "../../utils/toastUtils";

import { Module } from "./Module";
import styles from "./Modules.module.css";

type Props = {
  isCollapsed?: boolean;
  currentModule?: number;
  earnedCert?: boolean;
  currentlyOn?: number | null;
};

export const Modules = ({
  isCollapsed = false,
  currentModule = 1,
  earnedCert = false,
  currentlyOn = null,
}: Props) => {
  const router = useRouter();

  let buttonClass = styles.moduleContainer;
  if (isCollapsed) {
    buttonClass += ` ${styles.collapsed}`;
  }

  const handleClick = (moduleNumber: number) => {
    if (moduleNumber > currentModule) {
      showErrorToast("This module is locked!");
      return;
    }

    if (moduleNumber === 9) {
      router.push(earnedCert ? "/certificate" : "/final-test");
    } else {
      router.push(`/module${moduleNumber}`);
    }
  };

  const moduleData = [
    { name: "What is an E Bike?", time: 11, number: 1 },
    { name: "Maintaining Your E Bike", time: 7, number: 2 },
    { name: "Safety Equipment", time: 7, number: 3 },
    { name: "5 Need to Know Principles", time: 8, number: 4 },
    { name: "Rules of the Road", time: 10, number: 5 },
    { name: "In Case of a Collision", time: 5, number: 6 },
    { name: "Teen & Parent Awareness", time: 6, number: 7 },
    { name: "Closing Video", time: 9, number: 8 },
    { name: "Test", time: 10, number: 9, addLine: false },
  ];

  return (
    <div>
      <div className={buttonClass}>
        <span className={styles.title}>Modules</span>
      </div>
      <div className={styles.modules}>
        {moduleData.map((module) => {
          // Determine module kind based on its number compared to currentModule
          let kind: "primary" | "inactive" | "complete" = "inactive";
          const isLocked = module.number > currentModule;
          if (module.number < currentModule) {
            kind = "complete";
          } else if (module.number === currentModule) {
            kind = "primary";
          }

          return (
            <Module
              key={module.number}
              isCollapsed={isCollapsed}
              moduleName={module.name}
              moduleTime={module.time}
              moduleNumber={module.number}
              handleClick={() => {
                handleClick(module.number);
              }}
              kind={kind}
              isLocked={isLocked}
              highlighted={currentlyOn !== null && currentlyOn === module.number}
              addLine={module.addLine !== false}
            />
          );
        })}
      </div>
    </div>
  );
};
