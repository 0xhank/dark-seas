import { EntityID } from "@latticexyz/recs";
import { Side } from "../../../../constants";
import { Button } from "../../styles/global";

export default function AttackButton({
  attack,
  shipEntity,
}: {
  attack: (shipId: EntityID, side: Side) => void;
  shipEntity: EntityID;
}) {
  return (
    <div style={{ width: "100%", display: "flex", gap: "5px", justifyContent: "center", pointerEvents: "all" }}>
      <Button
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
        ATTACK LEFT
      </Button>
      <Button
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
        ATTACK RIGHT
      </Button>
    </div>
  );
}
