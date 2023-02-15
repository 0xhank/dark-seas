import styled from "styled-components";
import { colors } from "../../styles/global";

export function Action({ name, status }: { name: string; status: number }) {
  const color =
    status == -1 ? "transparent" : status == 0 ? colors.lightGray : status == 1 ? colors.gold : colors.green;
  return (
    <ActionContainer>
      <StatusText style={status <= 0 ? { color: colors.darkGray } : {}}>{name}</StatusText>
      <StatusButton color={color} />
    </ActionContainer>
  );
}

const ActionContainer = styled.div`
  width: 100%;
  background: white;
  border-radius: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px;
  min-height: 20px;
`;

const StatusText = styled.div`
  font-size: 1rem;
  line-height: 1.25rem;
  font-weight: 400;
`;

const StatusButton = styled.div<{ color: string }>`
  background: ${({ color }) => color};
  border-radius: 50%;
  width: 1rem;
  height: 1rem;
`;
