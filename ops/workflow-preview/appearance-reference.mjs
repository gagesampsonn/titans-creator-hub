export function buildAppearancePrompt(outfit = '') {
  const sections = [
    'A picture is taken of an adult person, framed from the ankles up, facing the camera. Use the person in the uploaded photo as the appearance reference. Keep their recognizable facial features, skin tone, eye color, hair and overall appearance. Do not substitute a randomly generated identity. Show the full head with a little space above it, the torso, arms, hands and legs down to the ankles. Use a relaxed, natural standing pose with the face and body directed toward the camera and the eyes looking into the lens.',
    'Use a straightforward phone-camera perspective, natural body proportions, soft even lighting and a seamless light-gray studio background. The uploaded photo guides the character’s appearance, not the pose, crop, background or composition of the output. Do not copy a motion-video subject or motion-video framing.',
    outfit.trim() ? `Outfit or product instruction: ${outfit.trim()}. Keep the reference appearance while applying these clothing or product details. Do not change facial identity to match an outfit.` : 'Keep the outfit consistent with the uploaded reference where visible. Complete any unseen clothing naturally without inventing logos or distracting accessories.',
    'Render an unretouched, hyper-realistic photograph with natural facial pores, fine skin texture, realistic eyes and catchlights, individual eyebrow hairs and hair strands, believable hands and detailed fabric. Avoid waxy skin, beauty filters, exaggerated sharpening, distorted anatomy and CGI styling. One photographic image only; no collage, text or watermark.',
  ];
  return sections.join('\n\n');
}

export function installAppearanceReference() {
  const $ = id => document.getElementById(id);
  const state = { active: false, buildPrompt: buildAppearancePrompt };
  window.TitansAppearanceReference = state;
  // Old layout-frame and two-photo avatar modes do not describe this single-photo flow.
  $('useFrameReference').value = 'no';
  $('useFrameReference').closest('.field').hidden = true;
  $('imagePromptMode').value = 'character';
  $('imagePromptMode').closest('.field').hidden = true;
  const disabledBeforeReference = new Map();
  function sync(present) {
    state.active = present;
    $('character-builder').classList.toggle('wf-appearance-active', present);
    const controls = [...$('characterForm').querySelectorAll('input,select,textarea')].filter(node => node.id !== 'productInstruction');
    for (const control of controls) {
      if (present && !disabledBeforeReference.has(control)) disabledBeforeReference.set(control, control.disabled);
      control.disabled = present || (disabledBeforeReference.get(control) ?? control.disabled);
      if (!present && disabledBeforeReference.has(control)) { control.disabled = disabledBeforeReference.get(control); disabledBeforeReference.delete(control); }
    }
    $('wf-appearance-status').textContent = present
      ? 'Appearance reference selected. Your photo supplies the character’s look; random traits are not used. Output: ankles up, facing the camera.'
      : 'Optional: upload a photo of what you want your AI character to look like—not a frame from the motion video. Without a photo, use the character controls below.';
    window.buildImagePrompt(false);
    $('generateImagePromptBtn').textContent = present ? 'Update reference prompt' : 'Generate character';
  }
  function mount() {
    const tools = $('flow-reference').closest('.flow-tools');
    const area = document.createElement('div'); area.className = 'wf-appearance-upload';
    const heading = document.createElement('h3'); heading.textContent = 'Start from a look you like.';
    const note = document.createElement('p'); note.id = 'wf-appearance-status'; note.setAttribute('role', 'status');
    const label = tools.querySelector('label'); label.firstChild.textContent = 'Character appearance reference ';
    $('flow-reference').setAttribute('aria-describedby', note.id);
    area.append(heading, note, tools); $('character-builder').prepend(area);
    document.addEventListener('titans:reference-change', event => sync(event.detail.present === true));
    // Product edits should update the reference prompt immediately, without a random reroll.
    $('productInstruction').addEventListener('input', () => { if (state.active) window.buildImagePrompt(false); });
    sync(!$('flow-upload').hidden);
  }
  if ($('flow-reference')) mount();
  else document.addEventListener('titans:image-panel-ready', mount, { once: true });
}
