import React, { useState } from 'react';

const StickerGallery = ({ onStickerSelect }) => {
  const [activeTab, setActiveTab] = useState('brandKit');

  // Placeholder stickers - in production, these would be loaded from API/storage
  const brandKitStickers = [
    { id: 'logo1', name: 'Company Logo', url: 'https://via.placeholder.com/50x50?text=Logo' },
    { id: 'logo2', name: 'Brand Icon', url: 'https://via.placeholder.com/50x50?text=Icon' },
  ];

  const stickerLibrary = [
    { id: 'heart', name: 'Heart', url: 'https://via.placeholder.com/50x50?text=❤️' },
    { id: 'star', name: 'Star', url: 'https://via.placeholder.com/50x50?text=⭐' },
    { id: 'check', name: 'Checkmark', url: 'https://via.placeholder.com/50x50?text=✓' },
    { id: 'coffee', name: 'Coffee Cup', url: 'https://via.placeholder.com/50x50?text=☕' },
    { id: 'sale', name: 'Sale Tag', url: 'https://via.placeholder.com/50x50?text=SALE' },
    { id: 'facebook', name: 'Facebook', url: 'https://via.placeholder.com/50x50?text=FB' },
    { id: 'twitter', name: 'Twitter', url: 'https://via.placeholder.com/50x50?text=TW' },
    { id: 'instagram', name: 'Instagram', url: 'https://via.placeholder.com/50x50?text=IG' },
  ];

  const currentStickers = activeTab === 'brandKit' ? brandKitStickers : stickerLibrary;

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ color: '#00D9FF' }}>Step 3: Sticker Studio</h3>
      <div style={{ display: 'flex', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('brandKit')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'brandKit' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'brandKit' ? 'white' : 'black',
            border: '1px solid #ccc',
            cursor: 'pointer',
          }}
        >
          Brand Kit
        </button>
        <button
          onClick={() => setActiveTab('stickerLibrary')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'stickerLibrary' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'stickerLibrary' ? 'white' : 'black',
            border: '1px solid #ccc',
            cursor: 'pointer',
          }}
        >
          Sticker Library
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '10px' }}>
        {currentStickers.map((sticker) => (
          <div
            key={sticker.id}
            onClick={() => onStickerSelect(sticker)}
            style={{
              cursor: 'pointer',
              border: '1px solid #ddd',
              borderRadius: '5px',
              padding: '5px',
              textAlign: 'center',
            }}
          >
            <img src={sticker.url} alt={sticker.name} style={{ width: '40px', height: '40px' }} />
            <div style={{ fontSize: '12px', marginTop: '5px' }}>{sticker.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StickerGallery;