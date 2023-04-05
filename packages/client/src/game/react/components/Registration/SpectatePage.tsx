import { EntityID, setComponent } from "@latticexyz/recs";
import { useGame } from "../../../../mud/providers/GameProvider";
import { Button } from "../../../../styles/global";
import { world } from "../../../../world";
import { ModalType } from "../../../types";

export function SpectatePage() {
  const {
    components: { ModalOpen, Player },
    ownerAddress,
  } = useGame();

  const openTutorial = () => setComponent(ModalOpen, ModalType.TUTORIAL, { value: true });
  const spectate = () => {
    const ownerEntity = world.registerEntity({ id: ownerAddress as EntityID });
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
      <h1 style={{ fontSize: "2.5rem", lineHeight: "3rem" }}>Welcome to Dark Seas</h1>
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
