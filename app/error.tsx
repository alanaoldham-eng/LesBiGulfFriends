"use client";

export default function Error({
  error,
}: {
  error: Error;
}) {
  return (
    <div style={{ padding: 40 }}>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
    </div>
  );
}