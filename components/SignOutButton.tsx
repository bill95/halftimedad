"use client";

import { useState } from "react";

/**
 * A form post, not a link.
 *
 * Next prefetches links, and this one pointed at a route handler that ends
 * the session. Hovering near the header should not sign a man out.
 */
export default function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <form
      action="/auth/sign-out"
      method="post"
      onSubmit={() => setBusy(true)}
      style={{ display: "inline" }}
    >
      <button type="submit" className="member-header-signout" disabled={busy}>
        {busy ? "Signing out" : "Sign out"}
      </button>
    </form>
  );
}
