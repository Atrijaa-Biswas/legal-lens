import React, { useState } from 'react';

function MainWorkspace({ data, role }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [readingLevel, setReadingLevel] = useState('standard'); // simple, standard, detailed
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [asking, setAsking] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    const userMsg = { role: 'user', content: question };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setQuestion('');
    setAsking(true);

    try {
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://127.0.0.1:5001/legal-lens-demo/us-central1' 
        : '/api';
      const endpoint = window.location.hostname === 'localhost' ? `${baseUrl}/ask` : '/api/ask';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMsg.content,
          documentText: data.originalText,
          history: chatHistory.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) throw new Error('Ask failed');

      const result = await response.json();
      setChatHistory([...updatedHistory, { role: 'assistant', content: result.answer, citation: result.citation }]);
    } catch (err) {
      console.error(err);
      setChatHistory([...updatedHistory, { role: 'assistant', content: 'Sorry, I could not process that request.', citation: null }]);
    } finally {
      setAsking(false);
    }
  };

  const getRiskColor = (severity) => {
    if (severity === 'High') return 'var(--risk-high)';
    if (severity === 'Medium') return 'var(--risk-medium)';
    return 'var(--risk-low)';
  };

  return (
    <div className="workspace" style={{ display: 'flex', gap: '2rem', height: '80vh' }}>
      
      {/* Left Pane: Document Text (Mocked for now) */}
      <div className="document-pane" style={{ 
        flex: 1, 
        backgroundColor: '#fff', 
        padding: '2rem', 
        border: '1px solid var(--border-strong)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        overflowY: 'auto',
        fontFamily: 'var(--font-mono)'
      }}>
        <h3 style={{ fontFamily: 'var(--font-main)' }}>Source Document</h3>
        <p style={{ whiteSpace: 'pre-wrap' }}>{data.originalText || "Document text goes here..."}</p>
      </div>

      {/* Right Pane: Analysis Tabs */}
      <div className="analysis-pane" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Workspace Header */}
        <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>{data.documentType || "Unknown Document"}</h2>
            <span style={{ padding: '0.2rem 0.5rem', backgroundColor: 'var(--text-color)', color: 'var(--bg-color)', fontSize: '0.8rem' }}>Role: {role}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {['summary', 'risks', 'ask', 'timeline', 'next-steps', 'export'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              style={{
                backgroundColor: activeTab === tab ? 'var(--text-color)' : 'transparent',
                color: activeTab === tab ? 'var(--bg-color)' : 'var(--text-color)',
                border: activeTab === tab ? '1px solid var(--text-color)' : '1px solid transparent',
                borderBottom: activeTab === tab ? '1px solid var(--text-color)' : '1px solid var(--border-strong)',
                textTransform: 'capitalize'
              }}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content" style={{ flex: 1, overflowY: 'auto' }}>
          
          {activeTab === 'summary' && (
            <div>
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', lineHeight: '2' }}>Reading Level:</span>
                {['simple', 'standard', 'detailed'].map(lvl => (
                  <button 
                    key={lvl} 
                    onClick={() => setReadingLevel(lvl)}
                    style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', backgroundColor: readingLevel === lvl ? 'var(--border-strong)' : 'transparent' }}
                  >
                    {lvl}
                  </button>
                ))}
                <button onClick={() => {
                  const utterance = new SpeechSynthesisUtterance(data.summary ? data.summary[readingLevel] : "");
                  window.speechSynthesis.speak(utterance);
                }} style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>Play TTS</button>
              </div>
              <p>{data.summary ? data.summary[readingLevel] : "Loading summary..."}</p>
            </div>
          )}

          {activeTab === 'risks' && (
            <div>
              {data.risks ? data.risks.map((risk, idx) => (
                <div key={idx} style={{ 
                  border: '1px solid var(--border-light)', 
                  borderLeft: \`4px solid \${getRiskColor(risk.severity)}\`,
                  padding: '1rem', 
                  marginBottom: '1rem',
                  backgroundColor: '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{risk.clauseName}</h4>
                    <span style={{ 
                      color: getRiskColor(risk.severity), 
                      fontWeight: 'bold', 
                      fontSize: '0.8rem',
                      border: \`1px solid \${getRiskColor(risk.severity)}\`,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '2px'
                    }}>{risk.severity} Risk</span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0' }}>{risk.explanation}</p>
                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem' }}>
                    <strong>Why it matters to you:</strong> {risk.whyItMatters}
                  </p>
                </div>
              )) : "Loading risks..."}
            </div>
          )}
          
          {activeTab === 'ask' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                {chatHistory.map((msg, idx) => (
                  <div key={idx} style={{ 
                    marginBottom: '1rem', 
                    padding: '1rem', 
                    backgroundColor: msg.role === 'user' ? 'rgba(27,27,47,0.05)' : '#fff',
                    borderLeft: msg.role === 'assistant' ? '4px solid var(--accent-color)' : 'none'
                  }}>
                    <strong>{msg.role === 'user' ? 'You' : 'LegalLens'}</strong>
                    <p style={{ margin: '0.5rem 0' }}>{msg.content}</p>
                    {msg.citation && (
                      <span style={{ 
                        fontSize: '0.8rem', 
                        backgroundColor: 'var(--border-light)', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}>
                        Source: {msg.citation}
                      </span>
                    )}
                  </div>
                ))}
                {asking && <div style={{ fontStyle: 'italic', color: 'var(--border-strong)' }}>Analyzing document...</div>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about this document..." 
                  style={{ flex: 1, padding: '0.5rem', fontFamily: 'var(--font-main)' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAsk();
                  }}
                />
                <button onClick={handleAsk} disabled={asking || !question.trim()}>Ask</button>
              </div>
            </div>
          )}
          
          {activeTab === 'timeline' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Important Deadlines & Obligations</h3>
                <button onClick={() => {
                  if (!data.timeline || data.timeline.length === 0) return;
                  let icsContent = "BEGIN:VCALENDAR\\nVERSION:2.0\\nPRODID:-//LegalLens//EN\\n";
                  data.timeline.forEach(t => {
                    icsContent += "BEGIN:VEVENT\\n";
                    icsContent += `SUMMARY:${t.event}\\n`;
                    icsContent += `DESCRIPTION:${t.description} (Condition: ${t.dateOrCondition})\\n`;
                    icsContent += "DTSTART:" + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + "Z\\n";
                    icsContent += "END:VEVENT\\n";
                  });
                  icsContent += "END:VCALENDAR";
                  
                  const blob = new Blob([icsContent], { type: 'text/calendar' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'deadlines.ics';
                  a.click();
                  URL.revokeObjectURL(url);
                }}>Download .ics</button>
              </div>
              
              <div style={{ position: 'relative', borderLeft: '2px solid var(--accent-color)', paddingLeft: '1.5rem', marginLeft: '1rem' }}>
                {data.timeline ? data.timeline.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: '1.5rem', position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-1.9rem',
                      top: '0.2rem',
                      width: '0.8rem',
                      height: '0.8rem',
                      backgroundColor: 'var(--accent-color)',
                      borderRadius: '50%'
                    }} />
                    <h4 style={{ margin: '0 0 0.2rem 0' }}>{item.event}</h4>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-color)', backgroundColor: 'var(--border-light)', padding: '0.1rem 0.4rem' }}>{item.dateOrCondition}</span>
                    <p style={{ margin: '0.5rem 0 0 0' }}>{item.description}</p>
                  </div>
                )) : "No timeline data available."}
              </div>
            </div>
          )}

          {activeTab === 'next-steps' && (
            <div>
              <p>Next Steps functionality coming soon.</p>
            </div>
          )}
          
          {activeTab === 'export' && (
            <div>
              <h3>Export Report</h3>
              <p>Select what to include in your export:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                <label><input type="checkbox" defaultChecked /> Summary</label>
                <label><input type="checkbox" defaultChecked /> Risks & Clauses</label>
                <label><input type="checkbox" defaultChecked /> Timeline</label>
                <label><input type="checkbox" defaultChecked /> Next Steps & Lawyer Prep</label>
              </div>
              <button style={{ backgroundColor: 'var(--accent-color)', color: 'white' }} onClick={() => {
                alert('Export functionality generating PDF/Text bundle...');
              }}>Export Document</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default MainWorkspace;
