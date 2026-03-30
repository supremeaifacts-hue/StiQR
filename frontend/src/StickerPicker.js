import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';

const StickerPicker = ({ onSelectSticker, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('mystickers');
  const [userStickers, setUserStickers] = useState([]);
  const [loadingStickers, setLoadingStickers] = useState(false);
  const { isAuthenticated, saveSticker, getUserAssets } = useAuth();

  // Fetch user stickers when component mounts or authentication changes
  useEffect(() => {
    const fetchUserStickers = async () => {
      if (isAuthenticated) {
        setLoadingStickers(true);
        try {
          const assets = await getUserAssets();
          setUserStickers(assets.stickers || []);
        } catch (error) {
          console.error('Failed to fetch user stickers:', error);
          setUserStickers([]);
        } finally {
          setLoadingStickers(false);
        }
      } else {
        setUserStickers([]);
      }
    };
    
    fetchUserStickers();
  }, [isAuthenticated, getUserAssets]);

  const stickers = {
    mystickers: userStickers.map(sticker => sticker.data),
    emotions: [
      '😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '🤩', '😘', '🥳', '😴'
    ],
    business: [
      '💼', '📊', '📈', '💰', '🏢', '📱', '💻', '🎯', '📞', '🔔', '✅', '⚙️'
    ],
    social: [
      '❤️', '💙', '💚', '💜', '⭐', '✨', '🔥', '👍', '🙌', '👏', '💛', '💖'
    ],
    food: [
      '🍕', '🍔', '🍟', '🌭', '🍿', '🍩', '🍪', '🎂', '🍰', '🥗', '🍜', '🍱'
    ],
    tech: [
      '💾', '🖥️', '⌨️', '🖱️', '📷', '🎮', '🎧', '🔌', '🔋', '📡', '💿', '🖨️'
    ],
    nature: [
      '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🌺', '🌸', '🌼', '🌻'
    ],
    travel: [
      '✈️', '🚀', '🚗', '🚄', '🚢', '🏖️', '🏔️', '🗼', '🗽', '🎡', '🎢', '⛺'
    ],
    shopping: [
      '🛍️', '🛒', '💳', '💰', '💸', '👜', '👠', '👗', '👔', '🎁', '🏪', '🏬'
    ],
    sport: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥊', '🥋', '⛳', '🏂', '🎿'
    ],
    music: [
      '🎵', '🎶', '🎤', '🎧', '🎸', '🎹', '🎺', '🎷', '🥁', '🎻', '🪕', '🔔'
    ],
  };

  const categories = [
    { id: 'mystickers', label: 'My Stickers', icon: '⭐' },
    { id: 'emotions', label: 'Emotions', icon: '😀' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'social', label: 'Social', icon: '❤️' },
    { id: 'food', label: 'Food', icon: '🍕' },
    { id: 'tech', label: 'Tech', icon: '💻' },
    { id: 'nature', label: 'Nature', icon: '🌲' },
    { id: 'travel', label: 'Travel', icon: '✈️' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'sport', label: 'Sport', icon: '⚽' },
    { id: 'music', label: 'Music', icon: '🎵' },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(0, 217, 255, 0.3)',
      padding: '40px',
      maxHeight: '70vh',
      overflowY: 'auto',
    }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0' }}>Choose a Sticker</h2>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(0, 217, 255, 0.1)',
            border: '1px solid #00D9FF',
            color: '#00D9FF',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '10px 16px',
              background: activeCategory === cat.id ? 'rgba(0, 217, 255, 0.2)' : 'transparent',
              border: `1px solid ${activeCategory === cat.id ? '#00D9FF' : 'rgba(0, 217, 255, 0.2)'}`,
              borderRadius: '20px',
              color: '#00D9FF',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
        {/* Upload button */}
      </div>

      {/* Upload Sticker */}
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <input
          type="file"
          accept="image/png, image/jpeg"
          style={{ display: 'none' }}
          id="sticker-upload"
          onChange={async (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = async (ev) => {
                if (ev.target && typeof ev.target.result === 'string') {
                  const stickerData = ev.target.result;
                  
                  // Save sticker to backend if user is authenticated
                  if (isAuthenticated) {
                    try {
                      await saveSticker(stickerData, file.name, 'custom');
                      console.log('Sticker saved to user account');
                    } catch (error) {
                      console.error('Failed to save sticker:', error);
                      // Continue anyway - the sticker will still be selected
                    }
                  }
                  
                  onSelectSticker(stickerData);
                  onClose();
                }
              };
              reader.readAsDataURL(file);
            }
          }}
        />
        <label
          htmlFor="sticker-upload"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #FF00FF 0%, #FF1493 100%)',
            color: '#fff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          Upload Sticker
        </label>
        <span style={{ color: '#00D9FF', fontSize: '12px', fontWeight: '500' }}>
          {isAuthenticated ? 'Use your saved stickers' : 'Login to use your saved stickers'}
        </span>
      </div>

      {/* Stickers Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '12px',
      }}>
        {activeCategory === 'mystickers' && userStickers.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666',
            fontSize: '14px',
            background: 'rgba(0, 217, 255, 0.05)',
            borderRadius: '12px',
            border: '1px dashed rgba(0, 217, 255, 0.2)',
          }}>
            {isAuthenticated ? 'No stickers saved yet. Upload a sticker to see it here.' : 'Login to see your saved stickers'}
          </div>
        ) : (
          stickers[activeCategory]?.map((sticker, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectSticker(sticker);
                onClose();
              }}
              style={{
                padding: '20px',
                background: 'rgba(0, 217, 255, 0.05)',
                border: '1px solid rgba(0, 217, 255, 0.2)',
                borderRadius: '12px',
                fontSize: '40px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100px',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(0, 217, 255, 0.15)';
                e.target.style.transform = 'scale(1.05)';
                e.target.style.boxShadow = '0 0 15px rgba(0, 217, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(0, 217, 255, 0.05)';
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {sticker.startsWith('data:') ? (
                <img 
                  src={sticker} 
                  alt="sticker" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    maxWidth: '80px',
                    maxHeight: '80px',
                  }}
                />
              ) : (
                sticker
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default StickerPicker;