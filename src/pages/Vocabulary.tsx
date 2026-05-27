import PageShell from '../components/PageShell/PageShell';
import { Img } from '../helpers/media';
import { VOCABULARY_ASSETS, type MediaAsset } from '../generated/mediaManifest';
import { openLightbox } from '../helpers/lightbox';

/**
 * Vocabulary page — a glossary of recurring visual themes / words. Each
 * letter is rendered massive next to its illustration. The Firefly file
 * is special-cased to "A".
 */

const ENTRIES: { letter: string; asset: MediaAsset; word: string; def: string }[] = [
  {
    letter: 'A',
    asset: VOCABULARY_ASSETS.find((a) => /firefly|inflated|puffy/i.test(a.file)) ?? VOCABULARY_ASSETS[0],
    word: 'Aesthetic',
    def: 'Soft, inflated, slightly off — the cotton-cloud language. Forms that look pinched-by-hand, that feel like they\u2019d give if you squeezed them.',
  },
  {
    letter: 'B',
    asset: VOCABULARY_ASSETS.find((a) => /Letter\s*B/i.test(a.file)) ?? VOCABULARY_ASSETS[1],
    word: 'Bloom',
    def: 'A controlled overgrowth — letters, plants and ideas that spread out beyond their frame and almost spill onto the next thing.',
  },
  {
    letter: 'C',
    asset: VOCABULARY_ASSETS.find((a) => /Letter\s*C/i.test(a.file)) ?? VOCABULARY_ASSETS[2],
    word: 'Curiosity',
    def: 'Built into every project as a mechanic. Hide a match in a box. Put a question on a card. Let people unlock the next bit themselves.',
  },
];

export function Vocabulary() {
  return (
    <PageShell routeName="Vocabulary" className="spa-vocab">
      <header className="spa-vocab__hd">
        <p className="spa-vocab__eyebrow">— glossary —</p>
        <h1 className="spa-vocab__title">Vocabulary</h1>
        <p className="spa-vocab__intro">
          A small dictionary of the words and shapes that keep coming back in my work.
          Read it like a moodboard — by letter, by image, or by the thing that catches your eye.
        </p>
      </header>

      {ENTRIES.map((e, i) => (
        <article className={'spa-vocab__entry spa-vocab__entry--' + (i % 2 === 0 ? 'l' : 'r')} key={e.letter}>
          <div className="spa-vocab__big" aria-hidden>{e.letter}</div>
          <div className="spa-vocab__media">
            {e.asset ? (
              <button
                type="button"
                className="spa-vocab__media-btn"
                onClick={() => openLightbox(e.asset.url)}
                aria-label={'Open ' + e.word}
              >
                <Img
                  src={e.asset.url}
                  alt={e.word}
                  webpSrcset={e.asset.webpSrcset}
                  avifSrcset={e.asset.avifSrcset}
                  lqip={e.asset.lqip}
                />
              </button>
            ) : null}
          </div>
          <div className="spa-vocab__copy">
            <div className="spa-vocab__letter-mark">{e.letter} <span aria-hidden>·</span></div>
            <h2 className="spa-vocab__word">{e.word}</h2>
            <p className="spa-vocab__def">{e.def}</p>
          </div>
        </article>
      ))}

      <p className="spa-vocab__more">More entries coming. The dictionary keeps growing — just like the practice.</p>
    </PageShell>
  );
}

export default Vocabulary;
