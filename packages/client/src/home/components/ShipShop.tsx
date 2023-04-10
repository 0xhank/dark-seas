import { useEntityQuery } from "@latticexyz/react";
import { Has, Not } from "@latticexyz/recs";
import { Fragment } from "react";
import { useNetwork } from "../../mud/providers/NetworkProvider";
import { ShipButton } from "./ShipButton";
import { ShipButtons } from "./YourPort";

export function ShipShop() {
  const {
    components: { ShipPrototype, OwnedBy },
    api: { purchaseShip },
    singletonEntity,
  } = useNetwork();

  const shipEntities = useEntityQuery([Has(ShipPrototype), Not(OwnedBy)]).filter(
    (entity) => entity !== singletonEntity
  );

  return (
    <>
      <span> For now, all ships are FREE!</span>
      <ShipButtons>
        {shipEntities.map((shipEntity, index) => (
          <Fragment key={index}>
            <ShipButton shipEntity={shipEntity} showPrice onClick={() => purchaseShip(shipEntity)} />
          </Fragment>
        ))}
      </ShipButtons>
    </>
  );
}
