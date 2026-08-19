"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import ModuleIntro from "../components/AllModules/ModuleIntro/ModuleIntro";
import ClosingVideo from "../components/Module8Components/ClosingVideo/ClosingVideo";
import ModuleGate from "../components/ModuleGate/ModuleGate";
import ModuleSliderContainer from "../components/ModuleSliderContainer/ModuleSliderContainer";
import Sidebar from "../components/Sidebar/Sidebar";
import { TitleScreen } from "../components/quiz_components/TitleScreen";
import { useLearningProgress } from "../contexts/LearningProgressContext";

import styles from "./mod8.module.css";

export default function Module8() {
  const router = useRouter();
  const { advanceTo } = useLearningProgress();

  const handleStart = () => {
    advanceTo(9);
    router.push("/final-test");
  };

  return (
    <ModuleGate module={8}>
      <div className={styles.container}>
        <Sidebar currentlyOn={8} />
        <ModuleSliderContainer moduleText="MODULE 8: Closing Video">
          <ModuleIntro
            moduleNumber={8}
            title="Closing Video"
            subtitle="You're Almost There!"
            description={
              <p>
                We hope you found this curriculum educational and empowering! We want to continue
                seeing you enjoy the roads of San Diego safely. Here is a closing video from the
                city of Encinitas that summarizes the key elements of these modules. Happy Riding!
              </p>
            }
            Mascot={
              <Image
                src="/module8/TimmyStudious.svg"
                alt="Timmy, the tire mascot smiling with a pencil and notebook"
                priority
                width={320}
                height={310.11}
                className={styles.mascot}
              />
            }
          />
          <ClosingVideo />
          <TitleScreen finalModule={true} handleStart={handleStart} />
        </ModuleSliderContainer>
      </div>
    </ModuleGate>
  );
}
