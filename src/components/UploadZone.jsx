import React, { useState } from 'react';

function UploadZone({ onUpload }) {
  const [role, setRole] = useState('Tenant');
  const roles = ['Tenant', 'Landlord', 'Employee', 'Employer', 'Freelancer', 'Client', 'Consumer', 'Business', 'Not sure'];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file, role);
    }
  };

  return (
    <div className="upload-zone" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h3>1. Select your role in this document</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
        {roles.map(r => (
          <button 
            key={r}
            onClick={() => setRole(r)}
            style={{
              backgroundColor: role === r ? 'var(--text-color)' : 'var(--bg-color)',
              color: role === r ? 'var(--bg-color)' : 'var(--text-color)'
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <h3>2. Upload the document</h3>
      <div 
        style={{
          border: '2px dashed var(--border-strong)',
          padding: '4rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: 'rgba(27,27,47,0.02)'
        }}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <p>Drag and drop a PDF or DOCX here, or click to browse.</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--border-strong)' }}>Max size: 10MB. We do not store your documents.</p>
        <input 
          id="file-upload" 
          type="file" 
          accept=".pdf,.docx,image/png,image/jpeg"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

export default UploadZone;
