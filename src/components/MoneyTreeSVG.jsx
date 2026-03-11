export default function MoneyTreeSVG() {
  return (
    <svg
      viewBox="0 0 160 210"
      width="100%"
      style={{ maxWidth: 200, display: "block", margin: "0 auto" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Trunk */}
      <rect x="68" y="135" width="24" height="72" rx="6" fill="#8B5E3C" />
      <rect x="68" y="135" width="8" height="72" rx="6" fill="#A07040" opacity="0.5" />

      {/* Foliage — back to front */}
      <circle cx="80" cy="112" r="55" fill="#1B4332" />
      <circle cx="80" cy="78" r="43" fill="#2D6A4F" />
      <circle cx="80" cy="48" r="31" fill="#40916C" />
      <circle cx="80" cy="24" r="19" fill="#74C69D" />
    </svg>
  );
}
