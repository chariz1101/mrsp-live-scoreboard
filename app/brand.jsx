export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61591024487996";

/* Logo and wordmark, shared by the scoreboard and admin headers. */
export function Brand({ sub = "Junior Chapter" }) {
  return (
    <div className="brand">
      <img className="logo" src="/mrsp-logo.jpg" alt="MRSP Western Visayas Junior Chapter" />
      <div className="wordmark">
        <div className="mrsp">MRSP</div>
        <div className="wv">Western Visayas</div>
        <div className="jc">{sub}</div>
      </div>
    </div>
  );
}

export function FacebookLink({ label = "Facebook" }) {
  return (
    <a className="linkbtn fb" href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path fill="currentColor" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
      </svg>
      {label}
    </a>
  );
}
