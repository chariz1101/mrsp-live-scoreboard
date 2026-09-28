"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand, FacebookLink } from "./brand";
import { Welcome, hasSeenWelcome } from "./welcome";
import {
  tankStandings, balloonStandings, overallStandings, formatTime,
} from "@/lib/scoring";

/* Two letters from the name, standing in for the avatar photo. */
function initials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

/* Avatar colours stay in the brand's reds and blues. The same name
   always gets the same colour, so a player is easy to spot across boards. */
const TONES = [
  ["#d0121a", "#590632"],
  ["#2c34e0", "#050987"],
  ["#4f6bff", "#1a1fb0"],
  ["#b3122e", "#2c34e0"],
];
function tone(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [a, b] = TONES[h % TONES.length];
  return { background: `linear-gradient(150deg, ${a}, ${b})` };
}

function Avatar({ name, className = "" }) {
  return <div className={"av " + className} style={tone(name)}>{initials(name)}</div>;
}

function Crown() {
  return (
    <svg className="crown" viewBox="0 0 64 40" aria-hidden="true">
      <path d="M4 14l14 10L32 4l14 20 14-10-6 26H10z" fill="#f2b632" stroke="#b7811a" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="4" cy="12" r="4" fill="#f2b632" /><circle cx="32" cy="4" r="4" fill="#f2b632" /><circle cx="60" cy="12" r="4" fill="#f2b632" />
    </svg>
  );
}

/* Top three on a podium: 2nd, 1st, 3rd from left to right. */
function Podium({ entries }) {
  return (
    <div className="podium">
      {[1, 0, 2].map((i) => {
        const e = entries[i];
        return (
          <div key={i} className={"place p" + (i + 1)}>
            <div className="who">
              {e ? (
                <>
                  {i === 0 ? <Crown /> : null}
                  <div className="pav-wrap">
                    <Avatar name={e.name} className="pav" />
                    <span className="chip">{e.score} pts</span>
                  </div>
                  <div className="pname">{e.name}</div>
                  <div className="psub">{e.sub}</div>
                </>
              ) : (
                <>
                  <div className="pav-wrap"><div className="av pav open">?</div></div>
                  <div className="pname open">Open spot</div>
                </>
              )}
            </div>
            <div className="block"><span>{i + 1}</span></div>
          </div>
        );
      })}
    </div>
  );
}

/* Everyone from 4th place down. */
function RankList({ entries }) {
  if (!entries.length) {
    return <div className="sheet-empty">Players from 4th place onwards will show up here.</div>;
  }
  return (
    <ol className="rank-list">
      {entries.map((e, i) => (
        <li key={e.id} className="lrow">
          <span className="lrank">{i + 4}</span>
          <Avatar name={e.name} className="lav" />
          <div className="lwho">
            <div className="lname">{e.name}</div>
            <div className="lsub">{e.team ? <>{e.team} · </> : null}{e.sub}</div>
          </div>
          <div className="lscore">{e.score}<small>pts</small></div>
        </li>
      ))}
    </ol>
  );
}

const TABS = [
  { id: "overall", label: "Overall Champion", short: "Overall", title: "Leaderboard",
    caption: "Tank band points plus balloon match points" },
  { id: "tank", label: "Robotic Arm Tank", short: "Arm Tank", title: "Arm Tank",
    caption: "Unlimited attempts, best time counts. Drops add 5s, hand touches add 10s." },
  { id: "balloon", label: "Pop the Balloon", short: "Balloon", title: "Balloon Pop",
    caption: "Three points per win, one for taking part" },
];

function QrIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm8-2h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h4v2h-2v2h-2v-4zm-4 4h2v2h2v2h-4v-4zm6 2h2v2h-2v-2z" />
    </svg>
  );
}

export default function Scoreboard() {
  const [data, setData] = useState({ players: [], runs: [], matches: [] });
  const [tab, setTab] = useState("overall");
  const [rotate, setRotate] = useState(false);
  const [err, setErr] = useState("");
  const [welcome, setWelcome] = useState(false);

  // First visit on this browser: show the RSTW attendance card.
  useEffect(() => { if (!hasSeenWelcome()) setWelcome(true); }, []);

  /* Poll rather than hold a socket open. Vercel's serverless functions
     are short-lived, so a 3s poll is simpler and costs almost nothing. */
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const r = await fetch("/api/state", { cache: "no-store" });
        const j = await r.json();
        if (!alive) return;
        if (j.error) setErr(j.error);
        else { setErr(""); setData(j); }
      } catch {
        if (alive) setErr("Cannot reach the server.");
      }
    };
    pull();
    const t = setInterval(pull, 3000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => {
    if (!rotate) return;
    const t = setInterval(() => {
      setTab((cur) => TABS[(TABS.findIndex((x) => x.id === cur) + 1) % TABS.length].id);
    }, 9000);
    return () => clearInterval(t);
  }, [rotate]);

  const { players, runs, matches } = data;
  const meta = TABS.find((t) => t.id === tab);

  // One shape for every board: name, score and a short detail line.
  const entry = (r, score, sub) =>
    ({ id: r.player.id, name: r.player.name, team: r.player.team, score, sub });
  let entries;
  if (tab === "tank") {
    entries = tankStandings(players, runs).map((r) => entry(r, r.points, <>
      <b className={"time" + (r.dnf ? " dnf" : "")}>{r.dnf ? "DNF" : formatTime(r.best)}</b>
      {` · ${r.attempts} run${r.attempts > 1 ? "s" : ""}`}
    </>));
  } else if (tab === "balloon") {
    entries = balloonStandings(players, matches)
      .map((r) => entry(r, r.points, `${r.wins}W · ${r.losses}L`));
  } else {
    entries = overallStandings(players, runs, matches)
      .map((r) => entry(r, r.total, `Tank ${r.tankPoints} · Balloon ${r.balloonPoints}`));
  }

  return (
    <div className="wrap">
      <div className="top">
        <Brand />
        <div className="grow" />
        <div className="actions">
          {/* Auto-rotate is for the booth display; phones don't need it. */}
          <button className="linkbtn desk-only" onClick={() => setRotate((v) => !v)}>
            Auto-rotate: {rotate ? "on" : "off"}
          </button>
          <button className="linkbtn" onClick={() => setWelcome(true)}>
            <QrIcon /><span className="desk-only">Attendance QR</span><span className="phone-only">Check in</span>
          </button>
          <Link className="linkbtn desk-only" href="/admin">Admin</Link>
        </div>
      </div>

      {err ? <div className="note err">{err}</div> : null}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id}
            className={tab === t.id ? "on" : ""}
            onClick={() => setTab(t.id)}>
            <span className="desk-only">{t.label}</span>
            <span className="phone-only">{t.short}</span>
          </button>
        ))}
      </div>

      <div className="board">
        <section className="stagebox">
          <h1 className="board-title">{meta.title}</h1>
          <p className="caption">{meta.caption}</p>
          <Podium entries={entries} />
        </section>

        <section className="sheet" aria-label="Rankings from 4th place">
          <div className="handle" aria-hidden="true" />
          <RankList entries={entries.slice(3)} />
        </section>
      </div>

      <div className="foot">
        <span>Mechatronics and Robotics Society of the Philippines - Western Visayas Junior Chapter</span>
        <FacebookLink label="Follow us on Facebook" />
        <Link className="footlink phone-only" href="/admin">Facilitator login</Link>
      </div>

      {welcome ? <Welcome onClose={() => setWelcome(false)} /> : null}
    </div>
  );
}
