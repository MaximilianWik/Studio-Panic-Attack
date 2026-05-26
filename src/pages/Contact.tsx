import { useState } from 'react';
import PageShell from '../components/PageShell/PageShell';
import { Img } from '../helpers/media';
import { CONTACT_ASSETS } from '../generated/mediaManifest';

/**
 * Contact — sticky-note styled form. Submits via Web3Forms (free service,
 * no signup beyond the public access key) and falls back to a mailto: if
 * the network call fails. The Web3Forms key is a public token — it just
 * routes form data to panicoattaki@gmail.com on the Web3Forms backend.
 *
 * Replace WEB3FORMS_KEY with the real key once Ema has signed up at
 * https://web3forms.com — until then, the form falls through to mailto.
 */

const WEB3FORMS_KEY = ''; // placeholder — fill with the real access key

const STAR = CONTACT_ASSETS[0]; // "Layer 1 star.png" if present

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function Contact() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const subject = String(data.get('subject') ?? '').trim() || 'Hello from studiopanicattack.com';
    const message = String(data.get('message') ?? '').trim();

    if (!name || !email || !message) {
      setStatus('error');
      setErrorMsg('Please fill in name, email and message.');
      return;
    }

    setStatus('sending');

    if (WEB3FORMS_KEY) {
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            name, email, subject, message,
            from_name: 'Studio Panic Attack contact form',
          }),
        });
        if (res.ok) {
          setStatus('sent');
          form.reset();
          return;
        }
        throw new Error('HTTP ' + res.status);
      } catch (err) {
        // Fall through to mailto fallback below.
        // eslint-disable-next-line no-console
        console.warn('[contact] web3forms failed, falling back to mailto:', err);
      }
    }

    // Mailto fallback — opens the user's mail client with the message
    // pre-filled. Works without any backend.
    const body = 'From: ' + name + ' <' + email + '>\n\n' + message;
    const mailto =
      'mailto:panicoattaki@gmail.com' +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    window.location.href = mailto;
    setStatus('sent');
    form.reset();
  }

  return (
    <PageShell routeName="Contact" className="spa-contact">
      {STAR ? (
        <div className="spa-contact__decor" aria-hidden>
          <Img src={STAR.url} alt="" className="spa-contact__star spa-contact__star--a" />
          <Img src={STAR.url} alt="" className="spa-contact__star spa-contact__star--b" />
          <Img src={STAR.url} alt="" className="spa-contact__star spa-contact__star--c" />
          <Img src={STAR.url} alt="" className="spa-contact__star spa-contact__star--d" />
        </div>
      ) : null}

      <main className="spa-contact__main">
        <h1 className="spa-contact__title">Let&rsquo;s talk.</h1>
        <p className="spa-contact__intro">
          Got an idea, a project, an event you want to make weirder? Drop it
          on the Post-it. I read everything.
        </p>

        <form className="spa-contact__form spa-note spa-note--yellow" onSubmit={onSubmit} noValidate>
          <div className="spa-note__pin" aria-hidden />
          <label className="spa-contact__field">
            <span>Name</span>
            <input type="text" name="name" autoComplete="name" required />
          </label>
          <label className="spa-contact__field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label className="spa-contact__field">
            <span>Subject</span>
            <input type="text" name="subject" autoComplete="off" />
          </label>
          <label className="spa-contact__field spa-contact__field--msg">
            <span>Message</span>
            <textarea name="message" rows={6} required />
          </label>

          <div className="spa-contact__row">
            <button
              type="submit"
              className="spa-contact__send"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'sending\u2026' : 'Send'}
            </button>
            <a className="spa-contact__alt" href="mailto:panicoattaki@gmail.com">or just email me</a>
          </div>

          <div className={'spa-contact__status spa-contact__status--' + status} role="status" aria-live="polite">
            {status === 'sent' ? '\u2713 thanks — I\u2019ll get back to you soon.' : null}
            {status === 'error' ? errorMsg : null}
          </div>
        </form>
      </main>
    </PageShell>
  );
}

export default Contact;
