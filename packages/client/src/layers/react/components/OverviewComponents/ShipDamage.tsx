import styled from "styled-components";
import { colors, Container } from "../../styles/global";

export default function ShipDamage({ message, amountLeft }: { message: string; amountLeft?: number }) {
  return (
    <WarningContainer>
      {message}
      {amountLeft && <AmountLeft>{amountLeft}</AmountLeft>}
    </WarningContainer>
  );
}

const WarningContainer = styled(Container)`
  height: auto;
  background: ${colors.red};
  color: ${colors.white};
  flex-direction: row;
  padding: 2px;
  border-radius: 10px;
  gap: 0;
  width: auto;
  text-transform: uppercase;
  gap: 10px;
  font-size: 0.7rem;
`;

const AmountLeft = styled.div`
  background: ${colors.white};
  color: ${colors.red};
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;
`;
