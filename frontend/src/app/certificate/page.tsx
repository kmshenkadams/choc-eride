"use client";

import { toPng } from "html-to-image";
import Image from "next/image";
import { useRef, useState } from "react";

import Certificate from "../components/Certificate/Certificate";
import ModuleGate from "../components/ModuleGate/ModuleGate";
import Sidebar from "../components/Sidebar/Sidebar";
import { showErrorToast } from "../utils/toastUtils";

import styles from "./CertificatePage.module.css";

export default function CertificatePage() {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const certificateName = name.trim();
  const certificateReady = certificateName.length > 0;

  const handleDownloadPDF = () => {
    if (!certificateReady || !certificateRef.current) {
      showErrorToast();
      return;
    }

    toPng(certificateRef.current, { cacheBust: true })
      .then((dataUrl: string) => {
        const link = document.createElement("a");
        link.download = "certificate.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((err: unknown) => {
        if (process.env.NODE_ENV !== "production") {
          console.error(err);
        }
        showErrorToast();
      });
  };

  const handlePrint = () => {
    if (!certificateReady) {
      showErrorToast();
      return;
    }
    window.print();
  };

  return (
    <ModuleGate module={10}>
      <main className={styles.main}>
        <div className={styles.sidebar}>
          <Sidebar currentlyOn={9} />
        </div>
        <div className={styles.content}>
          <div className={styles.congratsStarsWrapper}>
            <div className={styles.congratsWrapper}>
              <div className={styles.row}>
                <Image
                  src="/certificate/star1.svg"
                  alt="Star"
                  width={35}
                  height={35}
                  className={styles.star1}
                />

                <p className={styles.congrats}>
                  Congratulations! You&apos;ve officially completed the E Bike safety course!
                </p>

                <Image
                  src="/certificate/star2.svg"
                  alt="Star"
                  width={32}
                  height={32}
                  className={styles.star2}
                />

                <Image
                  src="/certificate/star3.svg"
                  alt="Star"
                  width={50}
                  height={50}
                  className={styles.star3}
                />
              </div>

              <div className={styles.nameEntry}>
                <label htmlFor="certificate-name" className={styles.nameLabel}>
                  Name for your certificate
                </label>
                <input
                  id="certificate-name"
                  className={styles.nameInput}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                  autoComplete="off"
                  maxLength={100}
                />
                <p className={styles.namePrivacy}>
                  This name stays on this page and is not saved or sent anywhere.
                </p>
              </div>

              <div className={styles.certificateWrapper}>
                <div className={styles.certificate}>
                  <Certificate name={certificateName} certificateRef={certificateRef} />
                </div>

                <div className={styles.icons}>
                  <button
                    className={styles.button}
                    onClick={handlePrint}
                    disabled={!certificateReady}
                  >
                    <Image src="/certificate/print.svg" alt="Print" width={24} height={24} />
                  </button>

                  <button
                    className={styles.button}
                    onClick={handleDownloadPDF}
                    disabled={!certificateReady}
                  >
                    <Image src="/certificate/download.svg" alt="Save" width={24} height={24} />
                  </button>
                </div>
              </div>

              <p className={styles.printInstruction}>
                Be sure to print and save this certificate for school purposes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </ModuleGate>
  );
}
