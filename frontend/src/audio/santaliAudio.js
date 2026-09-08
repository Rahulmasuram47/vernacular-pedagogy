/**
 * Offline Santali Audio Playback Helper.
 * Plays authentic pre-recorded audio clips for core classroom phrases and numbers.
 * Provides transparent feedback when open-ended sentences lack pre-recorded audio.
 */

const SANTALI_AUDIO_MAP = {
  // Greetings & Polite
  "ᱡᱚᱦᱟᱨ": "/audio/santali/johar.wav",
  "ᱥᱟᱨᱦᱟᱣ": "/audio/santali/sarhaw.wav",

  // Classroom commands (Singular)
  "ᱫᱩᱲᱩᱵ ᱢᱮ": "/audio/santali/durup_me.wav",
  "ᱛᱤᱸᱜᱩ ᱢᱮ": "/audio/santali/tingu_me.wav",
  "ᱯᱚᱛᱚᱵ ᱡᱷᱤᱡ ᱢᱮ": "/audio/santali/potob_jhij_me.wav",
  "ᱯᱚᱛᱚᱵ ᱵᱚᱸᱫᱽ ᱢᱮ": "/audio/santali/potob_bond_me.wav",
  "ᱟᱸᱡᱚᱢ ᱢᱮ": "/audio/santali/anjom_me.wav",
  "ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱟᱸᱡᱚᱢ ᱢᱮ": "/audio/santali/dheyan_te_anjom_me.wav",
  "ᱪᱩᱯ ᱛᱟᱦᱮᱸᱱ ᱢᱮ": "/audio/santali/chup_tahen_me.wav",
  "ᱱᱚᱰᱮ ᱦᱮᱡ ᱢᱮ": "/audio/santali/node_hej_me.wav",
  "ᱚᱸᱰᱮ ᱪᱟᱞᱟᱣ ᱢᱮ": "/audio/santali/onde_chalaw_me.wav",
  "ᱯᱟᱲᱦᱟᱣ ᱢᱮ": "/audio/santali/padhaw_me.wav",
  "ᱚᱞ ᱢᱮ": "/audio/santali/ol_me.wav",
  "ᱨᱚᱲ ᱢᱮ": "/audio/santali/ror_me.wav",
  "ᱛᱮᱞᱟ ᱮᱢ ᱢᱮ": "/audio/santali/tela_em_me.wav",
  "ᱵᱳᱨᱰ ᱨᱮ ᱧᱮᱞ ᱢᱮ": "/audio/santali/board_re_nel_me.wav",
  "ᱞᱮᱠᱷᱟᱭ ᱢᱮ": "/audio/santali/lekhay_me.wav",

  // Classroom commands (Plural)
  "ᱡᱚᱛᱚ ᱦᱚᱲ ᱫᱩᱲᱩᱵ ᱯᱮ": "/audio/santali/joto_hor_durup_pe.wav",
  "ᱡᱚᱛᱚ ᱫᱩᱲᱩᱵ ᱯᱮ": "/audio/santali/joto_hor_durup_pe.wav",
  "ᱡᱚᱛᱚ ᱜᱤᱫᱽᱨᱟᱹᱠᱚ ᱫᱩᱲᱩᱵ ᱯᱮ": "/audio/santali/joto_hor_durup_pe.wav",
  "ᱡᱚᱛᱚ ᱦᱚᱲ ᱛᱤᱸᱜᱩ ᱯᱮ": "/audio/santali/joto_hor_tingu_pe.wav",
  "ᱡᱚᱛᱚ ᱛᱤᱸᱜᱩ ᱯᱮ": "/audio/santali/joto_hor_tingu_pe.wav",
  "ᱡᱚᱛᱚ ᱜᱤᱫᱽᱨᱟᱹᱠᱚ ᱛᱤᱸᱜᱩ ᱯᱮ": "/audio/santali/joto_hor_tingu_pe.wav",
  "ᱡᱚᱛᱚ ᱦᱚᱲ ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱟᱸᱡᱚᱢ ᱯᱮ": "/audio/santali/dheyan_te_anjom_me.wav",
  "ᱡᱚᱛᱚ ᱜᱤᱫᱽᱨᱟᱹᱠᱚ ᱫᱷᱮᱭᱟᱱ ᱛᱮ ᱟᱸᱡᱚᱢ ᱯᱮ": "/audio/santali/dheyan_te_anjom_me.wav",
  "ᱡᱚᱛᱚ ᱪᱩᱯ ᱛᱟᱦᱮᱸᱱ ᱯᱮ": "/audio/santali/chup_tahen_me.wav",

  // Numbers 1 - 10
  "ᱢᱤᱫ": "/audio/santali/num_1.wav",
  "ᱵᱟᱨ": "/audio/santali/num_2.wav",
  "ᱯᱮ": "/audio/santali/num_3.wav",
  "ᱯᱩᱱ": "/audio/santali/num_4.wav",
  "ᱢᱚᱬᱮ": "/audio/santali/num_5.wav",
  "ᱛᱩᱨᱩᱭ": "/audio/santali/num_6.wav",
  "ᱮᱭᱟᱭ": "/audio/santali/num_7.wav",
  "ᱤᱨᱟᱹᱞ": "/audio/santali/num_8.wav",
  "ᱟᱨᱮ": "/audio/santali/num_9.wav",
  "ᱜᱮᱞ": "/audio/santali/num_10.wav",
};

let currentAudio = null;

/**
 * Checks if a pre-recorded audio clip is bundled for the given Santali text.
 *
 * @param {string} santaliText
 * @returns {boolean}
 */
export function hasSantaliAudio(santaliText) {
  if (!santaliText) return false;
  const normalized = santaliText.trim();
  return Boolean(SANTALI_AUDIO_MAP[normalized]);
}

/**
 * Plays the Santali audio clip if available.
 *
 * @param {string} santaliText
 * @param {() => void} [onStart]
 * @param {() => void} [onEnd]
 * @returns {Promise<{ played: boolean, error?: string }>}
 */
export async function playSantaliAudio(santaliText, onStart, onEnd) {
  if (!santaliText) {
    onEnd?.();
    return { played: false };
  }

  const normalized = santaliText.trim();
  const audioSrc = SANTALI_AUDIO_MAP[normalized];

  if (!audioSrc) {
    onEnd?.();
    return { played: false, error: "CLIP_UNAVAILABLE" };
  }

  // Stop any currently playing audio
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }

  return new Promise((resolve) => {
    try {
      const audio = new Audio(audioSrc);
      currentAudio = audio;

      audio.onplay = () => {
        onStart?.();
      };

      audio.onended = () => {
        currentAudio = null;
        onEnd?.();
        resolve({ played: true });
      };

      audio.onerror = (e) => {
        console.warn("[SantaliAudio] Playback error:", e);
        currentAudio = null;
        onEnd?.();
        resolve({ played: false, error: "PLAYBACK_FAILED" });
      };

      audio.play().catch((err) => {
        console.warn("[SantaliAudio] play() rejected:", err);
        currentAudio = null;
        onEnd?.();
        resolve({ played: false, error: err?.message || "AUTOPLAY_RESTRICTED" });
      });
    } catch (err) {
      console.error("[SantaliAudio] Failed to initialize Audio:", err);
      onEnd?.();
      resolve({ played: false, error: err?.message });
    }
  });
}
