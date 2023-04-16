import styled, { keyframes } from "styled-components";
import { colors } from "../../../../styles/global";

export function ActionComponent({ name, status }: { name: string; status: number }) {
  const color =
    status == -1 ? "transparent" : status == 0 ? colors.lightGray : status == 3 ? colors.green : colors.gold;
  return (
    <ActionContainer hide={status == -1}>
      <StatusText style={status <= 0 ? { color: colors.darkGray } : {}}>{name}</StatusText>
      {status !== 2 ? (
        <StatusCircle color={color} />
      ) : (
        <PuffWrapper>
          <Puff i={1} />
          <Puff i={2} />
        </PuffWrapper>
      )}
    </ActionContainer>
  );
}

const ActionContainer = styled.div<{ hide?: boolean }>`
  width: 100%;
  background: ${({ hide }) => (hide ? "transparent" : "white")};
  border-radius: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px;
`;

const StatusText = styled.div`
  font-size: 1rem;
  line-height: 1.25rem;
  font-weight: 400;
`;

const StatusCircle = styled.div<{ color: string }>`
  background: ${({ color }) => color};
  border-radius: 50%;
  width: 1rem;
  height: 1rem;
`;

const PuffWrapper = styled.div`
  display: inherit;
  position: relative;
  width: 1rem;
  height: 1rem;
`;

const PuffAnim0 = keyframes`
0% {transform: scale(0)} 100% {transform: scale(1.0)}
`;

const PuffAnim1 = keyframes`
0% {opacity: 1} 100% {opacity: 0}
`;

const Puff = styled.div<{ i: number }>`
  position: absolute;
  height: 1rem;
  width: 1rem;
  border: thick solid ${colors.gold};
  border-radius: 50%;
  top: 0;
  left: 0;
  animation-fill-mode: both;
  animation: ${PuffAnim0}, ${PuffAnim1};
  animation-duration: 1s;
  animation-iteration-count: infinite;
  animation-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1), cubic-bezier(0.3, 0.61, 0.355, 1);
  animation-delay: ${({ i }) => (i === 1 ? "-1s" : "0s")};
`;
