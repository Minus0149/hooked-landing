/**
 * The beta form's words in English and Hindi.
 *
 * The English is the source (the same lowercase voice as the rest of the
 * site). Hindi is conversational, not textbook: HookedCue, android, play
 * store, google, email and the genre names stay as people say them.
 *
 * Chip values are never translated — the API validates the English values —
 * only what the chip shows. Server error messages arrive in English and are
 * mapped through SERVER_ERRORS_HI.
 */
export type BetaLang = "en" | "hi";

export const BETA_COPY = {
  en: {
    invited: "a friend invited you — you'll skip the waitlist.",
    adding: "adding you…",
    joinInvite: "join with my invite",
    putMeOn: "put me on the list",
    emailLabel: "your google account email",
    emailHint: "the one signed in on your android phone — it's how the play store invite finds you.",
    nameLabel: "what should we call you?",
    optional: "optional",
    consentLead: "we'll email you the invite and the odd update. nothing else, never passed on —",
    privacy: "privacy",
    failed: "that didn't go through. try again?",
    offlineSignup: "no connection. your address is still in the box.",
    offlineDetails: "no connection. your answers are still here.",
    inFriend: "you're in — a friend's invite skipped the queue.",
    inFriendSub: "your invite is on its way to {email}. open it to make your account.",
    onList: "you're on the list.",
    onListSub: "the invite goes to {email} when the android test opens.",
    thanksLead: "that's everything. see you in the play store — and in the meantime, the",
    browserBuild: "browser build",
    thanksTail: "is the whole app.",
    tuneHead: "help us tune it",
    tuneSub: "optional · about a minute · skip it and you're still in",
    phone: "your phone",
    phonePlaceholder: "pixel 8a, redmi note 13…",
    androidVersion: "android version",
    genres: "genres you actually play",
    genresCount: "{n} of {max}",
    listensOn: "where you listen now",
    hours: "music on a normal day",
    notes: "anything else",
    notesHint: "bugs you expect, features you want",
    sending: "sending…",
    sendThese: "send these",
    skipDone: "skip — i'm done",
  },
  hi: {
    invited: "आपको एक दोस्त ने invite किया है — आपको waitlist में इंतज़ार नहीं करना पड़ेगा।",
    adding: "जोड़ रहे हैं…",
    joinInvite: "मेरे invite से जुड़ें",
    putMeOn: "मुझे लिस्ट में जोड़ें",
    emailLabel: "आपका google account email",
    emailHint: "वही जो आपके android फ़ोन पर signed in है — play store का invite इसी पर आता है।",
    nameLabel: "आपको क्या बुलाएँ?",
    optional: "ज़रूरी नहीं",
    consentLead: "हम आपको invite और कभी-कभार कोई अपडेट भेजेंगे। इसके अलावा कुछ नहीं, और किसी को नहीं देंगे —",
    privacy: "प्राइवेसी",
    failed: "ये नहीं हो पाया। फिर से कोशिश करें?",
    offlineSignup: "इंटरनेट नहीं है। आपका email बॉक्स में ही है।",
    offlineDetails: "इंटरनेट नहीं है। आपके जवाब यहीं हैं।",
    inFriend: "आप अंदर हैं — दोस्त के invite से लाइन छोड़ दी।",
    inFriendSub: "आपका invite {email} पर आ रहा है। उसे खोलकर अपना अकाउंट बनाइए।",
    onList: "आप लिस्ट में हैं।",
    onListSub: "android test शुरू होते ही invite {email} पर आएगा।",
    thanksLead: "बस इतना ही। play store में मिलते हैं — तब तक",
    browserBuild: "browser वाला version",
    thanksTail: "पूरा ऐप ही है।",
    tuneHead: "इसे बेहतर बनाने में मदद करें",
    tuneSub: "ज़रूरी नहीं · करीब एक मिनट · छोड़ भी दें तो आप लिस्ट में हैं",
    phone: "आपका फ़ोन",
    phonePlaceholder: "pixel 8a, redmi note 13…",
    androidVersion: "android version",
    genres: "जो genre आप सच में सुनते हैं",
    genresCount: "{max} में से {n}",
    listensOn: "अभी गाने कहाँ सुनते हैं",
    hours: "आम दिन में कितना संगीत",
    notes: "कुछ और",
    notesHint: "कौन-से bugs लगते हैं, कौन-से features चाहिए",
    sending: "भेज रहे हैं…",
    sendThese: "ये भेजें",
    skipDone: "छोड़ें — हो गया",
  },
} as const satisfies Record<BetaLang, Record<string, string>>;

export type BetaCopyKey = keyof (typeof BETA_COPY)["en"];

/** What a chip shows; the value sent stays English. */
export const CHIP_LABELS_HI: Record<string, string> = {
  "something else": "कुछ और",
  "android 12 or older": "android 12 या पुराना",
  "not sure": "पता नहीं",
  "under an hour": "एक घंटे से कम",
  "1 to 3 hours": "1 से 3 घंटे",
  "3 to 5 hours": "3 से 5 घंटे",
  "basically always": "लगभग हर वक़्त",
};

/** The route's validation messages (data/beta.ts), in Hindi. */
export const SERVER_ERRORS_HI: Record<string, string> = {
  "an email, please — that's how the invite arrives": "email डालें — invite उसी पर आता है",
  "that address doesn't look right": "ये email सही नहीं लग रहा",
  "a little more than one letter?": "एक अक्षर से थोड़ा ज़्यादा?",
  "nothing to send yet — pick something, or skip it": "अभी भेजने को कुछ नहीं — कुछ चुनें, या छोड़ दें",
};

export function betaText(lang: BetaLang, key: BetaCopyKey, vars?: Record<string, string | number>): string {
  let s: string = BETA_COPY[lang][key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export function chipLabel(lang: BetaLang, value: string): string {
  return lang === "hi" ? (CHIP_LABELS_HI[value] ?? value) : value;
}

export function serverError(lang: BetaLang, message: string): string {
  return lang === "hi" ? (SERVER_ERRORS_HI[message] ?? message) : message;
}
