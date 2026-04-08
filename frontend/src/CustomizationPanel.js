import React, { useState, useEffect } from 'react';
import StickerPicker from './StickerPicker';

/**
 * Custom hook for managing sticker and logo state
 */
export const useCustomization = (initialData = {}) => {
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(initialData.selectedSticker || null);
  const [selectedLogo, setSelectedLogo] = useState(initialData.selectedLogo || null);
  const [userLogos, setUserLogos] = useState([]);
  const [loadingLogos, setLoadingLogos] = useState(false);

  /**
   * Handle logo upload
   */
  const handleLogoUpload = async (e, isAuthenticated, saveLogo) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, or SVG)');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const logoData = event.target.result;
      setSelectedLogo(logoData);
      
      // Save logo to backend if user is authenticated
      if (isAuthenticated && saveLogo) {
        try {
          await saveLogo(logoData, file.name);
          console.log('Logo saved to user account');
        } catch (error) {
          console.error('Failed to save logo:', error);
          // Continue anyway - the logo will still be selected
        }
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Fetch user logos
   */
  const fetchUserLogos = async (isAuthenticated, getUserAssets) => {
    if (isAuthenticated && getUserAssets) {
      setLoadingLogos(true);
      try {
        const assets = await getUserAssets();
        setUserLogos(assets.logos || []);
      } catch (error) {
        console.error('Failed to fetch user logos:', error);
        setUserLogos([]);
      } finally {
        setLoadingLogos(false);
      }
    } else {
      setUserLogos([]);
    }
  };

  /**
   * Clear selected sticker
   */
  const clearSticker = () => {
    setSelectedSticker(null);
  };

  /**
   * Clear selected logo
   */
  const clearLogo = () => {
    setSelectedLogo(null);
  };

  /**
   * Get customization data
   */
  const getCustomizationData = () => ({
    selectedSticker,
    selectedLogo,
    showStickerPicker
  });

  return {
    // State
    showStickerPicker,
    selectedSticker,
    selectedLogo,
    userLogos,
    loadingLogos,
    
    // Setters
    setShowStickerPicker,
    setSelectedSticker,
    setSelectedLogo,
    setUserLogos,
    setLoadingLogos,
    
    // Functions
    handleLogoUpload,
    fetchUserLogos,
    clearSticker,
    clearLogo,
    getCustomizationData
  };
};

/**
 * Component for sticker management
 */
export const StickerManagement = ({
  selectedSticker,
  onStickerPickerOpen,
  onStickerClear
}) => {
  return (
    <div style={{ marginTop: '30px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', marginBottom: '15px' }}>
        <span>✨</span> Center Sticker
      </label>
      <button
        onClick={onStickerPickerOpen}
        style={{
          width: '100%',
          padding: '14px',
          background: 'linear-gradient(135deg, #FF00FF 0%, #FF1493 100%)',
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          fontWeight: '700',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        ✨ Add Sticker
      </button>
      {selectedSticker && (
        <div style={{
          marginTop: '10px',
          textAlign: 'center',
          fontSize: '24px',
          padding: '10px',
          background: 'rgba(0, 217, 255, 0.1)',
          borderRadius: '8px',
        }}>
          <div style={{ marginBottom: '8px' }}>
            {selectedSticker.startsWith('data:') ? (
              <img src={selectedSticker} alt="sticker" style={{ maxWidth: '60px', maxHeight: '60px' }} />
            ) : (
              selectedSticker
            )}
          </div>
          <button
            onClick={onStickerClear}
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 0, 0, 0.2)',
              border: '1px solid rgba(255, 0, 0, 0.3)',
              borderRadius: '6px',
              color: '#ff6b6b',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Remove Sticker
          </button>
        </div>
      )}
    </div>
  );
};

export default useCustomization;