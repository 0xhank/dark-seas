import styled from "styled-components";
import { colors, Container } from "../../styles/global";

export default function ShipDamage({ message }: { message: string }) {
  return <WarningContainer>{message}</WarningContainer>;
}

const WarningContainer = styled(Container)`
  height: auto;
  background: ${colors.red};
  color: ${colors.white};
  flex-direction: row;
  padding: 4px;
  border-radius: 20px;
  gap: 0;
  width: auto;
  text-transform: uppercase;
`;
