import styled from "styled-components";
import { colors, Container } from "../../styles/global";

export default function ShipDamage({
  message,
  amountLeft,
  fixing,
}: {
  message: string;
  amountLeft?: number;
  fixing?: boolean;
}) {
  if (amountLeft == 0) return null;

  if (fixing && amountLeft) {
    amountLeft--;
  }

  const removing = !!fixing && !amountLeft;
  return (
    <WarningContainer removing={removing}>
      <p style={{ lineHeight: "1rem" }}>{message}</p>
      {!!amountLeft && amountLeft !== 1 && <AmountLeft fixing={fixing}>{amountLeft}</AmountLeft>}
    </WarningContainer>
  );
}

const WarningContainer = styled(Container)<{ removing?: boolean }>`
  height: 2rem;
  background: ${({ removing }) => (removing ? colors.greenGlass : colors.red)};
  color: ${colors.white};
  padding: 0.5rem;
  flex-direction: row;
  border-radius: 6px;
  width: fit-content;
  text-transform: uppercase;
  gap: 4px;
  font-size: 0.7rem;
`;

const AmountLeft = styled.div<{ fixing?: boolean }>`
  background: ${colors.white};
  color: ${({ fixing }) => (fixing ? colors.greenGlass : colors.red)};
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
`;
