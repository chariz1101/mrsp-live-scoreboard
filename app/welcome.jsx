"use client";

import { useEffect } from "react";

/* Bump the version to show the popup again to everyone who dismissed it. */
const SEEN_KEY = "mrsp-rstw2026-welcome-v1";

export function hasSeenWelcome() {
  try { return localStorage.getItem(SEEN_KEY) === "1"; } catch { return false; }
}

function markSeen() {
  try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* private mode: show again next time */ }
}

const STEPS = [
  "Open InnoVents on your phone",
  "Scan this activity code",
  "Submit your attendance",
  "Send us your feedback to receive certificates",
];

/* RSTW 2026 attendance card: event details and the InnoVents QR. */
export function Welcome({ onClose }) {
  const close = () => { markSeen(); onClose(); };

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="modal-back" onClick={close}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title"
        onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={close} aria-label="Close">×</button>

        <img className="modal-banner" src="/rstw/rstw-2026-banner.jpg"
          alt="Western Visayas RSTW 2026, ABL Sports Complex, Kalibo, Aklan, October 1–3, 2026" />

        <div className="modal-body">
          <div className="eyebrow">Western Visayas RSTW 2026</div>
          <h2 id="welcome-title">MRSP Western Visayas Exhibit</h2>
          <p className="lead">
            We&apos;re showcasing different types of robots, with interactive demos and
            games you can join.
          </p>

          <dl className="facts">
            <div><dt>Date</dt><dd>October 1–3, 2026</dd></div>
            <div><dt>Time</dt><dd>8:00 AM – 5:00 PM</dd></div>
            <div><dt>Venue</dt><dd>ABL Sports Complex, Capitol Site, Kalibo, Aklan</dd></div>
          </dl>

          <div className="attend">
            <img className="qr" src="/rstw/innovents-qr.png"
              alt="InnoVents attendance QR code for the MRSP Western Visayas Exhibit" />
            <div>
              <h3>Scan with the InnoVents app</h3>
              <ol className="steps">
                {STEPS.map((s, i) => <li key={i}><span>{i + 1}</span>{s}</li>)}
              </ol>
              <p className="hint">
                Viewing this on your phone? Scan the code shown at the MRSP booth
                instead. You can reopen this card anytime from <b>Attendance QR</b>.
              </p>
            </div>
          </div>

          <button className="act wide-btn" onClick={close}>View the scoreboard</button>
        </div>
      </div>
    </div>
  );
}
