import type { PassportCardData } from "./passportCard";

export function PassportCardImage(data: PassportCardData) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "64px",
        backgroundColor: "#403b37",
        color: "#e8e0d8",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#ff0f83" }}>
          Roast Dinners In London
        </span>
        <span style={{ fontSize: 56, fontWeight: 700, marginTop: 12 }}>My Roast Dinner Passport</span>
      </div>

      <div style={{ display: "flex", marginTop: 56, gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 72, fontWeight: 700 }}>{data.visits}</span>
          <span style={{ fontSize: 24, color: "#c9beb3" }}>Restaurants Visited</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 72, fontWeight: 700 }}>{data.zones}</span>
          <span style={{ fontSize: 24, color: "#c9beb3" }}>Fare Zones Covered</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 72, fontWeight: 700 }}>
            {data.badgesEarned}/{data.totalBadges}
          </span>
          <span style={{ fontSize: 24, color: "#c9beb3" }}>Badges Earned</span>
        </div>
      </div>

      {data.favouriteMeat && (
        <div style={{ display: "flex", marginTop: 40 }}>
          <span style={{ fontSize: 28, color: "#c9beb3" }}>Favourite Meat: {data.favouriteMeat}</span>
        </div>
      )}

      <div style={{ display: "flex", marginTop: "auto", fontSize: 24, color: "#c9beb3" }}>
        rdldn.co.uk/my-passport
      </div>
    </div>
  );
}
