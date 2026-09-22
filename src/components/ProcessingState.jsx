import React, { useEffect, useState } from 'react';

function ProcessingState({ onComplete }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Reading document...",
    "Detecting document type...",
    "Identifying clauses...",
    "Checking for risks..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => {
        if (s < steps.length - 1) return s + 1;
        clearInterval(interval);
        return s;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <div className="spinner" style={{ marginBottom: '2rem', fontSize: '2rem' }}>📄</div>
      <h3>{steps[step]}</h3>
      <div style={{ width: '100%', maxWidth: '400px', height: '4px', backgroundColor: 'var(--border-light)', margin: '0 auto' }}>
        <div style={{ width: `${((step + 1) / steps.length) * 100}%`, height: '100%', backgroundColor: 'var(--accent-color)', transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

export default ProcessingState;
