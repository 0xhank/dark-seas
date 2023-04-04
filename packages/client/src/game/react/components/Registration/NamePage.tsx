import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { EntityID, setComponent } from "@latticexyz/recs";
import { useGame } from "../../../../mud/providers/GameProvider";
import { Button, Input, colors } from "../../../../styles/global";
import { world } from "../../../../world";
import { ModalType } from "../../..//types";
import { formatTime } from "../../..//utils/directions";

export function NamePage({ selectFleet }: { selectFleet: () => void }) {
  const {
    components: { Name, ModalOpen, GameConfig, Player },
    playerAddress,
    gameEntity,
    network: { clock },
  } = useGame();

  const name = useComponentValue(Name, gameEntity, { value: "" }).value;

  const time = useObservableValue(clock.time$) || 0;
  const gameConfig = useComponentValue(GameConfig, gameEntity);
  if (!gameConfig) return null;

  const closeTime =
    Number(gameConfig.startTime) +
    gameConfig.entryCutoffTurns *
      (gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength);

  const timeUntilRound = closeTime - time / 1000;
  const findSpawnButtonDisabled = name.length === 0 || timeUntilRound < 0;

  const openTutorial = () => setComponent(ModalOpen, ModalType.TUTORIAL, { value: true });
  const spectate = () => {
    const ownerEntity = world.registerEntity({ id: playerAddress as EntityID });
    // setting player to -1 tells Game.tsx that we are spectating
    setComponent(Player, ownerEntity, { value: -1 });
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        height: "100%",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", lineHeight: "3rem" }}>Name Your Captain</h1>

      <Input
        style={{ textAlign: "center", minWidth: "33%" }}
        type={"text"}
        placeholder="Name..."
        value={name}
        onChange={(e) => {
          if (e.target.value.length < 15) setComponent(Name, gameEntity, { value: e.target.value });
        }}
      ></Input>
      {timeUntilRound < 0 ? (
        <h1 style={{ color: colors.red, textAlign: "center" }}>Registration closed</h1>
      ) : (
        <h1>Game Starts in {formatTime(timeUntilRound)}</h1>
      )}
      <Button style={{ minWidth: "33%" }} disabled={findSpawnButtonDisabled} onClick={selectFleet}>
        Continue
      </Button>
      <div style={{ display: "flex", gap: "8px", minWidth: "33%" }}>
        <Button style={{ flex: 1 }} secondary onClick={openTutorial}>
          How to Play
        </Button>
        <Button style={{ flex: 1 }} secondary onClick={spectate}>
          Spectate
        </Button>
      </div>
    </div>
  );
}
