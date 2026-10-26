export default function Loading() {
  return (
    <>
      <div className="route-progress" aria-hidden />
      <div className="container section" aria-busy="true" aria-label="กำลังโหลด">
        <div className="skeleton" style={{ height: 38, width: "40%", marginBottom: 24 }} />
        <div className="grid cols-3">
          <div className="skeleton" style={{ height: 150 }} />
          <div className="skeleton" style={{ height: 150 }} />
          <div className="skeleton" style={{ height: 150 }} />
        </div>
        <div className="skeleton" style={{ height: 220, marginTop: 22 }} />
      </div>
    </>
  );
}
