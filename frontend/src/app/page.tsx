"use client";

import ModuleMap from "./components/HomePage/ModuleMap/ModuleMap";
import ModuleGate from "./components/ModuleGate/ModuleGate";
import Sidebar from "./components/Sidebar/Sidebar";
import styles from "./page.module.css";

export default function Home() {
  return (
    <ModuleGate module={0}>
      <main className={styles.main}>
        <Sidebar isHomePage={true} />
        <ModuleMap />
      </main>
    </ModuleGate>
  );
}
