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

function Row({ rank, name, team, meta, score }) {
  const medal = rank <= 3 ? ["g1", "g2", "g3"][rank - 1] : null;
  return (
    <div className={"rowline" + (rank === 1 ? " top1" : "")}>
      <div className="rankbox">
        {medal
          ? <div className={"medal " + medal}>{rank}</div>
          : <div className="plainrank">{rank}</div>}
      </div>
      <div className="avatar">{initials(name)}</div>
      <div className="bar">
        <div className="who">
          <div className="nm">{name}</div>
          {team ? <div className="tm">{team}</div> : null}
        </div>
        {meta ? <div className="meta">{meta}</div> : null}
        <div className="score">{score}</div>
      </div>
    </div>
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

  let rows = [];
  if (tab === "tank") {
    rows = tankStandings(players, runs).map((r, i) => (
      <Row key={r.player.id} rank={i + 1} name={r.player.name} team={r.player.team}
        meta={<>
          <b className={"time" + (r.dnf ? " dnf" : "")}>{r.dnf ? "DNF" : formatTime(r.best)}</b>
          {` · ${r.attempts} run${r.attempts > 1 ? "s" : ""}`}
        </>}
        score={r.points} />
    ));
  } else if (tab === "balloon") {
    rows = balloonStandings(players, matches).map((r, i) => (
      <Row key={r.player.id} rank={i + 1} name={r.player.name} team={r.player.team}
        meta={`${r.wins}W · ${r.losses}L`} score={r.points} />
    ));
  } else {
    rows = overallStandings(players, runs, matches).map((r, i) => (
      <Row key={r.player.id} rank={i + 1} name={r.player.name} team={r.player.team}
        meta={`Tank ${r.tankPoints} · Balloon ${r.balloonPoints}`} score={r.total} />
    ));
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

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "on" : ""}
            onClick={() => setTab(t.id)}>
            <span className="desk-only">{t.label}</span>
            <span className="phone-only">{t.short}</span>
          </button>
        ))}
      </div>

      <div className={"frame" + (tab === "balloon" ? " red" : "")}>
        <div className="title"><h1>{meta.title}</h1></div>
        <div className="caption">{meta.caption}</div>
        {rows.length
          ? <div className="rows">{rows}</div>
          : <div className="empty">No scores recorded yet.</div>}
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
