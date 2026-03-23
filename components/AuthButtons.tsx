"use client";

import { signInWithGoogle, signInWithFacebook, signInWithTwitter } from "../lib/auth";

export function AuthButtons() {
  return (
    <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
      <button className="button secondary" onClick={() => signInWithGoogle()}>Continue with Google</button>
      <button className="button secondary" onClick={() => signInWithFacebook()}>Continue with Facebook</button>
      <button className="button secondary" onClick={() => signInWithTwitter()}>Continue with X</button>
    </div>
  );
}
