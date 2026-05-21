import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

// Note: StrictMode is intentionally NOT used. drei's resource hooks
// (useTexture / useLoader / Environment) interact poorly with the double
// invocation pattern in r3f v9 + React 19, occasionally leaving Suspense
// in a permanent pending state during dev. The production build with
// strict double-invocation disabled is the deployed reality.
createRoot(document.getElementById('root')!).render(<App />);
