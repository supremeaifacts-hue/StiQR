import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';

export const useEditorPageState = ({ qrCodeToEdit, onClearQrCodeToEdit }) => {
  const [selectedType, setSelectedType] = useState('url');
  const [qrData, setQrData] = useState('');
  const [qrMode, setQrMode] = useState('static');
  const [designTab, setDesignTab] = useState('frame');
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('H');
  const [includeMargin, setIncludeMargin] = useState(true);
  const [qrColor, setQrColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [qrSize, setQrSize] = useState(300);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [userLogos, setUserLogos] = useState([]);
  const [loadingLogos, setLoadingLogos] = useState(false);
  
  // Frame customization state
  const [selectedFrame, setSelectedFrame] = useState('none');
  const [framePhrase, setFramePhrase] = useState('Your Text');
  const [frameFont, setFrameFont] = useState('Arial');
  const [frameColor, setFrameColor] = useState('#000000');
  
  const canvasRef = useRef(null);
  
  const { isAuthenticated, saveLogo, saveQrCode, getUserAssets, canCreateDynamicQrCodes, getTrialDaysLeft, isProUser } = useAuth();

  // Fetch user logos when component mounts or authentication changes
  useEffect(() => {
    const fetchUserLogos = async () => {
      if (isAuthenticated) {
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
    
    fetchUserLogos();
  }, [isAuthenticated, getUserAssets]);

  // Pre-fill form when qrCodeToEdit is provided
  useEffect(() => {
    if (qrCodeToEdit) {
      console.log('Pre-filling form with QR code data:', qrCodeToEdit);
      
      // Set QR code data
      if (qrCodeToEdit.data) {
        setQrData(qrCodeToEdit.data);
      }
      
      // Set QR code name as frame phrase if available
      if (qrCodeToEdit.name) {
        setFramePhrase(qrCodeToEdit.name);
      }
      
      // Try to get design characteristics from qrCodeToEdit.design first
      let designCharacteristics = qrCodeToEdit.design;
      
      // If not in qrCodeToEdit.design, try to get from localStorage as fallback
      if (!designCharacteristics && qrCodeToEdit.id) {
        const designStorageKey = `qr_design_${qrCodeToEdit.id}`;
        const storedDesign = localStorage.getItem(designStorageKey);
        if (storedDesign) {
          try {
            designCharacteristics = JSON.parse(storedDesign);
            console.log('Retrieved design characteristics from localStorage fallback:', designCharacteristics);
          } catch (error) {
            console.error('Error parsing design characteristics from localStorage:', error);
          }
        }
      }
      
      // Restore design characteristics if available
      if (designCharacteristics) {
        const design = designCharacteristics;
        
        // Restore QR color
        if (design.qrColor) {
          setQrColor(design.qrColor);
        }
        
        // Restore background color
        if (design.bgColor) {
          setBgColor(design.bgColor);
        }
        
        // Restore frame
        if (design.selectedFrame) {
          setSelectedFrame(design.selectedFrame);
        }
        
        // Restore frame color
        if (design.frameColor) {
          setFrameColor(design.frameColor);
        }
        
        // Restore frame font
        if (design.frameFont) {
          setFrameFont(design.frameFont);
        }
        
        // Restore sticker
        if (design.selectedSticker) {
          setSelectedSticker(design.selectedSticker);
        }
        
        // Restore logo
        if (design.selectedLogo) {
          setSelectedLogo(design.selectedLogo);
        }
        
        // Restore error correction level
        if (design.errorCorrectionLevel) {
          setErrorCorrectionLevel(design.errorCorrectionLevel);
        }
        
        // Restore QR mode
        if (design.qrMode) {
          setQrMode(design.qrMode);
        }
        
        // Restore selected type
        if (design.selectedType) {
          setSelectedType(design.selectedType);
        }
        
        // Restore include margin
        if (design.includeMargin !== undefined) {
          setIncludeMargin(design.includeMargin);
        }
        
        // Restore QR size
        if (design.qrSize) {
          setQrSize(design.qrSize);
        }
      }
      
      // Show a message to the user
      alert(`Editing QR code: ${qrCodeToEdit.name || 'Untitled QR Code'}\n\nAll design characteristics have been restored. Make your changes and click "Save to My QR codes" to update it.`);
      
      // Clear the qrCodeToEdit after using it
      if (onClearQrCodeToEdit) {
        // Clear after a short delay to ensure the form is pre-filled
        setTimeout(() => {
          onClearQrCodeToEdit();
        }, 100);
      }
    }
  }, [qrCodeToEdit, onClearQrCodeToEdit]);

  return {
    // State
    selectedType, setSelectedType,
    qrData, setQrData,
    qrMode, setQrMode,
    designTab, setDesignTab,
    errorCorrectionLevel, setErrorCorrectionLevel,
    includeMargin, setIncludeMargin,
    qrColor, setQrColor,
    bgColor, setBgColor,
    showStickerPicker, setShowStickerPicker,
    selectedSticker, setSelectedSticker,
    qrSize, setQrSize,
    selectedLogo, setSelectedLogo,
    userLogos, setUserLogos,
    loadingLogos, setLoadingLogos,
    selectedFrame, setSelectedFrame,
    framePhrase, setFramePhrase,
    frameFont, setFrameFont,
    frameColor, setFrameColor,
    
    // Refs
    canvasRef,
    
    // Auth
    isAuthenticated, saveLogo, saveQrCode, getUserAssets, canCreateDynamicQrCodes, getTrialDaysLeft, isProUser
  };
};

export const qrTypes = [
  { id: 'url', label: 'Link' },
  { id: 'text', label: 'Text' },
  { id: 'email', label: 'E-mail' },
  { id: 'sms', label: 'SMS' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'wifi', label: 'WI‑FI' },
  { id: 'pdf', label: 'PDF' },
  { id: 'social', label: 'Social Media' },
  { id: 'event', label: 'Event' },
];