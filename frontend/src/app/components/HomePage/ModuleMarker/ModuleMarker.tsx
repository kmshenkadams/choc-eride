"use client";

import { useRouter } from "next/navigation";
import { KeyboardEvent, MutableRefObject, ReactNode, useState } from "react";

import { showErrorToast } from "../../../utils/toastUtils";
import { ModuleNumbers, UserData } from "../ModuleMap/ModuleMap";

import styles from "./ModuleMarker.module.css";

type ModuleMarkerProps = {
  bikeIsAnimating: MutableRefObject<boolean>;
  moduleNumber: ModuleNumbers;
  userData: UserData;
  cx: string;
  cy: string;
  children?: ReactNode;
};

export default function ModuleMarker({
  bikeIsAnimating,
  userData,
  moduleNumber,
  cx,
  cy,
  children,
}: ModuleMarkerProps) {
  const modulePreview = userData.currentModule;
  const isModuleAccessible = modulePreview >= moduleNumber;
  const isModuleCompleted = userData.lastCompletedModule >= moduleNumber;
  const isModuleNavigatable = userData.lastCompletedModule >= moduleNumber - 1;
  const isLocked = !isModuleNavigatable;
  const isCurrent = modulePreview === moduleNumber;

  const status = isModuleCompleted
    ? "completed"
    : isCurrent
      ? "current"
      : isModuleNavigatable
        ? "available"
        : "locked";

  const accessibleName = `Module map marker ${moduleNumber} (${status})`;
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const activateMarker = () => {
    if (!isModuleNavigatable) {
      showErrorToast("This module is locked!");
      return;
    }

    if (bikeIsAnimating.current) {
      return;
    }

    router.push(`/module${moduleNumber}`);
  };

  const handleActivation = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    activateMarker();
  };

  return (
    <>
      <g
        role="button"
        tabIndex={0}
        aria-label={accessibleName}
        aria-disabled={isLocked || undefined}
        aria-current={isCurrent ? "page" : undefined}
        onClick={activateMarker}
        onKeyDown={handleActivation}
        onFocus={() => {
          setIsFocused(true);
        }}
        onBlur={() => {
          setIsFocused(false);
        }}
        className={[
          isModuleAccessible ? styles.active : "",
          isModuleCompleted ? styles.completed : "",
          isModuleNavigatable ? styles.navigatable : "",
          !isModuleAccessible && !isModuleNavigatable ? styles.disabled : "",
          isFocused ? styles.focused : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
        <title>{accessibleName}</title>
        <text
          className={styles.marker_text}
          x={cx}
          y={cy}
          fill="var(--marker-color)"
          textAnchor="middle"
          dominantBaseline="middle"
          aria-hidden="true"
        >
          {moduleNumber}
        </text>
      </g>
    </>
  );
}
