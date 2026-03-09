export default function SplashScreen({ fading }) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100dvh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, opacity: fading ? 0 : 1, transition: "opacity 0.2s ease" }}>
      <img src="/favicon/splash-logo.png" alt="돈줄" style={{ width: 150, maxWidth: "50%", animation: "splashLogoIn 2s cubic-bezier(0.16,1,0.3,1) forwards" }} />
    </div>
  );
}
