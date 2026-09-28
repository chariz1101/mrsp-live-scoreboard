"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand, FacebookLink } from "./brand";
import {
  tankStandings, balloonStandings, overallStandings, formatTime,
} from "@/lib/scoring";

/* Two letters from the name, standing in for the avatar photo. */
function initials(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

function Row({ rank, name, team, meta, score, dnf }) {
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
        <div className={"score" + (dnf ? " dnf" : "")}>{score}</div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "overall", label: "Overall Champion", title: "Leaderboard",
    caption: "Tank band points plus balloon match points" },
  { id: "tank", label: "Robotic Arm Tank", title: "Arm Tank",
    caption: "Best of two attempts. Drops add 5s, hand touches add 10s." },
  { id: "balloon", label: "Pop the Balloon", title: "Balloon Pop",
    caption: "Three points per win, one for taking part" },
];

export default function Scoreboard() {
  const [data, setData] = useState({ players: [], runs: [], matches: [] });
  const [tab, setTab] = useState("overall");
  const [rotate, setRotate] = useState(false);
  const [err, setErr] = useState("");

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
        meta={r.dnf ? `${r.attempts} run${r.attempts > 1 ? "s" : ""}`
                    : `${formatTime(r.best)} · ${r.attempts} run${r.attempts > 1 ? "s" : ""}`}
        score={r.dnf ? "DNF" : r.points} dnf={r.dnf} />
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
        <button className="linkbtn" onClick={() => setRotate((v) => !v)}>
          Auto-rotate: {rotate ? "on" : "off"}
        </button>
        <Link className="linkbtn" href="/admin">Admin</Link>
      </div>

      {err ? <div className="note err">{err}</div> : null}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "on" : ""}
            onClick={() => setTab(t.id)}>{t.label}</button>
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
        <span>Mechatronics and Robotics Society of the Philippines · Western Visayas Junior Chapter</span>
        <FacebookLink label="Follow us on Facebook" />
      </div>
    </div>
  );
}
