import { EntityID } from "@latticexyz/recs";
import { SailPositionNames, SailPositions } from "../../../../constants";

export default function Sails({
  changeSail,
  repairMast,
  sailPosition,
  shipEntity,
}: {
  changeSail: (shipId: EntityID, sailPosition: number) => void;
  repairMast: (shipId: EntityID) => void;
  sailPosition: number;
  shipEntity: EntityID;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span>Sail position: {SailPositionNames[sailPosition]}</span>
      {sailPosition == 0 ? (
        <button onClick={() => repairMast(shipEntity)}></button>
      ) : (
        <span>
          <button
            disabled={sailPosition == SailPositions.Open}
            onClick={() => changeSail(shipEntity, sailPosition + 1)}
          >
            RAISE THOSE SAILS
          </button>
          <button
            disabled={sailPosition == SailPositions.Closed}
            onClick={() => changeSail(shipEntity, sailPosition - 1)}
          >
            LOWER THOSE SAILS
          </button>
        </span>
      )}
    </div>
  );
}
