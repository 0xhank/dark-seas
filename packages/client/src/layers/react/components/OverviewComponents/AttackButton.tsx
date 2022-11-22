import { EntityID } from "@latticexyz/recs";
import { Side } from "../../../../constants";

export default function AttackButton({
  attack,
  shipEntity,
}: {
  attack: (shipId: EntityID, side: Side) => void;
  shipEntity: EntityID;
}) {
  return (
    <div style={{ width: "100%", background: "brown", pointerEvents: "all" }}>
      <span>Attack with {shipEntity}</span>
      <div style={{ display: "flex" }}>
        <button
          style={{
            textAlign: "center",
            padding: "5px",
            cursor: "pointer",
          }}
          disabled={!shipEntity}
          onClick={() => {
            if (!shipEntity) return;
            attack(shipEntity, Side.Left);
          }}
        >
          LEFT
        </button>
        <button
          style={{
            textAlign: "center",
            padding: "5px",
            cursor: "pointer",
          }}
          disabled={!shipEntity}
          onClick={() => {
            if (!shipEntity) return;
            attack(shipEntity, Side.Right);
          }}
        >
          RIGHT
        </button>
      </div>
    </div>
  );
}
