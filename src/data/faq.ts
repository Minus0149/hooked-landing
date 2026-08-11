// one source of truth: the visible FAQ and the FAQPage structured data are
// generated from this array. google wants the markup to match what's on the
// page, and the two had drifted apart into different questions entirely.

export const FAQS = [
  {
    q: "what is hooked.?",
    a: "a swipe app for finding songs. it plays the strongest 30 seconds first, and your swipes decide what turns up next.",
  },
  {
    q: "how is it different from spotify radio?",
    a: "radio replays what you already like. here every swipe moves the deck, skips included — those tell us as much as the saves do.",
  },
  {
    q: "where do the previews come from?",
    a: "public preview clips, mostly itunes. tap through to apple music, spotify or youtube when you want the whole song.",
  },
  {
    q: "can i save songs and playlists?",
    a: "swipe down and pick where it goes. the playlists end up full of things you actually found, rather than things you already knew.",
  },
  {
    q: "when is it on the play store?",
    a: "closed testing first. join the beta below and you get the invite when the track opens — ios is further out.",
  },
] as const;
