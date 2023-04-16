import { useComponentValue } from "@latticexyz/react";
import { removeComponent } from "@latticexyz/recs";
import { useGame } from "../../../../mud/providers/GameProvider";
import { Container } from "../../../../styles/global";
import { ModalType } from "../../..//types";
import { Cell } from "../Cell";
import { Leaderboard } from "./Leaderboard";
import { Tutorial } from "./Tutorial";

const gridConfig = {
  gridRowStart: 1,
  gridRowEnd: 13,
  gridColumnStart: 1,
  gridColumnEnd: 13,
};
export function Modal() {
  const {
    components: { ModalOpen },
  } = useGame();

  const showTutorial = !!useComponentValue(ModalOpen, ModalType.TUTORIAL)?.value;
  const showLeaderboard = !!useComponentValue(ModalOpen, ModalType.LEADERBOARD)?.value;
  const close = () => {
    removeComponent(ModalOpen, ModalType.TUTORIAL);
    removeComponent(ModalOpen, ModalType.LEADERBOARD);
  };

  let content = null;
  if (showLeaderboard) {
    content = <Leaderboard />;
  } else if (showTutorial) {
    content = <Tutorial />;
  }
  if (!content) return null;
  return (
    <Cell style={gridConfig}>
      <Container
        style={{ flexDirection: "row", background: "hsla(0, 0%, 0%, 0.6", zIndex: 9999, gap: "20px" }}
        onClick={close}
        onMouseEnter={(e) => e.stopPropagation()}
      >
        {content}
      </Container>
    </Cell>
  );
}
