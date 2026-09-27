"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { appUrl, appLinkProps } from "@/lib/site";
import { AnimatePresence, motion } from "motion/react";
import {
  ANDROID_VERSIONS,
  GENRES,
  HOURS,
  LIMITS,
  LISTENS_ON,
  hasDetails,
  toggleChip,
  type Errors,
} from "@/data/beta";
import { betaText, chipLabel, serverError, type BetaCopyKey, type BetaLang } from "@/data/betaCopy";

/** "…goes to {email} when…" with the address in bold. */
function withEmail(text: string, email: string) {
  const [before, after = ""] = text.split("{email}");
  return (
    <>
      {before}
      <strong>{email}</strong>
      {after}
    </>
  );
}

/**
 * The beta signup, in two steps.
 *
 * It used to be eleven fields in four boxes, with the button three screens down
 * on a phone. Play closed testing needs one thing — the Google account on the
 * phone — so step one asks for that (a name if you like) and submitting it IS
 * the signup. Everything else moved to an optional step after they're already
 * on the list, where skipping costs nothing.
 *
 * No native <select> or checkbox: every choice is a chip in the app's style.
 */

type Phase = "signup" | "sending" | "details" | "sending-details" | "done";

const ease = [0.22, 1, 0.36, 1] as const;

async function post(payload: Record<string, unknown>) {
  const res = await fetch("/api/beta", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    errors?: Errors;
    message?: string;
    /** a friend's invite link approved them on the spot */
    approved?: boolean;
  };
  return { ok: res.ok && data.ok === true, data };
}

