/* =====================================================================
   Scoring rules. Change the numbers here and both the scoreboard and
   the admin dashboard follow.
   ===================================================================== */

export const PENALTY_DROP = 5;    // seconds added per dropped object
export const PENALTY_RESET = 10;  // seconds added per hand touch / reset

/* Robotic Arm Tank: the adjusted time falls into a band and the band
   awards the points. Fastest band first; the first one a time fits wins. */
export const TANK_BANDS = [
  { under: 90,  points: 10, label: "Under 1:30" },
  { under: 120, points: 8,  label: "Under 2:00" },
  { under: 150, points: 6,  label: "Under 2:30" },
  { under: 180, points: 4,  label: "Under 3:00" },
];
export const TANK_SLOW_POINTS = 2;  // finished, but 3:00 or over
export const TANK_DNF_POINTS = 1;   // attempted, never finished

export const BALLOON_WIN_POINTS = 3;
export const BALLOON_PLAY_POINTS = 1;  // once, for taking part at all

export function adjustedTime(run) {
  return Number(run.time_sec)
       + Number(run.drops) * PENALTY_DROP
       + Number(run.resets) * PENALTY_RESET;
}

export function tankPoints(adjusted) {
  for (const band of TANK_BANDS) if (adjusted < band.under) return band.points;
  return TANK_SLOW_POINTS;
}

export function tankBandLabel(adjusted) {
  for (const band of TANK_BANDS) if (adjusted < band.under) return band.label;
  return "3:00 or over";
}

export function formatTime(sec) {
  if (sec == null) return "\u2014";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ":" + s.toFixed(1).padStart(4, "0");
}

export function tankStandings(players, runs) {
  const byPlayer = new Map();
  for (const r of runs) {
    if (!byPlayer.has(r.player_id)) byPlayer.set(r.player_id, []);
    byPlayer.get(r.player_id).push(r);
  }

  const rows = [];
  for (const [pid, list] of byPlayer) {
    const player = players.find((p) => p.id === pid);
    if (!player) continue;

    const finished = list.filter((r) => !r.dnf);
    const best = finished.length ? Math.min(...finished.map(adjustedTime)) : null;

    rows.push({
      player,
      attempts: list.length,
      best,
      dnf: best === null,
      points: best === null ? TANK_DNF_POINTS : tankPoints(best),
      band: best === null ? "DNF" : tankBandLabel(best),
    });
  }

  // Highest points first, fastest time as the tiebreak.
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (a.dnf !== b.dnf) return a.dnf ? 1 : -1;
    if (a.dnf) return a.player.name.localeCompare(b.player.name);
    return a.best - b.best;
  });
  return rows;
}

export function balloonStandings(players, matches) {
  const stats = new Map();
  const touch = (pid) => {
    if (!stats.has(pid)) stats.set(pid, { wins: 0, losses: 0 });
    return stats.get(pid);
  };

  for (const m of matches) {
    const a = touch(m.a_id);
    const b = touch(m.b_id);
    if (m.winner_id === m.a_id) { a.wins++; b.losses++; }
    else { b.wins++; a.losses++; }
  }

  const rows = [];
  for (const [pid, s] of stats) {
    const player = players.find((p) => p.id === pid);
    if (!player) continue;
    rows.push({
      player,
      wins: s.wins,
      losses: s.losses,
      played: s.wins + s.losses,
      points: s.wins * BALLOON_WIN_POINTS + BALLOON_PLAY_POINTS,
    });
  }

  rows.sort((a, b) =>
    b.points - a.points || a.losses - b.losses ||
    a.player.name.localeCompare(b.player.name));
  return rows;
}

export function overallStandings(players, runs, matches) {
  const tank = tankStandings(players, runs);
  const balloon = balloonStandings(players, matches);

  const totals = new Map();
  const bump = (pid, n) => totals.set(pid, (totals.get(pid) || 0) + n);
  for (const r of tank) bump(r.player.id, r.points);
  for (const r of balloon) bump(r.player.id, r.points);

  const rows = [];
  for (const [pid, total] of totals) {
    const player = players.find((p) => p.id === pid);
    if (!player) continue;
    const t = tank.find((r) => r.player.id === pid);
    const b = balloon.find((r) => r.player.id === pid);
    rows.push({
      player, total,
      tankPoints: t ? t.points : 0,
      tankBest: t && !t.dnf ? t.best : null,
      balloonPoints: b ? b.points : 0,
      balloonRecord: b ? b.wins + "-" + b.losses : "\u2014",
    });
  }

  rows.sort((a, b) => b.total - a.total || a.player.name.localeCompare(b.player.name));
  return rows;
}
