"use client";

import Image from "next/image";
import React, { useState } from "react";

import styles from "./RestartCourseButton.module.css";

type Props = {
  isCollapsed?: boolean;
  handleClick: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const RestartCourseButton: React.FC<Props> = ({
  isCollapsed = false,
  handleClick,
  ...props
}) => {
  const [isHovering, setIsHovered] = useState(false);
  const onMouseEnter = () => {
    setIsHovered(true);
  };
  const onMouseLeave = () => {
    setIsHovered(false);
  };

  const buttonClass = `${styles.button}  ${styles.primary}`;
  const Restart = "/restart.svg";
  return (
    <button
      className={isCollapsed ? `${buttonClass} ${styles.collapsed}` : buttonClass}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {!isHovering && <Image src={Restart} width={24} height={20} alt="Restart course icon" />}
      {isHovering && (
        <Image src={"/restart_hover.svg"} width={24} height={20} alt="Restart course icon" />
      )}
      <p className={`${styles.text} ${isCollapsed ? styles.collapsed : ""}`}>Restart Course</p>
    </button>
  );
};
