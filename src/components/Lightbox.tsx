import { useEffect, useState } from 'react';
import { closeLightbox, subscribeLightbox } from '../helpers/lightbox';

export function Lightbox() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => subscribeLightbox(setUrl), []);

  useEffect(() => {
    if (!url) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [url]);

  if (!url) return null;

  const caption = url.split('/').pop()?.replace(/\.[a-z]+$/i, '') ?? '';

  return (
    <div className="spa-lightbox" onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}>
      <img className="spa-lightbox__img" src={url} alt="" />
      <button className="spa-lightbox__close" onClick={closeLightbox}>×</button>
      <div className="spa-lightbox__caption">{caption}</div>
    </div>
  );
}

export default Lightbox;