function Chips({
  label,
  hint,
  options,
  value,
  onChange,
  multi,
  lang = "en",
}: {
  lang?: BetaLang;
  label: string;
  hint?: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  /** max picks; omit for a single choice */
  multi?: number;
}) {
  const id = useId();
  return (
    <div className="bf-field" role={multi ? "group" : "radiogroup"} aria-labelledby={id}>
      <span className="bf-label" id={id}>
        {label}
        {hint && <em>{hint}</em>}
      </span>
      <div className="bf-chips">
        {options.map((o) => {
          const on = value.includes(o);
          const full = multi !== undefined && !on && value.length >= multi;
          return (
            <button
              key={o}
              type="button"
              className={`bf-chip${on ? " on" : ""}`}
              disabled={full}
              {...(multi ? { "aria-pressed": on } : { role: "radio", "aria-checked": on })}
              onClick={() => onChange(multi ? toggleChip(value, o, multi) : on ? [] : [o])}
            >
              {chipLabel(lang, o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BetaForm({ compact = false, lang = "en" }: { compact?: boolean; lang?: BetaLang }) {
  const t = (key: BetaCopyKey, vars?: Record<string, string | number>) => betaText(lang, key, vars);
  const uid = useId();
  const fid = (n: string) => `${uid}-${n}`;
  // stamped on mount and again when step two opens — never during render
  // (Date.now() in a render body is impure). 0 means "no timing info".
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const [phase, setPhase] = useState<Phase>("signup");
  // a friend's invite link (hookedcue.com/beta?ref=CODE) skips the waitlist
  const [ref, setRef] = useState<string | null>(null);
  const [invited, setInvited] = useState(false);
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase() ?? "";
    // read once from the URL after mount; the page itself is statically rendered
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (/^[2-9A-HJ-NP-Z]{7}$/.test(raw)) setRef(raw);
  }, []);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");

  const [device, setDevice] = useState("");
  const [android, setAndroid] = useState<string[]>([]);
  const [hours, setHours] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [listensOn, setListensOn] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  async function signup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phase !== "signup") return;
    const form = new FormData(e.currentTarget);
    setPhase("sending");
    setErrors({});
    setMessage("");
    try {
      const { ok, data } = await post({
        stage: "signup",
        email,
        name,
        consent: true,
        website: form.get("website"),
        startedAt: startedAt.current,
        ...(ref ? { ref } : {}),
      });
      if (ok) {
        startedAt.current = Date.now();
        setInvited(data.approved === true);
        setPhase("details");
        return;
      }
      setPhase("signup");
      setErrors(
        Object.fromEntries(Object.entries(data.errors ?? {}).map(([k, v]) => [k, serverError(lang, v)])),
      );
      setMessage(data.errors ? "" : (data.message ?? t("failed")));
      if (data.errors?.email) emailRef.current?.focus();
    } catch {
      setPhase("signup");
      setMessage(t("offlineSignup"));
    }
  }

  const details = {
    device: device.trim(),
    androidVersion: android[0] ?? "",
    hours: hours[0] ?? "",
    genres,
    listensOn,
    lastSkipped: "",
    notes: notes.trim(),
  };
  const anything = hasDetails(details);

  async function sendDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (phase !== "details" || !anything) return;
    const form = new FormData(e.currentTarget);
    setPhase("sending-details");
    setMessage("");
    try {
      const { ok, data } = await post({
        stage: "details",
        email,
        name,
        ...details,
        website: form.get("website"),
        startedAt: startedAt.current,
      });
      if (ok) {
        setPhase("done");
        return;
      }
      setPhase("details");
      setMessage(data.message ?? t("failed"));
    } catch {
      setPhase("details");
      setMessage(t("offlineDetails"));
    }
  }

  const onList = phase === "details" || phase === "sending-details" || phase === "done";
  useEffect(() => {
    if (onList) doneRef.current?.focus({ preventScroll: true });
  }, [onList]);

  const submit = (
    <>
      {ref && <p className="bf-invited">{t("invited")}</p>}
      <button className="btn-primary bf-submit" type="submit" disabled={phase === "sending"}>
        {phase === "sending" ? t("adding") : ref ? t("joinInvite") : t("putMeOn")}
      </button>
    </>
  );

  return (
    <div className={`bf${compact ? " bf-compact" : ""}`}>
      <AnimatePresence mode="wait" initial={false}>
        {!onList ? (
          <motion.form
            key="signup"
            className="bf-signup"
            onSubmit={signup}
            noValidate
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease }}
          >
            <div className="bf-field">
              <label className="bf-label" htmlFor={fid("email")}>
                {t("emailLabel")}
              </label>
              <div className="bf-row">
                <input
                  ref={emailRef}
                  id={fid("email")}
                  className="bf-input"
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@gmail.com"
                  maxLength={LIMITS.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? fid("email-err") : fid("email-hint")}
                  required
                />
                {compact && submit}
              </div>
              {errors.email ? (
                <span className="bf-err" id={fid("email-err")}>
                  {errors.email}
                </span>
              ) : (
                <span className="bf-hint" id={fid("email-hint")}>
                  {t("emailHint")}
                </span>
              )}
            </div>

            {!compact && (
              <div className="bf-field">
                <label className="bf-label" htmlFor={fid("name")}>
                  {t("nameLabel")} <em>{t("optional")}</em>
                </label>
                <input
                  id={fid("name")}
                  className="bf-input"
                  type="text"
                  name="name"
                  autoComplete="given-name"
                  maxLength={LIMITS.name}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? fid("name-err") : undefined}
                />
                {errors.name && (
                  <span className="bf-err" id={fid("name-err")}>
                    {errors.name}
                  </span>
                )}
              </div>
            )}

            {/* honeypot — hidden from people, irresistible to scripts */}
            <div className="hp" aria-hidden="true">
              <label htmlFor={fid("website")}>website</label>
              <input id={fid("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            {!compact && submit}
            <p className="bf-consent">
              {t("consentLead")} <Link href="/privacy">{t("privacy")}</Link>.
            </p>
            {message && (
              <p className="bf-message" role="alert">
                {message}
              </p>
            )}
          </motion.form>
        ) : (
          <motion.div
            key="on-list"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="bf-done" ref={doneRef} tabIndex={-1} role="status">
              <i aria-hidden="true" />
              <div>
                {invited ? (
                  <>
                    <b>{t("inFriend")}</b>
                    <span>{withEmail(t("inFriendSub"), email.trim().toLowerCase())}</span>
                  </>
                ) : (
                  <>
                    <b>{t("onList")}</b>
                    <span>{withEmail(t("onListSub"), email.trim().toLowerCase())}</span>
                  </>
                )}
              </div>
            </div>

            {phase === "done" ? (
              <p className="bf-thanks">
                {t("thanksLead")}{" "}
                <a href={appUrl} {...appLinkProps}>
                  {t("browserBuild")}
                </a>{" "}
                {t("thanksTail")}
              </p>
            ) : (
              <form className="bf-details" onSubmit={sendDetails} noValidate>
                <div className="bf-details-head">
                  <b>{t("tuneHead")}</b>
                  <span>{t("tuneSub")}</span>
                </div>

                <div className="bf-field">
                  <label className="bf-label" htmlFor={fid("device")}>
                    {t("phone")}
                  </label>
                  <input
                    id={fid("device")}
                    className="bf-input"
                    type="text"
                    name="device"
                    placeholder={t("phonePlaceholder")}
                    maxLength={LIMITS.device}
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                  />
                </div>
                <Chips lang={lang} label={t("androidVersion")} options={ANDROID_VERSIONS} value={android} onChange={setAndroid} />
                <Chips
                  lang={lang}
                  label={t("genres")}
                  hint={t("genresCount", { n: genres.length, max: LIMITS.genres })}
                  options={GENRES}
                  value={genres}
                  onChange={setGenres}
                  multi={LIMITS.genres}
                />
                <Chips
                  lang={lang}
                  label={t("listensOn")}
                  options={LISTENS_ON}
                  value={listensOn}
                  onChange={setListensOn}
                  multi={LIMITS.listensOn}
                />
                <Chips lang={lang} label={t("hours")} options={HOURS} value={hours} onChange={setHours} />
                <div className="bf-field">
                  <label className="bf-label" htmlFor={fid("notes")}>
                    {t("notes")} <em>{t("notesHint")}</em>
                  </label>
                  <textarea
                    id={fid("notes")}
                    className="bf-input"
                    name="notes"
                    rows={3}
                    maxLength={LIMITS.notes}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="hp" aria-hidden="true">
                  <label htmlFor={fid("website2")}>website</label>
                  <input id={fid("website2")} name="website" type="text" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="bf-actions">
                  <button
                    className="btn-primary bf-submit"
                    type="submit"
                    disabled={!anything || phase === "sending-details"}
                  >
                    {phase === "sending-details" ? t("sending") : t("sendThese")}
                  </button>
                  <button type="button" className="bf-skip" onClick={() => setPhase("done")}>
                    {t("skipDone")}
                  </button>
                </div>
                {message && (
                  <p className="bf-message" role="alert">
                    {message}
                  </p>
                )}
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
