import color from "color";
import styled from "styled-components";

const lightGold = "hsl(45,100%,60%)";
const gold = "hsl(45,100%,54.1%)";
const darkGold = "hsl(45,100%,31%)";
const lightBrown = "hsl(30,46.9%,48%)";
const brown = "hsl(30,100%,35%)";
const darkBrown = "hsl(28,100%,21%)";
const white = "hsl(0,0%,100%)";
const black = "hsl(0,0%,0%)";
const lighterGray = "hsl(0,0%,86.7%)";
const lightGray = "hsla(0,0%,73.3%, 0.8)";
const darkGray = "hsl(0,0%,66.7%)";
const darkerGray = "hsl(0,0%,40%)";
const blue = "hsl(203,93.8%,44.3%)";
const glass = "hsla(0, 0%, 100%, 0.5)";
const thickGlass = "hsla(0, 0%, 100%, 0.75)";
const thinGlass = "hsla(0, 0%, 100%, 0.25)";
const red = "hsl(0, 100%, 50%)";
const cannonReady = "hsla(344, 89%, 59%, 1)";
const waiting = "hsla(50, 100%, 50%, 0.5)";
const green = "hsl(119, 78%, 39%)";
const tan = "hsl(23, 22%, 88%)";
const lightTan = color(tan).lighten(0.1).toString();
const greenGlass = color(green).alpha(0.7).toString();
const darkGrayHex = color(darkGray).rgbNumber();
const blackHex = color(black).rgbNumber();
const whiteHex = color(white).rgbNumber();
const goldHex = color(gold).rgbNumber();
const greenHex = color(green).rgbNumber();
const cannonReadyHex = color(red).rgbNumber();
const redHex = color(red).rgbNumber();

const blueGradient =
  "linear-gradient(45deg, hsla(203, 93%, 33%, 1) 0%, hsla(203, 97%, 37%, 1) 51%, hsla(203, 100%, 53%, 1) 100%)";

export const colors = {
  gold,
  lightGold,
  lightBrown,
  brown,
  darkBrown,
  white,
  black,
  lightGray,
  lighterGray,
  darkGray,
  darkerGray,
  blue,
  darkGold,
  glass,
  tan,
  lightTan,
  thickGlass,
  thinGlass,
  blueGradient,
  red,
  cannonReady,
  waiting,
  greenGlass,
  green,
  whiteHex,
  goldHex,
  greenHex,
  cannonReadyHex,
  redHex,
  darkGrayHex,
  blackHex,
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
  z-index: 5;
`;

export const Success = styled.div`
  color: ${colors.gold};
  border-radius: 6px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const BackgroundImg = styled.div`
  position: fixed;
  left: -25;
  top: -25;
  z-index: 500;
  display: block;
  background-image: url(img/ds-background.jpg);
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  width: calc(100vw + 50px);
  height: calc(100vh + 50px);
  filter: blur(5px) saturate(40%);
`;

export const Button = styled.button<{ isSelected?: boolean; noGoldBorder?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: ${({ isSelected }) => `${isSelected ? gold : glass}`};
  border: ${({ noGoldBorder }) => `${noGoldBorder ? "0" : "1"}px solid ${gold}`};
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  border-color: ${gold};
  pointer-events: all;
  color: ${darkBrown};
  backdrop-filter: blur(3px);
  // color: ${({ isSelected }) => `${isSelected ? white : darkBrown}`};

  :hover {
    background: ${({ isSelected }) => `${isSelected ? lightGold : white}`};
  }

  :disabled {
    background: ${lightGray};
    color: ${lighterGray};
    border-color: ${darkGray};
    cursor: not-allowed;
  }
`;

export const OptionButton = styled(Button)<{ confirmed?: boolean }>`
  :hover {
    background: ${({ isSelected, confirmed }) => `${confirmed ? greenGlass : isSelected ? red : white}`};
    color: ${({ isSelected, disabled }) => `${isSelected || disabled ? white : darkBrown}`};
  }

  :disabled {
    background: ${({ confirmed }) => `${confirmed ? greenGlass : lightGray}`};
    color: ${({ confirmed }) => `${confirmed ? darkBrown : lighterGray}`};
  }
`;

export const Img = styled.img<{ isSelected?: boolean }>`
  height: 80%;
  object-fit: scale-down;
  filter: ${({ isSelected }) =>
    isSelected
      ? "invert(100%)"
      : "invert(19%) sepia(89%) saturate(1106%) hue-rotate(7deg) brightness(93%) contrast(102%)"};
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
  background: ${glass};
  justify-content: space-between;
  color: ${darkBrown};
`;

export const ShipContainer = styled.div<{
  isSelected?: boolean;
  isHovered?: boolean;
}>`
  min-width: 160px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  box-shadow: ${({ isSelected }) => `inset 0px 0px 0px ${isSelected ? "3px" : "0px"} ${colors.gold}`};
  background: ${tan};
  border-radius: 6px;
  color: ${darkBrown};
  filter: drop-shadow(0px 1px 3px ${colors.black});
`;

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
`;

export const Input = styled.input`
  border-radius: 6px;
  padding: 7px;
  font-size: 1rem;
  background: ${thickGlass};
  border: 1px solid ${gold};
  color: ${darkBrown};

  &:focus {
    outline: none;
  }
  ::selection {
    color: white;
    background: #d07e1a;
  }
  ::placeholder {
    color: ${darkGray};
  }
`;

export const BoxImage = styled.div<{ length: number }>`
  position: relative;
  width: ${({ length }) => `${length * 5}%`};
  margin: auto;
  padding-top: 6px;
  :before {
    content: "";
    display: block;
    padding-top: 100%;
  }
`;
