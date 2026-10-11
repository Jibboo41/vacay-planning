import React from 'react';
import { auth, googleProvider } from '../core/firebase';
import { signInWithPopup } from 'firebase/auth';
import { LogIn } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const [signingIn, setSigningIn] = React.useState(false);

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      console.log('Opening Google Sign-in Popup...');
      await signInWithPopup(auth, googleProvider);
      // Popup success will be handled by the auth state listener in App.tsx
    } catch (error: any) {
      console.error('Login failed:', error);
      setSigningIn(false);
      if (error.code === 'auth/popup-blocked') {
        alert('Please allow popups for this site to sign in.');
      } else {
        alert('Login Error: ' + (error.message || 'Unknown error'));
      }
    }
  };

  return (
    <div className="login-screen">
      <div className="login-content">
        <div className="logo-container">
          <div className="logo-icon">✈️</div>
          <h1>Vacay Planner</h1>
          <p>Your journeys, beautifully organized.</p>
        </div>

        <button 
          onClick={handleLogin} 
          className="google-signin-btn"
          disabled={signingIn}
        >
          <LogIn size={20} />
          <span>{signingIn ? 'Waiting for Google...' : 'Sign in with Google'}</span>
        </button>
      </div>

      <style>{`
        .login-screen {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          color: #fff;
          overflow: hidden;
          position: relative;
        }

        .login-content {
          z-index: 10;
          text-align: center;
          padding: 2rem;
          width: 100%;
          max-width: 400px;
          animation: fadeIn 1s ease-out;
        }

        .logo-container {
          margin-bottom: 3rem;
        }

        .logo-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          display: inline-block;
          animation: float 3s ease-in-out infinite;
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #fff 0%, #aaa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        p {
          color: #888;
          font-size: 1.1rem;
        }

        .google-signin-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }

        .google-signin-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .google-signin-btn:active {
          transform: translateY(0);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
