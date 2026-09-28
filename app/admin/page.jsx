"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  adjustedTime, formatTime, tankPoints, tankBandLabel, TANK_BANDS,
} from "@/lib/scoring";

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [data, setData] = useState({ players: [], runs: [], matches: [] });
  const [note, setNote] = useState(null);

  const flash = (text, bad) => {
    setNote({ text, bad });
    setTimeout(() => setNote(null), 3500);
  };

  const pull = async () => {
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      const j = await r.json();
      if (!j.error) setData(j);
    } catch { /* the scoreboard page surfaces connection trouble */ }
  };

  useEffect(() => {
    pull();
    const t = setInterval(pull, 4000);
    return () => clearInterval(t);
  }, []);

  const unlock = async () => {
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (r.ok) { setUnlocked(true); setPin(""); }
    else { setPin(""); flash("Wrong PIN.", true); }
  };

  const send = async (path, body) => {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.status === 401) { setUnlocked(false); flash("Session expired. Enter the PIN again.", true); return false; }
    if (!r.ok) { const j = await r.json().catch(() => ({})); flash(j.error || "Could not save.", true); return false; }
    await pull();
    return true;
  };

  const drop = async (path, id) => {
    const r = await fetch(`${path}?id=${id}`, { method: "DELETE" });
    if (r.status === 401) { setUnlocked(false); flash("Session expired.", true); return; }
    await pull();
  };

  if (!unlocked) {
    return (
      <div className="wrap">
        <div className="top">
          <div className="brand">MRSP <b>Western Visayas</b></div>
          <div className="grow" />
          <Link className="linkbtn" href="/">Scoreboard</Link>
        </div>
        <div className="gate">
          <div className="card">
            <h2>Facilitators only</h2>
            <p className="sub">Enter the booth PIN.</p>
            {note ? <div className={"note " + (note.bad ? "err" : "ok")}>{note.text}</div> : null}
            <input type="password" inputMode="numeric" value={pin} placeholder="PIN"
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlock()} />
            <div style={{ height: 14 }} />
            <button className="act" style={{ width: "100%" }} onClick={unlock}>Unlock</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="top">
        <div className="brand">MRSP <b>Admin</b></div>
        <div className="grow" />
        <Link className="linkbtn" href="/">Scoreboard</Link>
      </div>

      {note ? <div className={"note " + (note.bad ? "err" : "ok")}>{note.text}</div> : null}

      <AddPlayer send={send} flash={flash} />
      <AddRun players={data.players} runs={data.runs} send={send} drop={drop} flash={flash} />
      <AddMatch players={data.players} matches={data.matches} send={send} drop={drop} flash={flash} />
      <PlayerList players={data.players} drop={drop} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AddPlayer({ send, flash }) {
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");

  const go = async () => {
    if (!name.trim()) return flash("Enter a name.", true);
    if (await send("/api/players", { name, team })) { setName(""); setTeam(""); }
  };

  return (
    <div className="card">
      <h2>Add player</h2>
      <p className="sub">Register everyone before they play.</p>
      <div className="row">
        <div><label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Juan dela Cruz"
            onKeyDown={(e) => e.key === "Enter" && go()} /></div>
        <div><label>School / team</label>
          <input value={team} onChange={(e) => setTeam(e.target.value)}
            placeholder="optional" onKeyDown={(e) => e.key === "Enter" && go()} /></div>
      </div>
      <button className="act" onClick={go}>Add player</button>
    </div>
  );
}

function Stopwatch({ onUse }) {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const started = useRef(0);
  const base = useRef(0);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setMs(base.current + (Date.now() - started.current)), 100);
    return () => clearInterval(t);
  }, [running]);

  const toggle = () => {
    if (running) { base.current += Date.now() - started.current; setRunning(false); }
    else { started.current = Date.now(); setRunning(true); }
  };
  const reset = () => { base.current = 0; setMs(0); setRunning(false); };

  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const t = Math.floor((ms % 1000) / 100);

  return (
    <div className="timer">
      <div className="disp">
        {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}.{t}
      </div>
      <div className="btns">
        <button className="act" onClick={toggle}>{running ? "Stop" : "Start"}</button>
        <button className="ghost" onClick={reset}>Reset</button>
        <button className="ghost" onClick={() => onUse((ms / 1000).toFixed(1))}>
          Use this time
        </button>
      </div>
    </div>
  );
}

