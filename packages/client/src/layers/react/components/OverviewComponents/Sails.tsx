import { EntityID } from "@latticexyz/recs";
import { SailPositionNames, SailPositions } from "../../../../constants";
import { Button } from "../../styles/global";

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
      {sailPosition == 0 ? (
        <Button onClick={() => repairMast(shipEntity)}></Button>
      ) : (
        <span style={{ display: "flex", justifyContent: "center", width: "100%", gap: "5px" }}>
          <Button
            disabled={sailPosition == SailPositions.Open}
            onClick={() => changeSail(shipEntity, sailPosition + 1)}
          >
            RAISE SAILS
          </Button>
          <Button
            disabled={sailPosition == SailPositions.Closed}
            onClick={() => changeSail(shipEntity, sailPosition - 1)}
          >
            LOWER SAILS
          </Button>
        </span>
      )}
    </div>
  );
}
