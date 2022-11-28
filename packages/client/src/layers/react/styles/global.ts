import styled from "styled-components";

const gold = "#FFC415";
const darkGold = "#9e7700";
const lightBrown = "#B47B41";
const darkBrown = "#6b3200";
const white = "fff";
const black = "000";
const lighterGray = "#DDD";
const lightGray = "#BBB";
const darkGray = "#AAA";

export const colors = {
  gold,
  lightBrown,
  darkBrown,
  white,
  black,
  lightGray,
  darkGray,
};

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

export const Button = styled.button<{ isSelected?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: ${({ isSelected }) => `${isSelected ? gold : "hsla(0, 0%, 100%, 0.5)"}`};
  border: 1px solid ${gold};
  cursor: pointer;
  padding: 5px;
  border-radius: 7px;
  border-color: ${gold};
  pointer-events: all;
  color: ${darkBrown};

  :hover {
    background: ${({ isSelected }) => `${isSelected ? gold : "hsla(0, 0%, 100%, 0.75)"}`};
  }
`;

export const ConfirmButton = styled(Button)`
  background: ${gold};

  :hover {
    background: ${gold};
  }

  :disabled {
    background: ${lightGray};
    color: ${lighterGray};
    border-color: ${darkGray};
    cursor: not-allowed;
    hover: {
      background: ${lightGray};
    }
  }
`;

export const InternalContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  padding: 6px;
  border-radius: 6px;
  background: hsla(0, 0%, 100%, 0.5);
  justify-content: space-between;
`;
