import React from 'react';
import { useEditorPageState } from './EditorPageState';
import { useQRGenerator } from './EditorPageQRGenerator';
import { useEditorPageHandlers } from './EditorPageHandlers';
import { EditorPageUI } from './EditorPageUIFull';

const EditorPageRefactored = ({ onBack, onGoToDashboard, onGoToProfile, embedded = false, qrCodeToEdit, onClearQrCodeToEdit }) => {
  // Use the modular state management
  const state = useEditorPageState({ qrCodeToEdit, onClearQrCodeToEdit });
  
  const {
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
    userLogos,
    loadingLogos,
    selectedFrame, setSelectedFrame,
    framePhrase, setFramePhrase,
    frameFont, setFrameFont,
    frameColor, setFrameColor,
    canvasRef,
    isAuthenticated, saveLogo, saveQrCode, getUserAssets, canCreateDynamicQrCodes, getTrialDaysLeft, isProUser
  } = state;

  // Use the modular QR generator
  const { generateQRCode } = useQRGenerator({
    qrData,
    qrColor,
    bgColor,
    qrSize,
    errorCorrectionLevel,
    includeMargin,
    selectedSticker,
    selectedLogo,
    selectedFrame,
    framePhrase,
    frameFont,
    frameColor,
    canvasRef
  });

  // Use the modular handlers
  const { handleLogoUpload, handleDownload, handleSaveToCollection } = useEditorPageHandlers({
    isAuthenticated,
    saveLogo,
    saveQrCode,
    selectedLogo,
    setSelectedLogo,
    qrData,
    canvasRef,
    qrSize,
    includeMargin,
    qrColor,
    bgColor,
    errorCorrectionLevel,
    selectedFrame,
    frameColor,
    frameFont,
    framePhrase,
    selectedSticker,
    qrCodeToEdit
  });

  // Generate QR code when dependencies change
  React.useEffect(() => {
    generateQRCode();
  }, [qrData, qrColor, bgColor, qrSize, errorCorrectionLevel, includeMargin, selectedSticker, selectedLogo, selectedFrame, framePhrase, frameFont, frameColor, generateQRCode]);

  const qrTypes = [
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

  return (
    <EditorPageUI
      // State
      selectedType={selectedType} setSelectedType={setSelectedType}
      qrData={qrData} setQrData={setQrData}
      qrMode={qrMode} setQrMode={setQrMode}
      designTab={designTab} setDesignTab={setDesignTab}
      errorCorrectionLevel={errorCorrectionLevel} setErrorCorrectionLevel={setErrorCorrectionLevel}
      includeMargin={includeMargin} setIncludeMargin={setIncludeMargin}
      qrColor={qrColor} setQrColor={setQrColor}
      bgColor={bgColor} setBgColor={setBgColor}
      showStickerPicker={showStickerPicker} setShowStickerPicker={setShowStickerPicker}
      selectedSticker={selectedSticker} setSelectedSticker={setSelectedSticker}
      qrSize={qrSize} setQrSize={setQrSize}
      selectedLogo={selectedLogo} setSelectedLogo={setSelectedLogo}
      userLogos={userLogos}
      loadingLogos={loadingLogos}
      selectedFrame={selectedFrame} setSelectedFrame={setSelectedFrame}
      framePhrase={framePhrase} setFramePhrase={setFramePhrase}
      frameFont={frameFont} setFrameFont={setFrameFont}
      frameColor={frameColor} setFrameColor={setFrameColor}
      
      // Refs
      canvasRef={canvasRef}
      
      // Auth
      isAuthenticated={isAuthenticated}
      canCreateDynamicQrCodes={canCreateDynamicQrCodes}
      getTrialDaysLeft={getTrialDaysLeft}
      isProUser={isProUser}
      
      // Handlers
      handleLogoUpload={handleLogoUpload}
      handleDownload={handleDownload}
      handleSaveToCollection={() => handleSaveToCollection(canvasRef, qrData, qrColor, bgColor, selectedFrame, frameColor, frameFont, framePhrase, selectedSticker, selectedLogo, errorCorrectionLevel, qrMode, selectedType, includeMargin, qrSize, isAuthenticated, saveQrCode, qrCodeToEdit)}
      
      // Props
      onBack={onBack}
      onGoToDashboard={onGoToDashboard}
      onGoToProfile={onGoToProfile}
      embedded={embedded}
      qrCodeToEdit={qrCodeToEdit}
      
      // Constants
      qrTypes={qrTypes}
    />
  );
};

export default EditorPageRefactored;