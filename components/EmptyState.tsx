export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section style={{ border: "1px dashed #d7a8bf", borderRadius: 20, padding: 18, background: "#fff" }}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p style={{ margin: "10px 0 0", opacity: 0.8, lineHeight: 1.6 }}>{body}</p>
    </section>
  );
}
