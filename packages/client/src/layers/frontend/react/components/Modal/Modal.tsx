import { EntityIndex, getComponentEntities, getComponentValue, removeComponent } from "@latticexyz/recs";
import { map, merge } from "rxjs";
import { ModalType } from "../../../../../types";
import { getShipName } from "../../../../../utils/ships";
import { registerUIComponent } from "../../engine";
import { Container } from "../../styles/global";
import { Leaderboard } from "./Leaderboard";
import { Tutorial } from "./Tutorial";

export type ShipData = {
  name: string;
  health: number;
  kills: number;
  booty: number;
  owner: string;
};

export type PlayerData = {
  playerEntity: EntityIndex;
  name: string;
  health: number;
  kills: number;
  booty: number;
};

export function registerModal() {
  registerUIComponent(
    "Leaderboard",
    {
      rowStart: 1,
      rowEnd: 13,
      colStart: 1,
      colEnd: 13,
    },
    (layers) => {
      const {
        network: {
          world,
          components: { Kills, OwnedBy, Ship, Name, Booty },
        },
        backend: {
          components: { ModalOpen, HealthLocal },
          utils: { clearComponent },
          godEntity,
        },
      } = layers;

      return merge(Booty.update$, HealthLocal.update$, Kills.update$, ModalOpen.update$).pipe(
        map(() => {
          const showTutorial = !!getComponentValue(ModalOpen, ModalType.TUTORIAL)?.value;
          const showLeaderboard = !!getComponentValue(ModalOpen, ModalType.LEADERBOARD)?.value;
          const close = () => {
            removeComponent(ModalOpen, ModalType.TUTORIAL);
            removeComponent(ModalOpen, ModalType.LEADERBOARD);
          };
          const getPlayersAndShips = () => {
            let players: PlayerData[] = [];
            let ships: ShipData[] = [];

            [...getComponentEntities(Ship)].forEach((shipEntity) => {
              const health = getComponentValue(HealthLocal, shipEntity)?.value;
              const kills = getComponentValue(Kills, shipEntity)?.value;
              const bootyString = getComponentValue(Booty, shipEntity)?.value;
              const ownerId = getComponentValue(OwnedBy, shipEntity)?.value;

              if (!ownerId) return;
              const owner = world.entityToIndex.get(ownerId);
              if (!owner) return;
              const name = getComponentValue(Name, owner)?.value;
              if (health == undefined || kills == undefined || name == undefined || bootyString == undefined) return;
              const booty = Number(bootyString);
              const player = players.find((player) => player.playerEntity == owner);

              if (!player) {
                players.push({
                  playerEntity: owner,
                  name,
                  health,
                  kills,
                  booty,
                });
              } else {
                player.health += health;
                player.kills += kills;
              }

              ships.push({
                name: getShipName(shipEntity),
                health,
                kills,
                owner: name,
                booty,
              });
            });
            return { players, ships };
          };

          return {
            getPlayersAndShips,
            showTutorial,
            showLeaderboard,
            close,
          };
        })
      );
    },
    ({ showTutorial, showLeaderboard, getPlayersAndShips, close }) => {
      let content = null;
      if (showLeaderboard) {
        const { ships, players } = getPlayersAndShips();
        content = <Leaderboard ships={ships} players={players} />;
      } else if (showTutorial) {
        content = <Tutorial />;
      }
      if (!content) return null;
      return (
        <Container
          style={{ flexDirection: "row", background: "hsla(0, 0%, 0%, 0.6", zIndex: 9999, gap: "20px" }}
          onClick={close}
          onMouseEnter={(e) => e.stopPropagation()}
        >
          {content}
        </Container>
      );
    }
  );
}
