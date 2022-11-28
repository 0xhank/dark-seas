import styled from "styled-components";

const gold = "hsl(45,100%,54.1%)";
const darkGold = "hsl(45,100%,31%)";
const lightBrown = "hsl(30,46.9%,48%)";
const darkBrown = "hsl(28,100%,21%)";
const white = "hsl(0,0%,100%)";
const black = "hsl(0,0%,0%)";
const lighterGray = "hsl(0,0%,86.7%)";
const lightGray = "hsl(0,0%,73.3%)";
const darkGray = "hsl(0,0%,66.7%)";
const darkerGray = "hsl(0,0%,40%)";
const blue = "hsl(203,93.8%,44.3%)";

export const colors = {
  gold,
  lightBrown,
  darkBrown,
  white,
  black,
  lightGray,
  darkGray,
  darkerGray,
  blue,
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
  padding: 12px;
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
  padding: 8px;
  border-radius: 7px;
  border-color: ${gold};
  pointer-events: all;
  color: ${darkBrown};

  :hover {
    background: ${({ isSelected }) => `${isSelected ? gold : "hsla(0, 0%, 100%, 0.75)"}`};
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
  padding: 12px;
  border-radius: 6px;
  background: hsla(0, 0%, 100%, 0.5);
  justify-content: space-between;
  color: ${darkBrown};
`;
