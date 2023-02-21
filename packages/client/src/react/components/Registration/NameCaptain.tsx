import { useComponentValue, useObservableValue } from "@latticexyz/react";
import { setComponent } from "@latticexyz/recs";
import { useMUD } from "../../../mud/providers/MUDProvider";
import { ModalType } from "../../../types";
import { Button, colors, Input } from "../../styles/global";

export function NameCaptain({ selectFleet }: { selectFleet: () => void }) {
  const {
    components: { Name, ModalOpen, GameConfig },
    godEntity,
    network: { clock },
    utils: { getTurn },
  } = useMUD();

  const name = useComponentValue(Name, godEntity, { value: "" }).value;

  const time = useObservableValue(clock.time$) || 0;
  const gameConfig = useComponentValue(GameConfig, godEntity);
  if (!gameConfig) return null;

  const turn = getTurn(time) || 0;
  const entryWindowClosed = turn > gameConfig.entryCutoffTurns;
  const findSpawnButtonDisabled = name.length === 0 || entryWindowClosed;

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
      {entryWindowClosed && <h1 style={{ color: colors.red, textAlign: "center" }}>Registration window closed!</h1>}
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
