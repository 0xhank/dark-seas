import styled from "styled-components";
import { colors, ShipContainer } from "../../styles/global";

export function Tutorial() {
  return (
    <TutorialContainer>
      <Header>
        <H1>Welcome to Dark Seas!</H1>
        <H2>To win, sink as many enemies as you can. Gameplay occurs in two separate phases:</H2>
      </Header>
      <div
        style={{ height: "100%", background: colors.lightTan, borderRadius: "12px", display: "grid", margin: "6px" }}
      >
        <MoveOptionContainer>
          <div>
            <H4>Move Phase</H4>
            <P>Choose one move for each ship.</P>
          </div>
          <TutorialImg src="/img/tutorial/move_options.png"></TutorialImg>
          <P>To move, select your ship then click a move ghost.</P>
        </MoveOptionContainer>
        <ActionTitleContainer>
          <H4>Action Phase</H4>
          <P>Choose up to two actions for each ship.</P>
        </ActionTitleContainer>
        <CannonActionContainer>
          <H5>Cannon Actions</H5>
          <P>Select a cannon's firing area to activate it.</P>
          <TutorialImg src="/img/tutorial/cannon_options.png"></TutorialImg>

          <P>Before you fire a cannon, you must load it.</P>
        </CannonActionContainer>
        <SpecialActionContainer>
          <H5>Special actions</H5>
          <P>This is your ship's status bar. </P>
          <TutorialImg src="/img/tutorial/ship_stats.png"></TutorialImg>
          <div style={{ display: "flex", width: "80%", gap: "6px" }}>
            <P>If your ship takes special damage, repair it from the status bar.</P>
            <TutorialImg
              src="/img/tutorial/special_actions.png"
              style={{ width: "40%", height: "fit-content" }}
            ></TutorialImg>
          </div>
        </SpecialActionContainer>
      </div>
    </TutorialContainer>
  );
}

const TutorialImg = styled.img`
  border: 6px solid ${colors.gold};
  border-radius: 6px;
  width: 75%;
`;

const H1 = styled.h1`
  font-size: 4rem;
  line-height: 5rem;
  color: ${colors.gold};
  text-shadow: ${colors.darkBrown} 1px 1px 4px;
`;

const H2 = styled.h1`
  font-size: 2rem;
  line-height: 3rem;
  color: ${colors.darkBrown};
`;

const H3 = styled.h1`
  font-size: 2rem;
  line-height: 3rem;
  color: ${colors.darkBrown};
`;

const H4 = styled.h4`
  font-size: 2.5rem;
  line-height: 3.5rem;
  color: ${colors.gold};
  text-shadow: ${colors.darkBrown} 1px 1px 3px;
`;

const H5 = styled.h5`
  font-size: 2rem;
  line-height: 3rem;
  color: ${colors.gold};
  text-shadow: ${colors.darkBrown} 1px 1px 3px;
`;

const P = styled.p`
  font-size: 1.5rem;
  line-height: 2.5rem;
  color: ${colors.darkBrown};
`;
const TutorialContainer = styled(ShipContainer)`
  width: 90%;
  height: 90%;
  display: flex;
  text-align: center;
`;

const Header = styled.div`
  padding: 26px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;
const MoveOptionContainer = styled.div`
  grid-column-start: 1;
  grid-column-end: 3;
  grid-row-start: 4;
  grid-row-end: 12;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`;

const ActionTitleContainer = styled.div`
  grid-column-start: 3;
  grid-column-end: 7;
  grid-row-start: 4;
  grid-row-end: 6;
  padding: 6px;
`;

const CannonActionContainer = styled.div`
  grid-column-start: 3;
  grid-column-end: 5;
  grid-row-start: 6;
  grid-row-end: 12;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  border-right: 1px solid ${colors.brown};

  gap: 1rem;
`;

const SpecialActionContainer = styled.div`
  grid-column-start: 5;
  grid-column-end: 7;
  grid-row-start: 6;
  grid-row-end: 12;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 6px;
`;
