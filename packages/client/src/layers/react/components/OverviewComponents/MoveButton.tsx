import { EntityID } from "@latticexyz/recs";

export default function MoveButton({
  move,
  shipEntity,
  moveEntity,
}: {
  move: (shipId: EntityID, moveId: EntityID) => void;
  shipEntity: EntityID;
  moveEntity: EntityID | undefined;
}) {
  return (
    <button
      style={{
        width: "100%",
        textAlign: "center",
        padding: "5px",
        cursor: "pointer",
      }}
      disabled={!shipEntity || !moveEntity}
      onClick={() => {
        if (!shipEntity || !moveEntity) return;
        move(shipEntity, moveEntity);
      }}
    >
      {!shipEntity ? (
        <span>Choose a ship</span>
      ) : !moveEntity ? (
        <span>Choose a move</span>
      ) : (
        <span>MOVE THAT SHIP</span>
      )}
    </button>
  );
}
