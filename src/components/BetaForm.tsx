"use client";
import { useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ANDROID_VERSIONS,
  GENRES,
  HOURS,
  LIMITS,
  LISTENS_ON,
} from "@/data/beta";

type Errors = Record<string, string>;
type Status = "idle" | "sending" | "done";

export default function BetaForm() {
  const uid = useId();
  // stamped on mount, not during render — Date.now() in a render body is impure.
  // 0 means "no timing info", which the api treats as fail-open.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [listensOn, setListensOn] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);

  const fid = (n: string) => `${uid}-${n}`;
  const errId = (n: string) => `${uid}-${n}-err`;
  const describe = (n: string) => (errors[n] ? { "aria-describedby": errId(n) } : {});
  const invalid = (n: string) => (errors[n] ? { "aria-invalid": true as const } : {});

  function toggle(list: string[], set: (v: string[]) => void, value: string, max: number) {
    if (list.includes(value)) set(list.filter((v) => v !== value));
    else if (list.length < max) set([...list, value]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrors({});
    setMessage("");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      device: form.get("device"),
      androidVersion: form.get("androidVersion"),
      hours: form.get("hours"),
      lastSkipped: form.get("lastSkipped"),
      notes: form.get("notes"),
      consent: form.get("consent") === "on",
      website: form.get("website"),
      listensOn,
      genres,
      startedAt: startedAt.current,
    };

    try {
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

      if (res.ok && data.ok) {
        setStatus("done");
        return;
      }
      setStatus("idle");
      setErrors(data.errors ?? {});
      setMessage(data.message ?? "that didn't go through. try again?");
    } catch {
      setStatus("idle");
      setMessage("no connection. the form will still be here.");
    }
  }

  if (status === "done") {
    return (
      <motion.div
        className="beta-done"
        role="status"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <i />
        <h3>you&apos;re on the list.</h3>
        <p>
          the invite goes to that address when the closed test opens. it comes from
          the play store, not from me, so keep an eye on the promotions tab.
        </p>
      </motion.div>
    );
  }

  return (
    <form className="beta-form" onSubmit={onSubmit} noValidate>
      <div className="beta-row">
        <div className="field">
          <label htmlFor={fid("name")}>your name</label>
          <input
            id={fid("name")}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={LIMITS.name}
            required
            {...invalid("name")}
            {...describe("name")}
          />
          {errors.name && <span className="field-err" id={errId("name")}>{errors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor={fid("email")}>
            email <em>the google account on your phone</em>
          </label>
          <input
            id={fid("email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={LIMITS.email}
            required
            {...invalid("email")}
            {...describe("email")}
          />
          {errors.email && <span className="field-err" id={errId("email")}>{errors.email}</span>}
        </div>
      </div>

      <div className="beta-row">
        <div className="field">
          <label htmlFor={fid("device")}>
            phone <em>make and model</em>
          </label>
          <input
            id={fid("device")}
            name="device"
            type="text"
            placeholder="pixel 8a, redmi note 13, ..."
            maxLength={LIMITS.device}
            required
            {...invalid("device")}
            {...describe("device")}
          />
          {errors.device && <span className="field-err" id={errId("device")}>{errors.device}</span>}
        </div>

        <div className="field">
          <label htmlFor={fid("android")}>android version</label>
          <select id={fid("android")} name="androidVersion" defaultValue="">
            <option value="">pick one</option>
            {ANDROID_VERSIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="field">
        <legend>what you listen on now</legend>
        <div className="pills">
          {LISTENS_ON.map((opt) => (
            <button
              type="button"
              key={opt}
              className={listensOn.includes(opt) ? "pill on" : "pill"}
              aria-pressed={listensOn.includes(opt)}
              onClick={() => toggle(listensOn, setListensOn, opt, LIMITS.listensOn)}
            >
              {opt}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend>
          genres you actually play <em>up to {LIMITS.genres}</em>
        </legend>
        <div className="pills">
          {GENRES.map((opt) => {
            const on = genres.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                className={on ? "pill on" : "pill"}
                aria-pressed={on}
                disabled={!on && genres.length >= LIMITS.genres}
                onClick={() => toggle(genres, setGenres, opt, LIMITS.genres)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="beta-row">
        <div className="field">
          <label htmlFor={fid("hours")}>music on a normal day</label>
          <select id={fid("hours")} name="hours" defaultValue="">
            <option value="">pick one</option>
            {HOURS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <div className="field">
          {/* the hint lives in the placeholder: as an <em> it wrapped to a
              second line and knocked this column out of line with the other */}
          <label htmlFor={fid("skip")}>last song you skipped</label>
          <input
            id={fid("skip")}
            name="lastSkipped"
            type="text"
            placeholder="the one with the long intro"
            maxLength={LIMITS.lastSkipped}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={fid("notes")}>
          anything else <em>bugs you expect to find, features you want, complaints</em>
        </label>
        <textarea id={fid("notes")} name="notes" rows={3} maxLength={LIMITS.notes} />
      </div>

      {/* honeypot — never shown, never announced, only bots fill it */}
      <div className="hp" aria-hidden="true">
        <label htmlFor={fid("website")}>website</label>
        <input id={fid("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={errors.consent ? "consent has-err" : "consent"}>
        <input
          id={fid("consent")}
          name="consent"
          type="checkbox"
          {...invalid("consent")}
          {...describe("consent")}
        />
        <label htmlFor={fid("consent")}>
          email me the test invite and the odd update. nothing else, no passing it on.
        </label>
      </div>
      {errors.consent && <span className="field-err" id={errId("consent")}>{errors.consent}</span>}

      <div className="beta-submit">
        <button type="submit" className="btn-primary" disabled={status === "sending"}>
          {status === "sending" ? "sending..." : "put me in the beta"}
        </button>
        <p className="beta-live" role="status" aria-live="polite">
          {message}
        </p>
      </div>
    </form>
  );
}
