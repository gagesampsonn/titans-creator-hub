// Local presentation only. Existing tool nodes and their state stay intact.
export const stages = [
  { id: 'motion', name: 'Motion', title: 'Start with the movement.', subtitle: 'Record your own clip or download a reference you have permission to use.',
    sections: ['motion-reference'], targets: ['tiktokDownloader', 'instagramDownloader'],
    steps: ['Choose the framing, movement and timing you want in the final video.', 'Trim to the part you want to recreate. A clean 1080p export is a practical starting point.', 'Save the motion clip. Choose your character’s appearance separately in the next step.'],
    output: 'A trimmed motion video, ready to become @Video1.' },
  { id: 'character', name: 'Character', title: 'Build the person in your video.', subtitle: 'Choose their look, create a portrait, then add an optional close-up for more facial detail.',
    sections: ['character-builder', 'character-examples'], targets: ['titans-image-flow', 'imagePromptOutput'],
    steps: ['Upload a photo of the look you want, or create a character with the controls. The photo is an appearance reference, not the person from your motion video.', 'With a reference photo, generate an ankles-up portrait facing the camera. Your photo supplies the appearance instead of random traits.', 'Create a selfie from the original if you want a second angle. Download both originals.'],
    output: 'Main portrait @Image1 · Optional close-up @Image2. Each new photo uses one image credit.' },
  { id: 'setup', name: 'Video setup', title: 'Put your references together.', subtitle: 'Your video supplies the motion. Your photos supply the identity.',
    sections: ['higgsfield-setup'], targets: [],
    steps: ['Open Higgsfield and choose its reference-video editing workflow.', 'Upload the motion clip as @Video1, then your character photos in order.', 'Check the model’s supported settings and credit cost before you generate.'],
    output: 'References loaded in Higgsfield. Video generation uses its separate plan and credits.' },
  { id: 'prompt', name: 'Video prompt', title: 'Tell the video what to change.', subtitle: 'Use your references to replace the person without rebuilding the whole scene.',
    sections: ['prompt', 'references'], targets: ['referenceImageCount', 'promptResult'],
    steps: ['Choose what you want to replace and how many character photos you will upload.', 'Build your prompt. Keep the reference order the same as your Higgsfield uploads.', 'Copy it into Higgsfield, review the settings, and generate your video there.'],
    output: 'A finished replacement prompt with the right @Video1 and @Image references.' },
  { id: 'finish', name: 'Finish', title: 'Review it. Make it yours.', subtitle: 'Check the details, then finish the edit in your usual video editor.',
    sections: ['generate-review', 'case-studies', 'publish'], targets: [],
    steps: ['Check the face, hands, product and clothing throughout the generated shot.', 'Bring it into CapCut or your editor. Trim, match the lighting and add your sound or captions.', 'Export only when the result holds up. Use permitted material and any required AI or affiliate disclosures.'],
    output: 'A reviewed, edited video ready for your final publishing checks.' },
];
export function stageForTarget(id) {
  if (id === 'start' || id === 'top') return 'motion';
  return stages.find(stage => stage.id === id || stage.sections.includes(id) || stage.targets.includes(id))?.id ?? null;
}
