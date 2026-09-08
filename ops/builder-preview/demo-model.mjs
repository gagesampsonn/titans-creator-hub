// UI-only simulation. Never import this as a production credit ledger.
export const PACKS = Object.freeze([[5,10],[10,25],[15,40],[20,60],[25,80],[30,100]].map(([price,credits]) => Object.freeze({id:`pack-${price}`,price,credits})));
export function createDemoSession() {
  let credits = 15, busy = false, original = null, selfie = null, sequence = 0;
  return {
    snapshot: () => ({ credits, busy, original, selfie }),
    async generate(kind, prompt, loadImage) {
      if (busy) throw Error('busy');
      if (credits < 1) throw Error('credits');
      if (!['original','selfie'].includes(kind)) throw Error('kind');
      if (kind === 'selfie' && !original) throw Error('original');
      if (kind === 'original' && (typeof prompt !== 'string' || prompt.trim().length < 10 || prompt.length > 4000)) throw Error('prompt');
      busy = true;
      try {
        await loadImage(kind);
        const image = Object.freeze({ id: ++sequence, kind, url:`/__demo/image/${kind}`, sourceId:kind === 'selfie' ? original.id : null });
        if (kind === 'original') { original = image; selfie = null; } else selfie = image;
        credits--;
        return image;
      } finally { busy = false; }
    },
    addPack(id) {
      const pack = PACKS.find(item => item.id === id);
      if (!pack) throw Error('pack');
      credits += pack.credits;
    }
  };
}
