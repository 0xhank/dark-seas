import { useObservableValue } from "@latticexyz/react";
import {
  EntityIndex,
  getComponentEntities,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { defaultAbiCoder as abi } from "ethers/lib/utils";

import { merge } from "rxjs";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { CannonPrototype } from "../../../types";
import { Button, Container } from "../../styles/global";

export function SelectFleet() {
  const {
    components: { SelectedShip, ShipPrototype },
  } = useMUD();

  useObservableValue(merge(ShipPrototype.update$, SelectedShip.update$));

  const selectedShips = [...getComponentEntities(SelectedShip)];

  const prototypeEntities = [...getComponentEntities(ShipPrototype)];

  const toggleSelected = (prototypeEntity: EntityIndex) => {
    if (selectedShips.includes(prototypeEntity)) {
      removeComponent(SelectedShip, prototypeEntity);
    } else {
      setComponent(SelectedShip, prototypeEntity, { value: 1 });
    }
  };
  return (
    <Container>
      {prototypeEntities.map((prototypeEntity) => {
        const shipPrototypeDataEncoded = getComponentValueStrict(ShipPrototype, prototypeEntity).value;

        const reformattedData = "0x" + shipPrototypeDataEncoded.slice(66);

        const [price, length, maxHealth, speed, rawCannons] = abi.decode(
          [
            "uint32 price",
            "uint32 length",
            "uint32 maxHealth",
            "uint32 speed",
            "tuple(uint32 rotation,uint32 firepower,uint32 range)[] cannons",
          ],
          reformattedData
        );
        const cannons = rawCannons.map((cannon: [any, any, any]) => {
          const [rotation, firepower, range] = cannon;
          return {
            rotation,
            firepower,
            range,
          };
        }) as CannonPrototype[];
        console.log("cannons:", cannons);
        return (
          <Button key={`shipPrototype-${prototypeEntity}`} onClick={() => toggleSelected(prototypeEntity)}>
            <p>price: {price}</p>
            <p>length: {length}</p>
            <p>max health: {maxHealth}</p>
            <p>speed: {speed}</p>
            {cannons.map((cannon, idx) => {
              return (
                <div>
                  cannon {idx}
                  <p>range: {cannon.range}</p>
                  <p>range: {cannon.firepower}</p>
                  <p>range: {cannon.rotation}</p>
                </div>
              );
            })}
          </Button>
        );
      })}
    </Container>
  );
}
