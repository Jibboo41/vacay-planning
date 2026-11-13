import React from 'react';
import { auth, googleProvider } from '../core/firebase';
import { signInWithPopup } from 'firebase/auth';
import { LogIn } from 'lucide-react';
import BrandMark from './BrandMark';

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
          <div className="logo-icon"><BrandMark size={72} /></div>
          <h1>Vacay Planner</h1>
          <p>Your trips, organized.</p>
        </div>

        <button
          onClick={handleLogin}
          className="btn btn--primary btn--lg btn--block google-signin-btn"
          disabled={signingIn}
        >
          <LogIn size={20} />
          <span>{signingIn ? 'Waiting for Google...' : 'Sign in with Google'}</span>
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
