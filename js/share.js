/* share.js — the emoji grid players paste into chat. */
const GLYPH = {
  perfect: '🟪', bullseye: '🟫', hit: '🟦', graze: '🟨', miss: '⬛',
};
function silentGlyph(tier) {
  /* a hit earned with zero pings is bragging rights, not a colour */
  return tier === 'miss' ? '⬛' : '💠';
}
function shareGrid(results) {
  return results.map(r => (r.pings === 0 && r.tier !== 'miss' ? silentGlyph(r.tier) : GLYPH[r.tier])).join('');
}
function shareText(n, results, score) {
  const depth = score * TRENCH.pointsPerMetre;
  return `FATHOM #${String(n).padStart(4, '0')} — ${depth} m\n${shareGrid(results)}`;
}
