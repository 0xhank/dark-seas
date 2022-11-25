import styled from "styled-components";

const gold = "#FFC415";
const lightBrown = "#B47B41";
const darkBrown = "#6b3200";
const white = "fff";
const black = "000";
const lightGray = "BBB";

export const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
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
  background: ${({ isSelected }) => `${isSelected ? gold : lightBrown}`};
  border: ${({ isSelected }) => `1px solid ${isSelected ? darkBrown : gold}`};
  cursor: pointer;
  padding: 5px;
  border-width: 1px;
  pointer-events: all;
  color: ${({ isSelected }) => `${isSelected ? darkBrown : gold}`};
`;

export const colors = {
  gold,
  lightBrown,
  darkBrown,
  white,
  black,
  lightGray,
};
