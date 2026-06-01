'use client';

import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const rateLimit = () => {
    setStatus('error');
    setMessage('Too many signups, please try again in a little while');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    // Rate Limiting Logic from Loops
    const time = new Date();
    const timestamp = time.valueOf();
    const previousTimestamp = localStorage.getItem('loops-form-timestamp');

    if (previousTimestamp && Number(previousTimestamp) + 60000 > timestamp) {
      rateLimit();
      return;
    }
    localStorage.setItem('loops-form-timestamp', timestamp.toString());

    setStatus('loading');
    setMessage('');

    const formBody = 'userGroup=&mailingLists=&email=' + encodeURIComponent(email);

    try {
      const res = await fetch('https://app.loops.so/api/newsletter-form/cmprgr6dt07g40jvl7ro0nae6', {
        method: 'POST',
        body: formBody,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (res.ok) {
        setStatus('success');
        setMessage("You're in. We'll find you.");
        setEmail('');
      } else {
        const data = await res.json();
        setStatus('error');
        setMessage(data.message ? data.message : res.statusText);
      }
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        rateLimit();
        return;
      }
      setStatus('error');
      setMessage(error.message || 'Oops! Something went wrong, please try again');
      localStorage.setItem('loops-form-timestamp', '');
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setMessage('');
    setEmail('');
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center animate-fade-in py-5">
        <p className="text-white text-sm font-medium">{message}</p>
        <button onClick={resetForm} className="text-[#666] text-xs hover:text-white transition-colors mt-4">
          &larr; Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 justify-center items-center w-full">
        <input
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
          className="w-full bg-white/[0.05] border border-white/10 px-8 py-5 rounded-full text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-[#333] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-circuit w-full md:w-auto justify-center whitespace-nowrap py-5 px-10 disabled:opacity-50"
        >
          <span>{status === 'loading' ? 'Please wait...' : 'Notify Me'}</span>
        </button>
      </form>
      {status === 'error' && (
        <div className="mt-4 flex flex-col items-center animate-fade-in">
          <p className="text-red-400 text-xs text-center">{message}</p>
          <button onClick={resetForm} className="text-[#666] text-xs hover:text-white transition-colors mt-2">
            &larr; Try Again
          </button>
        </div>
      )}
    </div>
  );
}
