import styled from "styled-components";
import { Wind } from "../../../../../types";
import { colors } from "../../styles/global";

export function Compass({ speed, direction }: Wind) {
  return (
    <CompassBody>
      <CompassWindRose>
        <CompassMarkH></CompassMarkH>
        <CompassMarkV></CompassMarkV>
      </CompassWindRose>
      <CompassArrowContainer style={{ transform: `translate(-50%,-50%) rotate(${(direction + 90) % 360}deg)` }}>
        <CompassArrow />
        <CompassLabels>
          <CompassSpan style={{ transform: `rotate(${360 - ((direction + 90) % 360)}deg)` }}>
            {speed} kt{speed == 1 ? "" : "s"}
          </CompassSpan>
        </CompassLabels>
      </CompassArrowContainer>
    </CompassBody>
  );
}

const CompassBody = styled.div`
  width: 100px;
  height: 100px;
  position: absolute;
  left: 20;
  top: 0;
  bottom: 0;
  margin-top: auto;
  margin-bottom: auto;
`;

const CompassWindRose = styled.div`
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: ${colors.white};
  border: 7px solid ${colors.gold};
  position: relative;
  box-shadow: inset 0 0 5px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;

  &:before,
  &:after {
    content: "";
    position: absolute;
    background-color: ${colors.gold};
  }

  &:before {
    top: -15px;
    left: calc(50% - 8.5px);
    width: 18px;
    height: 18px;
    border-radius: 1000% 50% 0 50%;
    transform: rotate(45deg);
    box-shadow: 0 0 5px 3px rgba(0, 0, 0, 0.05);
  }

  &:after {
    top: -16px;
    left: calc(50% - 16.5px);
    width: 35px;
    height: 14px;
    z-index: 10;
    border-radius: 15px 15px 0 0;
  }
  & :nth-child(i) {
    transform: rotate(i deg);
  }
`;

const CompassMarkV = styled.div`
  width: 4px;
  height: 100%;
  top: 3px;
  left: calc(50% - 2px);
  position: absolute;
  transform: rotate(90deg);

  &:before,
  &:after {
    content: "";
    position: absolute;
    left: 0;
    width: auto;
    height: auto;
    font-size: 1rem;
    line-height: 1rem;
    border-radius: 0;
    background: transparent;
    color: ${colors.black};
    font-weight: 100;
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.35);
  }

  &:before {
    content: "E";
    left: -4.5px;
    top: 4%;
  }

  &:after {
    content: "W";
    left: -6px;
    bottom: 5.5%;
    transform: rotate(180deg);
  }
`;

const CompassMarkH = styled.div`
  width: 4px;
  height: 100%;
  left: calc(50% + 7px);
  position: absolute;

  &:before,
  &:after {
    content: "";
    position: absolute;
    left: 0;
    width: auto;
    height: auto;
    font-size: 1rem;
    line-height: 1rem;
    border-radius: 0;
    background: transparent;
    color: ${colors.black};
    font-weight: 100;
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.35);
  }

  &:before {
    content: "N";
    left: -11px;
    font-weight: 400;
    top: 12%;
    top: 7.5%;
  }

  &:after {
    content: "S";
    left: -9.5px;
    bottom: 5%;
    transform: rotate(180deg);
  }
`;

const CompassArrowContainer = styled.div`
  width: 50%;
  height: 50%;
  border-radius: 50%;
  background-color: ${colors.lightGray};
  box-sizing: border-box;
  top: 50%;
  left: 50%;
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  transition: transform 0.3s ease;
`;

const CompassArrow = styled.div`
  position: absolute;
  width: 90%;
  height: 90%;
  margin-left: 4.5%;
  margin-top: 4.5%;
  background-color: ${colors.lightBrown};
  border-radius: 0 50% 50% 50%;
  box-sizing: border-box;
  transform: rotate(45deg);
`;

const CompassLabels = styled.div`
  position: absolute;
  z-index: 1;
  width: 87%;
  height: 87%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  box-sizing: border-box;
  box-shadow: inset 0 0 5px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const CompassSpan = styled.span`
  display: inline-block;
  width: 100%;
  text-align: center;
  color: ${colors.white};
  font-size: 1rem;
  line-height: 1rem;
  font-weight: 400;

  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.35);
`;

const Sup = styled.span`
  line-height: 1rem;
  font-size: 1rem;
`;
