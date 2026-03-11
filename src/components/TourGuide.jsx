import Joyride, { STATUS } from 'react-joyride';

const ACCENT = '#E8B820';

export default function TourGuide({ t, onDone }) {
  const steps = [
    {
      target: 'body',
      placement: 'center',
      title: t('tourStep1Title'),
      content: t('tourStep1Body'),
      disableBeacon: true,
    },
    {
      target: '.tour-income-setup',
      content: t('tourStep2Body'),
      disableBeacon: true,
    },
    {
      target: '.tour-add-account',
      content: t('tourStep3Body'),
      disableBeacon: true,
    },
    {
      target: '.tour-add-goal',
      content: t('tourStep4Body'),
      disableBeacon: true,
    },
  ];

  const handleCallback = ({ status }) => {
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onDone();
    }
  };

  return (
    <Joyride
      steps={steps}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      disableScrolling={true}
      scrollToFirstStep={false}
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: ACCENT,
          backgroundColor: '#ffffff',
          textColor: '#1a1a1a',
          arrowColor: '#ffffff',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '16px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          fontFamily: "'Geist', 'Syne', sans-serif",
          fontSize: 14,
          padding: '20px 24px',
        },
        tooltipTitle: {
          fontFamily: "'Geist', 'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 17,
          letterSpacing: '-0.02em',
          marginBottom: 8,
        },
        buttonNext: {
          backgroundColor: ACCENT,
          borderRadius: 10,
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: '0.03em',
        },
        buttonBack: {
          color: '#888',
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
        },
        buttonSkip: {
          color: '#aaa',
          fontFamily: "'Geist Mono', monospace",
          fontSize: 12,
        },
        tooltipContent: {
          whiteSpace: 'pre-line',
        },
      }}
    />
  );
}