function AddRun({ players, runs, send, drop, flash }) {
  const [pid, setPid] = useState("");
  const [time, setTime] = useState("");
  const [drops, setDrops] = useState(0);
  const [resets, setResets] = useState(0);
  const [dnf, setDnf] = useState(false);

  useEffect(() => {
    if (!pid && players.length) setPid(String(players[0].id));
  }, [players, pid]);

  // Live preview of what this run will score, before it is saved.
  const adj = dnf ? null
    : (parseFloat(time) || 0) + Number(drops) * 5 + Number(resets) * 10;
  const preview = dnf ? "DNF — 1 point"
    : adj > 0 ? `${formatTime(adj)} adjusted — ${tankBandLabel(adj)} — ${tankPoints(adj)} points`
    : "Enter a time to preview the score";

  const go = async () => {
    if (!pid) return flash("Choose a player.", true);
    const ok = await send("/api/runs", {
      player_id: Number(pid), time_sec: parseFloat(time) || 0,
      drops: Number(drops), resets: Number(resets), dnf,
    });
    if (ok) { setTime(""); setDrops(0); setResets(0); setDnf(false); }
  };

  const nameOf = (id) => players.find((p) => p.id === id)?.name || "(removed)";

  return (
    <div className="card">
      <h2>Robotic Arm Tank — record a run</h2>
      <p className="sub">
        Two attempts each, better one counts.{" "}
        {TANK_BANDS.map((b) => `${b.label} = ${b.points}`).join(" · ")} · 3:00+ = 2 · DNF = 1
      </p>

      <Stopwatch onUse={setTime} />

      <div className="row">
        <div><label>Player</label>
          <select value={pid} onChange={(e) => setPid(e.target.value)}>
            {players.length
              ? players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
              : <option value="">Add a player first</option>}
          </select></div>
        <div><label>Time (seconds)</label>
          <input type="number" step="0.1" min="0" value={time} placeholder="87.5"
            onChange={(e) => setTime(e.target.value)} disabled={dnf} /></div>
      </div>
      <div className="row">
        <div><label>Drops (+5s)</label>
          <input type="number" min="0" value={drops}
            onChange={(e) => setDrops(e.target.value)} disabled={dnf} /></div>
        <div><label>Hand touches (+10s)</label>
          <input type="number" min="0" value={resets}
            onChange={(e) => setResets(e.target.value)} disabled={dnf} /></div>
        <div><label>Result</label>
          <select value={dnf ? "1" : "0"} onChange={(e) => setDnf(e.target.value === "1")}>
            <option value="0">Finished</option>
            <option value="1">Did not finish</option>
          </select></div>
      </div>

      <div className="note ok">{preview}</div>
      <button className="act" onClick={go}>Save run</button>

      <div style={{ height: 18 }} />
      <div className="log">
        {runs.length
          ? runs.slice().reverse().slice(0, 8).map((r) => (
              <div key={r.id}>
                <span>{nameOf(r.player_id)}
                  <span className="pill">
                    {r.dnf ? "DNF" : `${formatTime(adjustedTime(r))} · ${tankPoints(adjustedTime(r))} pts`}
                  </span>
                </span>
                <button className="del" onClick={() => drop("/api/runs", r.id)}>remove</button>
              </div>
            ))
          : <div className="sub">No runs yet.</div>}
      </div>
    </div>
  );
}

function AddMatch({ players, matches, send, drop, flash }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [w, setW] = useState("");

  useEffect(() => {
    if (players.length >= 2) {
      if (!a) setA(String(players[0].id));
      if (!b) setB(String(players[1].id));
    }
  }, [players, a, b]);

  useEffect(() => { if (w !== a && w !== b) setW(a); }, [a, b, w]);

  const nameOf = (id) => players.find((p) => p.id === Number(id))?.name || "(removed)";

  const go = async () => {
    if (!a || !b) return flash("Choose both players.", true);
    if (a === b) return flash("Pick two different players.", true);
    await send("/api/matches", { a_id: Number(a), b_id: Number(b), winner_id: Number(w) });
  };

  const opts = players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>);

  return (
    <div className="card">
      <h2>Pop the Balloon — record a match</h2>
      <p className="sub">Winner takes 3 points. Everyone who plays gets 1.</p>
      <div className="row">
        <div><label>Player A</label>
          <select value={a} onChange={(e) => setA(e.target.value)}>{opts}</select></div>
        <div><label>Player B</label>
          <select value={b} onChange={(e) => setB(e.target.value)}>{opts}</select></div>
        <div><label>Winner</label>
          <select value={w} onChange={(e) => setW(e.target.value)}>
            {a ? <option value={a}>{nameOf(a)}</option> : null}
            {b && b !== a ? <option value={b}>{nameOf(b)}</option> : null}
          </select></div>
      </div>
      <button className="act" onClick={go}>Save match</button>

      <div style={{ height: 18 }} />
      <div className="log">
        {matches.length
          ? matches.slice().reverse().slice(0, 8).map((m) => (
              <div key={m.id}>
                <span>{nameOf(m.a_id)} vs {nameOf(m.b_id)}
                  <span className="pill">{nameOf(m.winner_id)} won</span></span>
                <button className="del" onClick={() => drop("/api/matches", m.id)}>remove</button>
              </div>
            ))
          : <div className="sub">No matches yet.</div>}
      </div>
    </div>
  );
}

function PlayerList({ players, drop }) {
  return (
    <div className="card">
      <h2>Players</h2>
      <p className="sub">Removing a player also removes their runs and matches.</p>
      <div className="log">
        {players.length
          ? players.map((p) => (
              <div key={p.id}>
                <span>{p.name}{p.team ? <span className="pill">{p.team}</span> : null}</span>
                <button className="del"
                  onClick={() => confirm(`Remove ${p.name} and all their scores?`)
                    && drop("/api/players", p.id)}>remove</button>
              </div>
            ))
          : <div className="sub">No players yet.</div>}
      </div>
    </div>
  );
}
