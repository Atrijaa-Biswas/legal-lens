import React from 'react';

function LandingPage({ onStart }) {
  return (
    <div className="landing-page" style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Understand Your Legal Documents in Plain English</h2>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--border-strong)' }}>
        Upload a lease, NDA, or contract to instantly see risks, deadlines, and a simplified summary.
      </p>
      
      <button 
        onClick={onStart}
        style={{ fontSize: '1.2rem', padding: '1rem 2rem', backgroundColor: 'var(--accent-color)', color: 'var(--bg-color)', border: 'none', borderRadius: '4px' }}
      >
        Upload a Document
      </button>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '4rem' }}>
        <div>
          <h3>Simplify</h3>
          <p>Read in plain language</p>
        </div>
        <div>
          <h3>Compare</h3>
          <p>Find hidden changes</p>
        </div>
        <div>
          <h3>Ask Questions</h3>
          <p>Get instant answers</p>
        </div>
        <div>
          <h3>Get Next Steps</h3>
          <p>Prepare for your lawyer</p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
