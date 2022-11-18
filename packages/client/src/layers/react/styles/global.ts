import styled from "styled-components";

const gold = "#fa0";
const brown = "#9e4a00";
const darkBrown = "#6b3200";

export const Container = styled.div`
  width: 100%;
  height: 100%;
  background: ${brown};
  display: flex;
  flex-direction: column;
  text-align: center;
  justify-content: center;
  align-items: center;
  padding: 5px;
  pointer-events: all;
  gap: 5px;
`;

export const MoveOption = styled.div<{ isSelected?: boolean }>`
  display: flex;
  flex-direction: column;
  background: ${({ isSelected }) => `${isSelected ? gold : brown}`};
  border: ${({ isSelected }) => `1px solid ${isSelected ? darkBrown : gold}`};
  cursor: pointer;
  padding: 5px;
  border-width: 1px;
  pointer-events: all;
  color: ${({ isSelected }) => `${isSelected ? darkBrown : gold}`};
`;
