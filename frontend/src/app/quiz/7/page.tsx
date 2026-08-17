import ModuleGate from "../../components/ModuleGate/ModuleGate";
import Sidebar from "../../components/Sidebar/Sidebar";
import { Quiz } from "../../components/quiz_components/Quiz";

import styles from "./Quiz7.module.css";
import { quiz7Questions } from "./questions";

export default function Quiz7() {
  return (
    <ModuleGate module={7}>
      <div className={styles.quizContainer}>
        <div className={styles.hideMobile}>
          <Sidebar currentlyOn={7} />
        </div>
        <Quiz
          title="Module 7 Quiz"
          description="There is no time limit. You have unlimited attempts, however you will not be able to revisit previous attempts."
          questions={quiz7Questions}
          module={7}
        />
      </div>
    </ModuleGate>
  );
}
