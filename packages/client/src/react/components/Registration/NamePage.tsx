import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { setComponent } from "@latticexyz/recs";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { ModalType } from "../../../types";
import { formatTime } from "../../../utils/directions";
import { Button, colors, Input } from "../../styles/global";

export function NamePage({ selectFleet }: { selectFleet: () => void }) {
  const {
    components: { Name, ModalOpen, GameConfig },
    godEntity,
    network: { clock },
  } = useMUD();

  const name = useComponentValue(Name, godEntity, { value: "" }).value;

  const time = useObservableValue(clock.time$) || 0;
  const gameConfig = useComponentValue(GameConfig, godEntity);
  if (!gameConfig) return null;

  const closeTime =
    Number(gameConfig.startTime) +
    gameConfig.entryCutoffTurns *
      (gameConfig.commitPhaseLength + gameConfig.revealPhaseLength + gameConfig.actionPhaseLength);

  const timeUntilRound = closeTime - time / 1000;
  const findSpawnButtonDisabled = name.length === 0 || timeUntilRound < 0;

  const openTutorial = () => setComponent(ModalOpen, ModalType.TUTORIAL, { value: true });

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
          if (e.target.value.length < 15) setComponent(Name, godEntity, { value: e.target.value });
        }}
      ></Input>
      {timeUntilRound < 0 ? (
        <h1 style={{ color: colors.red, textAlign: "center" }}>closed!</h1>
      ) : (
        <h1>Game Starts in {formatTime(timeUntilRound)}</h1>
      )}
      <div style={{ display: "flex", gap: "8px", minWidth: "33%" }}>
        <Button style={{ flex: 1 }} secondary onClick={openTutorial}>
          How to Play
        </Button>
        <Button style={{ flex: 2 }} disabled={findSpawnButtonDisabled} onClick={selectFleet}>
          Continue
        </Button>
      </div>
    </div>
  );
}
