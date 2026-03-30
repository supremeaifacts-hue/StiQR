import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import SignUpModal from './SignUpModal';
import LoginModal from './LoginModal';

const TopBar = ({ onViewDashboard, onViewPricing, onSignUp, onLogin, onGoToLanding }) => {
  const { user, logout } = useAuth();
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleSignUpClick = () => {
    setShowSignUpModal(true);
    if (onSignUp) {
      onSignUp();
    }
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
    if (onLogin) {
      onLogin();
    }
  };

  const handleModalClose = () => {
    setShowSignUpModal(false);
    setShowLoginModal(false);
  };

  const handleLoginFromModal = () => {
    setShowSignUpModal(false);
    setShowLoginModal(true);
  };

  const handleSignUpFromModal = () => {
    setShowLoginModal(false);
    setShowSignUpModal(true);
  };

  return (
    <>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 60px',
        borderBottom: '1px solid rgba(0, 217, 255, 0.1)',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%)',
      }}>
        <div 
          onClick={onGoToLanding}
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#00D9FF',
            letterSpacing: '2px',
            cursor: onGoToLanding ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (onGoToLanding) {
              e.currentTarget.style.color = '#FF00FF';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (onGoToLanding) {
              e.currentTarget.style.color = '#00D9FF';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          ◼◼ StiQR
        </div>
        <nav style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <a onClick={onViewDashboard} style={{ color: '#fff', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' }}>
            Dashboard
          </a>
          <a onClick={onViewPricing} style={{ color: '#fff', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' }}>
            Pricing
          </a>
          
          {user ? (
            // User is logged in - show user info and logout
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.displayName}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00D9FF 0%, #FF00FF 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}>
                    {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <span style={{ color: '#fff', fontSize: '14px' }}>
                  {user.displayName || user.email}
                </span>
              </div>
              <button 
                onClick={logout}
                style={{ 
                  color: '#0a0a0a', 
                  textDecoration: 'none', 
                  fontSize: '14px', 
                  cursor: 'pointer',
                  background: '#ff6b6b',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  border: 'none',
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            // User is not logged in - show Sign Up and Login buttons
            <>
              <a onClick={handleSignUpClick} style={{ color: '#fff', textDecoration: 'none', fontSize: '16px', cursor: 'pointer' }}>
                Sign Up
              </a>
              <a onClick={handleLoginClick} style={{ 
                color: '#0a0a0a', 
                textDecoration: 'none', 
                fontSize: '16px', 
                cursor: 'pointer',
                background: '#00D9FF',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: '600',
              }}>
                Login
              </a>
            </>
          )}
        </nav>
      </header>
      {showSignUpModal && (
        <SignUpModal 
          onClose={handleModalClose}
          onLoginClick={handleLoginFromModal}
        />
      )}
      {showLoginModal && (
        <LoginModal 
          onClose={handleModalClose}
          onSignUpClick={handleSignUpFromModal}
        />
      )}
    </>
  );
};

export default TopBar;