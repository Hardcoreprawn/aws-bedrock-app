import { useEffect, useRef, useState } from 'react';
import { getAccount, isAuthConfigured, signIn, signOut } from './auth';
import { createUploadTargets, getReview, startReview, uploadFiles, type ReviewRecord } from './api';

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewRecord | null>(null);
  const [accountName, setAccountName] = useState<string | null>(getAccount()?.name ?? null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setAccountName(getAccount()?.name ?? null);
  }, []);

  async function handleSubmit() {
    if (files.length === 0) {
      setError('Select at least one document.');
      return;
    }

    if (isAuthConfigured && !getAccount()) {
      setError('Sign in is required before starting a review.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const uploadTargets = await createUploadTargets(files);
      const objectKeys = await uploadFiles(files, uploadTargets);
      const createdReview = await startReview(objectKeys);

      setReview(createdReview);
      pollReview(createdReview.reviewId);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unknown error');
      setIsSubmitting(false);
    }
  }

  function pollReview(reviewId: string) {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
    }

    pollRef.current = window.setInterval(async () => {
      try {
        const currentReview = await getReview(reviewId);
        setReview(currentReview);

        if (currentReview.status === 'COMPLETED' || currentReview.status === 'FAILED') {
          if (pollRef.current !== null) {
            window.clearInterval(pollRef.current);
          }
          setIsSubmitting(false);
        }
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : 'Polling failed');
        setIsSubmitting(false);
      }
    }, 3000);
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <div className="auth-bar">
            <span className="auth-badge">{isAuthConfigured ? 'Entra auth enabled' : 'Local preview mode'}</span>
            {isAuthConfigured ? (
              accountName ? (
                <div className="auth-actions">
                  <span className="auth-copy">Signed in as {accountName}</span>
                  <button className="secondary-button" onClick={() => signOut()}>
                    Sign out
                  </button>
                </div>
              ) : (
                <button className="secondary-button" onClick={() => signIn()}>
                  Sign in with Entra
                </button>
              )
            ) : null}
          </div>
          <p className="eyebrow">AWS Bedrock review scaffold</p>
          <h1>Multi-agent document review for regulated teams</h1>
          <p className="lede">
            Upload a small document set, trigger a Bedrock-backed review, and inspect specialist findings for
            grammar, referencing, citations, and policy risk.
          </p>
        </div>
        <div className="card">
          <label className="upload-field">
            <span>Select documents</span>
            <input
              type="file"
              multiple
              accept=".txt,.md,.csv,.json"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </label>
          <p className="hint">PoC mode is optimized for text-based files. Binary parsing can be added later.</p>
          <button className="primary-button" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? 'Submitting review...' : 'Start review'}
          </button>
          {isAuthConfigured && !accountName && <p className="hint">Authenticate before submitting a document review.</p>}
          {files.length > 0 && (
            <ul className="file-list">
              {files.map((file) => (
                <li key={file.name}>{file.name}</li>
              ))}
            </ul>
          )}
          {error && <p className="error-text">{error}</p>}
        </div>
      </section>

      <section className="results-panel">
        <div className="section-heading">
          <p className="eyebrow">Review status</p>
          <h2>{review?.status ?? 'Waiting for submission'}</h2>
        </div>
        {review?.findings?.length ? (
          <div className="finding-grid">
            {review.findings.map((finding) => (
              <article key={finding.agent} className="finding-card">
                <h3>{finding.agent}</h3>
                <p>{finding.summary}</p>
                <pre>{finding.details}</pre>
              </article>
            ))}
          </div>
        ) : (
          <p className="placeholder-copy">Specialist findings will appear here once the orchestration completes.</p>
        )}

        {review?.finalSummary && (
          <article className="summary-card">
            <h3>Final synthesis</h3>
            <p>{review.finalSummary}</p>
          </article>
        )}
      </section>
    </main>
  );
}

export default App;
