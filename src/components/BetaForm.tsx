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
}: {
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
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BetaForm({ compact = false }: { compact?: boolean }) {
  const uid = useId();
  const fid = (n: string) => `${uid}-${n}`;
  // stamped on mount and again when step two opens — never during render
  // (Date.now() in a render body is impure). 0 means "no timing info".
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const [phase, setPhase] = useState<Phase>("signup");

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
      });
      if (ok) {
        startedAt.current = Date.now();
        setPhase("details");
        return;
      }
      setPhase("signup");
      setErrors(data.errors ?? {});
      setMessage(data.errors ? "" : (data.message ?? "that didn't go through. try again?"));
      if (data.errors?.email) emailRef.current?.focus();
    } catch {
      setPhase("signup");
      setMessage("no connection. your address is still in the box.");
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
      setMessage(data.message ?? "that didn't go through. try again?");
    } catch {
      setPhase("details");
      setMessage("no connection. your answers are still here.");
    }
  }

  const onList = phase === "details" || phase === "sending-details" || phase === "done";
  useEffect(() => {
    if (onList) doneRef.current?.focus({ preventScroll: true });
  }, [onList]);

  const submit = (
    <button className="btn-primary bf-submit" type="submit" disabled={phase === "sending"}>
      {phase === "sending" ? "adding you…" : "put me on the list"}
    </button>
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
                your google account email
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
                  the one signed in on your android phone — it&apos;s how the play store invite finds you.
                </span>
              )}
            </div>

            {!compact && (
              <div className="bf-field">
                <label className="bf-label" htmlFor={fid("name")}>
                  what should we call you? <em>optional</em>
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
              we&apos;ll email you the invite and the odd update. nothing else, never passed on —{" "}
              <Link href="/privacy">privacy</Link>.
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
                <b>you&apos;re on the list.</b>
                <span>
                  the invite goes to <strong>{email.trim().toLowerCase()}</strong> when the android test opens.
                </span>
              </div>
            </div>

            {phase === "done" ? (
              <p className="bf-thanks">
                that&apos;s everything. see you in the play store — and in the meantime, the{" "}
                <a href={appUrl} {...appLinkProps}>
                  browser build
                </a>{" "}
                is the whole app.
              </p>
            ) : (
              <form className="bf-details" onSubmit={sendDetails} noValidate>
                <div className="bf-details-head">
                  <b>help us tune it</b>
                  <span>optional · about a minute · skip it and you&apos;re still in</span>
                </div>

                <div className="bf-field">
                  <label className="bf-label" htmlFor={fid("device")}>
                    your phone
                  </label>
                  <input
                    id={fid("device")}
                    className="bf-input"
                    type="text"
                    name="device"
                    placeholder="pixel 8a, redmi note 13…"
                    maxLength={LIMITS.device}
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                  />
                </div>
                <Chips label="android version" options={ANDROID_VERSIONS} value={android} onChange={setAndroid} />
                <Chips
                  label="genres you actually play"
                  hint={`${genres.length} of ${LIMITS.genres}`}
                  options={GENRES}
                  value={genres}
                  onChange={setGenres}
                  multi={LIMITS.genres}
                />
                <Chips
                  label="where you listen now"
                  options={LISTENS_ON}
                  value={listensOn}
                  onChange={setListensOn}
                  multi={LIMITS.listensOn}
                />
                <Chips label="music on a normal day" options={HOURS} value={hours} onChange={setHours} />
                <div className="bf-field">
                  <label className="bf-label" htmlFor={fid("notes")}>
                    anything else <em>bugs you expect, features you want</em>
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
                    {phase === "sending-details" ? "sending…" : "send these"}
                  </button>
                  <button type="button" className="bf-skip" onClick={() => setPhase("done")}>
                    skip — i&apos;m done
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
