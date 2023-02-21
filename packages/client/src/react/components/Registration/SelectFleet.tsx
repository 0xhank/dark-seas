import styled from "styled-components";
import { ShipDetails } from "./ShipDetails";
import { ShipSelect } from "./ShipSelect";
import { YourFleet } from "./YourFleet";

export function SelectFleet({ back }: { back: () => void }) {
  // const {
  //   components: { SelectedShip, ShipPrototype },
  // } = useMUD();

  // useObservableValue(merge(ShipPrototype.update$, SelectedShip.update$));

  // const selectedShips = [...getComponentEntities(SelectedShip)];

  // const prototypeEntities = [...getComponentEntities(ShipPrototype)];

  // const toggleSelected = (prototypeEntity: EntityIndex) => {
  //   if (selectedShips.includes(prototypeEntity)) {
  //     removeComponent(SelectedShip, prototypeEntity);
  //   } else {
  //     setComponent(SelectedShip, prototypeEntity, { value: 1 });
  //   }
  // };
  // const spawnActions = [...runQuery([Has(Action)])];

  // const spawning = !!spawnActions.find((action) => {
  //   const state = getComponentValueStrict(Action, action).state;
  //   return state !== ActionState.Complete && state !== ActionState.Failed;
  // });
  // const txFailed =
  //   !spawning &&
  //   !!spawnActions.find((action) => {
  //     const state = getComponentValueStrict(Action, action).state;
  //     return state == ActionState.Complete || state == ActionState.Failed;
  //   });

  // useObservableValue(Action.update$);

  // let content = (
  //   <Button
  //     disabled={findSpawnButtonDisabled}
  //     style={{
  //       fontSize: "1.5rem",
  //       flex: 1,
  //     }}
  //     onClick={selectFleet}
  //   >
  //     Register
  //   </Button>
  // );
  // if (spawning) {
  //   content = (
  //     <Button
  //       disabled
  //       style={{
  //         fontSize: "1.5rem",
  //         flex: 1,
  //       }}
  //     >
  //       Spawning...
  //     </Button>
  //   );
  // } else if (txFailed) {
  //   content = (
  //     <Button
  //       disabled={findSpawnButtonDisabled}
  //       onClick={() => {
  //         spawnPlayer(playerName);
  //       }}
  //       style={{
  //         fontSize: "1.5rem",
  //         flex: 1,
  //         background: colors.red,
  //       }}
  //     >
  //       Spawn failed! Try again.
  //     </Button>
  //   );
  // }

  return (
    <FleetContainer>
      <Title>Build your fleet</Title>
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
        <ShipSelect flex={1} />
        <ShipDetails flex={2} />
        <YourFleet flex={1} />
      </div>
    </FleetContainer>
  );
}

const Title = styled.p`
  font-size: 3.5rem;
  line-height: 4rem;
`;

const FleetContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  text-align: center;
  padding: 12px;
`;
