import { useState } from 'react'
import LandingPage from './components/LandingPage'
import UploadZone from './components/UploadZone'
import ProcessingState from './components/ProcessingState'
import MainWorkspace from './components/MainWorkspace'

function App() {
  const [appState, setAppState] = useState('landing'); // landing, upload, processing, workspace
  const [role, setRole] = useState('');
  const [analysisData, setAnalysisData] = useState(null);

  const handleStart = () => {
    setAppState('upload');
  };

  const handleUpload = async (file, selectedRole) => {
    setRole(selectedRole);
    setAppState('processing');

    const formData = new FormData();
    formData.append('document', file);
    formData.append('role', selectedRole);

    try {
      // In local dev, use the emulator URL. In prod, use relative or functions URL.
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://127.0.0.1:5001/legal-lens-demo/us-central1' 
        : '/api';
      
      // Note: for Firebase hosting rewrites, /api/analyze maps to analyze function
      const endpoint = window.location.hostname === 'localhost' ? \`\${baseUrl}/analyze\` : '/api/analyze';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      // Add a mock original text if the backend doesn't return it
      if (!data.originalText) {
        data.originalText = "Text extracted from document will appear here...";
      }
      setAnalysisData(data);
      setAppState('workspace');
    } catch (err) {
      console.error(err);
      alert('An error occurred during analysis.');
      setAppState('upload');
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 onClick={() => setAppState('landing')} style={{ cursor: 'pointer' }}>LegalLens</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => document.body.style.fontSize = '120%'}>A+</button>
          <button onClick={() => document.body.style.fontSize = '100%'}>A-</button>
          <button onClick={() => {
            const isHighContrast = document.body.style.backgroundColor === 'black';
            document.body.style.backgroundColor = isHighContrast ? 'var(--bg-color)' : 'black';
            document.body.style.color = isHighContrast ? 'var(--text-color)' : 'white';
          }}>Contrast</button>
        </div>
      </header>
      
      <div style={{ backgroundColor: 'var(--risk-low)', color: 'white', padding: '0.5rem', textAlign: 'center', marginBottom: '1rem' }}>
        Privacy Status: Documents are processed in-memory and not stored.
      </div>
      
      <main className="app-main">
        {appState === 'landing' && <LandingPage onStart={handleStart} />}
        {appState === 'upload' && <UploadZone onUpload={handleUpload} />}
        {appState === 'processing' && <ProcessingState />}
        {appState === 'workspace' && <MainWorkspace data={analysisData} role={role} />}
      </main>
    </div>
  )
}

export default App
