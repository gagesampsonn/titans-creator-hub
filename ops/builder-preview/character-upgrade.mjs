import { join } from 'node:path';
// Local snapshot of Gage's supplied package. No production page is overwritten.
export const upgradeRoot = join(import.meta.dirname,'character-upgrade');

function section(text,start,end) {
  const from = text.indexOf(start), to = text.indexOf(end,from+start.length);
  if(from < 0 || to < 0 || text.indexOf(start,from+start.length) >= 0) throw Error(`Character upgrade boundary missing or ambiguous: ${start}`);
  return text.slice(from,to);
}
export function composeCharacterUpgrade(current,supplied) {
  let html = current.replace(/\r\n?/g,'\n');
  const upgrade = supplied.replace(/\r\n?/g,'\n');
  // Deliberately retain the current downloader, navigation and multi-image video code.
  for(const [start,end] of [
    ['    <section class="section" id="character-builder">','    <section class="section" id="character-examples">'],
    ['    const genericBucket = {','    const modeCopy = {'],
    ['    buildImagePrompt(true);\n\n    characterForm.addEventListener','    function invalidatePrompt()']
  ]) html = html.replace(section(html,start,end),section(upgrade,start,end));
  const styles = section(upgrade,'    .slot-card-head {','    .slot-label {');
  html = html.replace('    .slot-label {',styles+'    .slot-label {');
  html = html.replace('  <script>','  <script src="/__demo/character-library.js"></script>\n  <script>');
  html = html.replace(/data-lock="(body|face|hair|eyes|skin|outfit)" aria-pressed="false"/g, '$& aria-label="Lock $1"');
  const unlock = 'if (lockButton) lockButton.setAttribute("aria-pressed", "false");';
  if (html.split(unlock).length !== 3) throw Error('Character auto-unlock boundary changed');
  html = html.replaceAll(unlock,'if (lockButton) { lockButton.setAttribute("aria-pressed", "false"); lockButton.textContent = "Lock"; }');
  return html;
}
