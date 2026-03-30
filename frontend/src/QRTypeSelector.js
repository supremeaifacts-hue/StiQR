import React, { useState } from 'react';

const QRTypeSelector = ({ onTypeSelect }) => {
  const qrTypes = [
    { id: 'url', label: 'URL / Link' },
    { id: 'text', label: 'Text' },
    { id: 'email', label: 'Email' },
    { id: 'sms', label: 'SMS' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'wifi', label: 'Wi-Fi Login' },
    { id: 'vcard', label: 'vContact' },
    { id: 'event', label: 'Event (Calendar)' },
  ];

  return (
    <div>
      <h2 style={{ color: '#00D9FF', marginBottom: '20px' }}>Step 1: Select QR Code Type</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {qrTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onTypeSelect(type.id)}
            style={{
              padding: '14px 16px',
              backgroundColor: 'rgba(0, 217, 255, 0.1)',
              color: '#00D9FF',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(0, 217, 255, 0.2)';
              e.target.style.borderColor = '#00D9FF';
              e.target.style.boxShadow = '0 0 15px rgba(0, 217, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(0, 217, 255, 0.1)';
              e.target.style.borderColor = 'rgba(0, 217, 255, 0.3)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QRTypeSelector;