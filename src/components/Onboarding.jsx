import { useState } from 'react';
import { S } from '../styles.js';

const STEPS = [
  { icon: "👋", titleKey: "onboarding0Title", bodyKey: "onboarding0Body" },
  { icon: "💰", titleKey: "onboarding1Title", bodyKey: "onboarding1Body" },
  { icon: "🏦", titleKey: "onboarding2Title", bodyKey: "onboarding2Body" },
  { icon: "🎯", titleKey: "onboarding3Title", bodyKey: "onboarding3Body" },
];

export default function Onboarding({ t, onDone }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const handleNext = () => {
    if (isLast) onDone();
    else setStep(s => s + 1);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        ...S.modal,
        maxWidth: 440,
        display: "flex", flexDirection: "column", gap: 0,
        animation: "splashLogoIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
      }}>
        {/* Icon */}
        <div style={{ fontSize: 52, textAlign: "center", marginBottom: 20, lineHeight: 1 }}>
          {current.icon}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "'Geist'", fontWeight: 800, fontSize: 22,
          color: "var(--c-text)", textAlign: "center",
          letterSpacing: "-0.02em", marginBottom: 12, lineHeight: 1.25,
        }}>
          {t(current.titleKey)}
        </div>

        {/* Body */}
        <div style={{
          fontSize: 14, color: "var(--c-muted)", textAlign: "center",
          lineHeight: 1.65, marginBottom: 32,
          fontFamily: "'Geist Mono'",
        }}>
          {t(current.bodyKey)}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8,
              borderRadius: 9999,
              background: i === step ? "var(--c-accent)" : "var(--c-border)",
              transition: "width 0.25s ease, background 0.25s ease",
            }} />
          ))}
        </div>

        {/* Button */}
        <button
          onClick={handleNext}
          style={{
            ...S.btn(),
            width: "100%", padding: "14px", fontSize: 15,
            fontFamily: "'Geist'", fontWeight: 700,
            letterSpacing: "0.02em", borderRadius: 12,
          }}
        >
          {isLast ? t("onboardingGetStarted") : t("onboardingNext")}
        </button>

        {/* Skip */}
        {!isLast && (
          <button onClick={onDone} style={{
            marginTop: 12, background: "none", border: "none",
            color: "var(--c-muted)", fontSize: 12, cursor: "pointer",
            fontFamily: "'Geist Mono'", textAlign: "center", width: "100%",
          }}>
            {t("onboardingSkip")}
          </button>
        )}
      </div>
    </div>
  );
}
