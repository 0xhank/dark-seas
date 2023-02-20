import { useObservableValue } from "@latticexyz/react";
import {
  EntityIndex,
  getComponentEntities,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { merge } from "rxjs";
import { useMUD } from "../../../mud/providers/MUDProvider";
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
        console.log("shipPrototypeDataEncoded", shipPrototypeDataEncoded);
        // const shipPrototypeData = abi.decode(
        //   [
        //     "uint32 length",
        //     "uint32 maxHealth",
        //     "uint32 speed",
        //     "uint32 price",
        //     "tuple(uint32, uint32, uint32)[] cannons",
        //   ],
        //   shipPrototypeDataEncoded
        // );
        // console.log("ship prototype data:", shipPrototypeData);
        return (
          <Button key={`shipPrototype-${prototypeEntity}`} onClick={() => toggleSelected(prototypeEntity)}>
            {/* {shipPrototypeData} */}
          </Button>
        );
      })}
    </Container>
  );
}
