type Props = {
  title: string;
  body: string;
};

export function SectionCard({ title, body }: Props) {
  return (
    <section
      style={{
        border: "1px solid #e9d7e2",
        borderRadius: 20,
        padding: 16,
        background: "#fff",
        boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h3>
      <p style={{ margin: "10px 0 0", lineHeight: 1.6, opacity: 0.9 }}>{body}</p>
    </section>
  );
}
