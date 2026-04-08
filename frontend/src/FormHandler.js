import { useState, useEffect } from 'react';

/**
 * Custom hook for managing QR code form state and logic
 */
export const useFormHandler = (initialData = {}) => {
  // QR type and data state
  const [selectedType, setSelectedType] = useState(initialData.selectedType || 'url');
  const [qrData, setQrData] = useState(initialData.qrData || '');
  const [emailAddress, setEmailAddress] = useState(initialData.emailAddress || '');
  const [emailSubject, setEmailSubject] = useState(initialData.emailSubject || '');
  const [emailBody, setEmailBody] = useState(initialData.emailBody || '');
  const [qrMode, setQrMode] = useState(initialData.qrMode || 'static');
  
  // QR design state
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState(initialData.errorCorrectionLevel || 'H');
  const [includeMargin, setIncludeMargin] = useState(initialData.includeMargin !== undefined ? initialData.includeMargin : true);
  const [qrColor, setQrColor] = useState(initialData.qrColor || '#000000');
  const [bgColor, setBgColor] = useState(initialData.bgColor || '#ffffff');
  const [qrSize, setQrSize] = useState(initialData.qrSize || 280);
  
  // Frame customization state
  const [selectedFrame, setSelectedFrame] = useState(initialData.selectedFrame || 'none');
  const [framePhrase, setFramePhrase] = useState(initialData.framePhrase || 'SCAN ME');
  const [frameFont, setFrameFont] = useState(initialData.frameFont || 'Arial');
  const [frameColor, setFrameColor] = useState(initialData.frameColor || '#000000');
  
  // Design tab state
  const [designTab, setDesignTab] = useState(initialData.designTab || 'frame');

  /**
   * Format QR data based on selected type
   */
  const getFormattedQrData = () => {
    if (selectedType === 'email') {
      if (!emailAddress || emailAddress.trim() === '') return '';
      const email = emailAddress;
      const subject = emailSubject || '';
      const body = emailBody || '';
      return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    return qrData && qrData.trim() !== '' ? qrData : '';
  };

  /**
   * Get all form data as an object
   */
  const getFormData = () => ({
    selectedType,
    qrData,
    emailAddress,
    emailSubject,
    emailBody,
    qrMode,
    errorCorrectionLevel,
    includeMargin,
    qrColor,
    bgColor,
    qrSize,
    selectedFrame,
    framePhrase,
    frameFont,
    frameColor,
    designTab
  });

  /**
   * Update multiple form fields at once
   */
  const updateFormData = (updates) => {
    if (updates.selectedType !== undefined) setSelectedType(updates.selectedType);
    if (updates.qrData !== undefined) setQrData(updates.qrData);
    if (updates.emailAddress !== undefined) setEmailAddress(updates.emailAddress);
    if (updates.emailSubject !== undefined) setEmailSubject(updates.emailSubject);
    if (updates.emailBody !== undefined) setEmailBody(updates.emailBody);
    if (updates.qrMode !== undefined) setQrMode(updates.qrMode);
    if (updates.errorCorrectionLevel !== undefined) setErrorCorrectionLevel(updates.errorCorrectionLevel);
    if (updates.includeMargin !== undefined) setIncludeMargin(updates.includeMargin);
    if (updates.qrColor !== undefined) setQrColor(updates.qrColor);
    if (updates.bgColor !== undefined) setBgColor(updates.bgColor);
    if (updates.qrSize !== undefined) setQrSize(updates.qrSize);
    if (updates.selectedFrame !== undefined) setSelectedFrame(updates.selectedFrame);
    if (updates.framePhrase !== undefined) setFramePhrase(updates.framePhrase);
    if (updates.frameFont !== undefined) setFrameFont(updates.frameFont);
    if (updates.frameColor !== undefined) setFrameColor(updates.frameColor);
    if (updates.designTab !== undefined) setDesignTab(updates.designTab);
  };

  /**
   * Reset form to default values
   */
  const resetForm = () => {
    setSelectedType('url');
    setQrData('');
    setEmailAddress('');
    setEmailSubject('');
    setEmailBody('');
    setQrMode('static');
    setErrorCorrectionLevel('H');
    setIncludeMargin(true);
    setQrColor('#000000');
    setBgColor('#ffffff');
    setQrSize(280);
    setSelectedFrame('none');
    setFramePhrase('SCAN ME');
    setFrameFont('Arial');
    setFrameColor('#000000');
    setDesignTab('frame');
  };

  /**
   * Check if form has valid data for QR generation
   */
  const isValidForQR = () => {
    const formattedData = getFormattedQrData();
    return formattedData.trim() !== '';
  };

  return {
    // State
    selectedType,
    qrData,
    emailAddress,
    emailSubject,
    emailBody,
    qrMode,
    errorCorrectionLevel,
    includeMargin,
    qrColor,
    bgColor,
    qrSize,
    selectedFrame,
    framePhrase,
    frameFont,
    frameColor,
    designTab,
    
    // Setters
    setSelectedType,
    setQrData,
    setEmailAddress,
    setEmailSubject,
    setEmailBody,
    setQrMode,
    setErrorCorrectionLevel,
    setIncludeMargin,
    setQrColor,
    setBgColor,
    setQrSize,
    setSelectedFrame,
    setFramePhrase,
    setFrameFont,
    setFrameColor,
    setDesignTab,
    
    // Functions
    getFormattedQrData,
    getFormData,
    updateFormData,
    resetForm,
    isValidForQR
  };
};

/**
 * QR type definitions
 */
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

/**
 * Error correction level options
 */
export const errorCorrectionLevels = [
  { label: 'LOW', value: 'L' },
  { label: 'MEDIUM', value: 'M' },
  { label: 'HIGH', value: 'Q' },
  { label: 'HIGHEST', value: 'H' },
];

/**
 * Frame options
 */
export const frameOptions = [
  { 
    id: 'none', 
    label: 'No Frame',
    borderStyle: 'none', 
    borderWidth: '0px', 
    borderColor: 'transparent',
    hasLabel: false,
    labelPosition: 'none',
    hasIcon: false,
    isCircle: false,
  },
  {
    id: 'frame1',
    label: 'Frame#1',
    borderStyle: 'solid',
    borderWidth: '6px',
    borderColor: '#00D9FF',
    hasLabel: true,
    labelPosition: 'bottom',
    hasIcon: false,
    isCircle: false,
    borderRadius: '16px',
    previewBg: '#ffffff',
  },
  {
    id: 'frame2',
    label: 'Frame#2',
    borderStyle: 'solid',
    borderWidth: '2px',
    borderColor: '#ffffff',
    hasLabel: true,
    labelPosition: 'bottom',
    hasIcon: false,
    isCircle: false,
    borderRadius: '18px',
    previewBg: '#000000',
    outerWidth: 255,
    paddingTop: 18,
    paddingRight: 18,
    paddingBottom: 13,
    paddingLeft: 18,
    qrAreaSize: 220,
    qrAreaBorderRadius: 5,
    labelGap: 10,
    labelFontSize: 11,
    labelLetterSpacing: 2,
    labelPaddingBottom: 2,
    totalHeight: 295,
  },
  {
    id: 'frame3',
    label: 'Frame#3',
    borderStyle: 'solid',
    borderWidth: '2px',
    borderColor: '#ffffff',
    hasLabel: true,
    labelPosition: 'top',
    hasIcon: false,
    isCircle: false,
    borderRadius: '16px',
    previewBg: '#000000',
  },
];

/**
 * Color options for QR code
 */
export const colorOptions = [
  { id: '#000000', label: 'Black', color: '#000000' },
  { id: '#FF00FF', label: 'Magenta', color: '#FF00FF' },
  { id: '#00FF00', label: 'Green', color: '#00FF00' },
  { id: '#FFFF00', label: 'Yellow', color: '#FFFF00' },
  { id: '#FF9900', label: 'Orange', color: '#FF9900' },
  { id: '#FF0000', label: 'Red', color: '#FF0000' },
  { id: '#9900FF', label: 'Purple', color: '#9900FF' },
];

/**
 * Font options for frame text
 */
export const fontOptions = ['Arial', 'Courier', 'Georgia'];

export default useFormHandler;