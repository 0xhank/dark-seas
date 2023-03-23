import { useComponentValue } from "@latticexyz/react";
import {
  EntityIndex,
  getComponentEntities,
  getComponentValueStrict,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import styled from "styled-components";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { world } from "../../../mud/world";
import { POS_HEIGHT, POS_WIDTH } from "../../../phaser/constants";
import { HoverType, ModalType } from "../../../types";
import { Button, colors } from "../../styles/global";
import { SortableTable } from "./SortableTable";
type ShipData = {
  entity: EntityIndex;
  name: string;
  health: number;
  owner: string;
};

type PlayerData = {
  playerEntity: EntityIndex;
  name: string;
  ships: number;
};

export function Leaderboard() {
  const {
    components: { ModalOpen, Ship, HealthLocal, OwnedBy, Name, Position, HoveredSprite },
    godEntity,
    scene: { camera },
    utils: { getShipName },
  } = useMUD();
  let players: PlayerData[] = [];
  let ships: ShipData[] = [];

  [...getComponentEntities(Ship)].forEach((shipEntity) => {
    const health = useComponentValue(HealthLocal, shipEntity)?.value;
    const ownerId = useComponentValue(OwnedBy, shipEntity)?.value;

    if (!ownerId) return;
    const owner = world.entityToIndex.get(ownerId);
    if (!owner) return;
    const name = useComponentValue(Name, owner)?.value;
    if (health == undefined || name == undefined) return;
    const player = players.find((player) => player.playerEntity == owner);

    if (!player) {
      players.push({
        playerEntity: owner,
        name,
        ships: health > 0 ? 1 : 0,
      });
    } else {
      if (health > 0) player.ships++;
    }
    ships.push({
      entity: shipEntity,
      name: getShipName(shipEntity),
      health,
      owner: name,
    });
  });

  function focusShip(shipEntity: EntityIndex) {
    const position = getComponentValueStrict(Position, shipEntity);
    setComponent(HoveredSprite, HoverType.SHIP, { value: shipEntity });
    camera.centerOn(position.x * POS_WIDTH, position.y * POS_HEIGHT);
    removeComponent(ModalOpen, ModalType.LEADERBOARD);
  }
  const playerColumns = [(player: PlayerData) => <p>{player.name}</p>, (player: PlayerData) => <p>{player.ships}</p>];

  const playerSort = [
    (a: PlayerData, b: PlayerData) => a.name.localeCompare(b.name),
    (a: PlayerData, b: PlayerData) => a.ships - b.ships,
  ];
  const shipColumns = [
    (ship: ShipData) => <p>{ship.name}</p>,
    (ship: ShipData) => <p>{ship.health}</p>,
    (ship: ShipData) => <p>{ship.owner}</p>,
    (ship: ShipData) => (
      <Button onClick={() => focusShip(ship.entity)} style={{ zIndex: -1 }}>
        view
      </Button>
    ),
  ];
  const shipSort = [
    (a: ShipData, b: ShipData) => a.name.localeCompare(b.name),
    (a: ShipData, b: ShipData) => a.health - b.health,
    (a: ShipData, b: ShipData) => a.owner.localeCompare(b.owner),
  ];
  return (
    <>
      <LeaderboardContainer onClick={(e) => e.stopPropagation()}>
        <div style={{ overflow: "auto" }}>
          <p style={{ fontSize: "2rem" }}>Player Leaderboard</p>
          <SortableTable
            rows={players}
            headers={["Name", "Ships"]}
            columns={playerColumns}
            sortFunctions={playerSort}
            alignments={["c", "c", "c"]}
          />
        </div>
      </LeaderboardContainer>
      <LeaderboardContainer onClick={(e) => e.stopPropagation()}>
        <div style={{ overflow: "auto" }}>
          <p style={{ fontSize: "2rem", position: "sticky" }}>Ship Leaderboard</p>
          <SortableTable
            rows={ships}
            headers={["Name", "Health", "Owner", ""]}
            columns={shipColumns}
            sortFunctions={shipSort}
            alignments={["c", "c", "c", "c"]}
          />
        </div>
      </LeaderboardContainer>
    </>
  );
}

const LeaderboardContainer = styled.div`
  height: 80%;
  min-width: 20%;
  background: whitesmoke;
  border: 5px solid ${colors.gold};

  color: ${colors.darkBrown};
  border-radius: 20px;
  padding: 10px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-direction: column;
  ::-webkit-scrollbar {
    width: 10px;
    margin: 10px;
  }
  ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border: solid 3px transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #888;
    border: solid 3px transparent;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  overflow: hidden;
`;
