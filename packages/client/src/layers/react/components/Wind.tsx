import React, { useState } from "react";
import { registerUIComponent } from "../engine";
import {
  EntityIndex,
  getComponentEntities,
  getComponentValue,
  getComponentValueStrict,
  getEntityComponents,
  removeComponent,
  setComponent,
} from "@latticexyz/recs";
import { concat, map, merge, of } from "rxjs";
import { ActionStateString, ActionState } from "@latticexyz/std-client";
import { Coord } from "@latticexyz/utils";
import { GodID } from "@latticexyz/network";
import { Arrows } from "../../phaser/constants";
import { Container } from "../styles/global";
import styled from "styled-components";

export function registerWind() {
  registerUIComponent(
    // name
    "Wind",
    // grid location
    {
      rowStart: 10,
      rowEnd: 13,
      colStart: 1,
      colEnd: 3,
    },
    // requirement
    (layers) => {
      const {
        network: {
          world,
          components: { Wind },
        },
      } = layers;

      return merge(of(0), Wind.update$).pipe(
        map(() => {
          return {
            Wind,
            world,
          };
        })
      );
    },
    ({ Wind, world }) => {
      const GodEntityIndex: EntityIndex = world.entityToIndex.get(GodID) || (0 as EntityIndex);

      const defaultProps: propTypes = {
        direction: 0,
        directionNames: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
      };

      type propTypes = {
        direction: number;
        directionNames: string[];
      };

      function directionName(dir: number): string {
        let sections = defaultProps.directionNames.length,
          sect = 360 / sections,
          x = Math.floor((dir + sect / 2) / sect);

        x = x >= sections ? 0 : x;

        return defaultProps.directionNames[x];
      }

      const dir: number = Wind.values.direction.get(GodEntityIndex) || 0;
      const speed: number = Wind.values.speed.get(GodEntityIndex) || 0;
      const name = directionName(dir);

      return (
        <Container>
          <Compass>
            <CompassWindRose style={{ transform: `rotate(-${dir}deg)` }}>
              {[...Array(10)].map((k, i) => (
                <CompassMark key={i + 1} />
              ))}
              <CompassMarkH></CompassMarkH>
              <CompassMarkV></CompassMarkV>
            </CompassWindRose>
            <CompassArrowContainer>
              <CompassArrow />
              <CompassLabels />
              <CompassSpan>
                {speed} knot{speed == 1 ? "" : "s"}
              </CompassSpan>
              <CompassSpan>
                {dir}
                <Sup>o</Sup>
              </CompassSpan>
            </CompassArrowContainer>
          </Compass>
        </Container>
      );
    }
  );
}

const accentColor = "#BE4D45";
const darkColor = "#2A3539";

const Compass = styled.div`
  width: 150px;
  height: 150px;
  position: relative;
`;

const CompassWindRose = styled.div`
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: ${darkColor};
  border: 12px solid ${accentColor};
  position: relative;
  box-shadow: inset 0 0 5px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;

  &:before,
  &:after {
    content: "";
    position: absolute;
    background-color: ${accentColor};
  }

  &:before {
    top: -16px;
    left: calc(50% - 18px);
    width: 36px;
    height: 36px;
    border-radius: 1000% 50% 0 50%;
    transform: rotate(45deg);
    box-shadow: 0 0 5px 3px rgba(0, 0, 0, 0.05);
    z-index: 1;
  }

  &:after {
    top: -10px;
    left: calc(50% - 30px);
    width: 60px;
    height: 12px;
    z-index: 10;
    border-radius: 15px 15px 0 0;
  }
`;

const CompassMarkV = styled.div`
  width: 4px;
  height: 100%;
  left: calc(50% - 2px);
  position: absolute;

  &:before,
  &:after {
    content: "";
    position: absolute;
    left: 0;
    width: 4px;
    height: 4px;
    border-radius: 50px;
    background-color: #fff;
  }

  &:before {
    top: 12%;
  }

  &:after {
    bottom: 12%;
  }

  &:before,
  &:after {
    width: auto;
    height: auto;
    font-size: 42px;
    line-height: 42px;
    border-radius: 0;
    background: transparent;
    color: #fff;
    font-weight: 100;
    font-family: "Roboto Slab", serif;
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.35);
  }

  &:before {
    top: 8.5%;
  }

  &:after {
    bottom: 8.5%;
    transform: rotate(180deg);
  }
  transform: rotate(90deg);

  &:before {
    content: "E";
    left: -11px;
  }

  &:after {
    content: "W";
    left: -18px;
  }
`;

const CompassMarkH = styled.div`
  width: 4px;
  height: 100%;
  left: calc(50% - 2px);
  position: absolute;

  &:before,
  &:after {
    content: "";
    position: absolute;
    left: 0;
    width: 4px;
    height: 4px;
    border-radius: 50px;
    background-color: #fff;
  }

  &:before {
    top: 12%;
  }

  &:after {
    bottom: 12%;
  }

  &:before,
  &:after {
    width: auto;
    height: auto;
    font-size: 30px;
    line-height: 30px;
    border-radius: 0;
    background: transparent;
    color: #fff;
    font-weight: 100;
    font-family: "Roboto Slab", serif;
    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.35);
  }

  &:before {
    top: 8.5%;
  }

  &:after {
    bottom: 8.5%;
    transform: rotate(180deg);
  }

  &:before {
    content: "N";
    left: -13px;
    font-weight: 400;
  }

  &:after {
    content: "S";
    left: -9px;
  }
`;

const CompassMark = styled.div`
    &,
    &--direction-h,
    &--direction-v {
        width: 4px;
        height: 100%;
        left: calc(50% - 2px);
        position: absolute;

        &:before,
        &:after {
            content: '';
            position: absolute;
            left: 0;
            width: 4px;
            height: 4px;
            border-radius: 50px;
            background-color: #fff;
        }

        &:before {
            top: 12%;
        }

        &:after {
            bottom: 12%;
        }
    }

    &--direction-h,
    &--direction-v {
        &:before,
        &:after {
            width: auto;
            height: auto;
            font-size: 42px;
            line-height: 42px;
            border-radius: 0;
            background: transparent;
            color: #fff;
            font-weight: 100;
            font-family: 'Roboto Slab', serif;
            text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.35);
        }

        &:before {
            top: 8.5%;
        }

        &:after {
            bottom: 8.5%;
            transform: rotate(180deg);
        }
    }

    &--direction-h {
        &:before {
            content: 'N';
            left: -13px;
            font-weight: 400;
        }

        &:after {
            content: 'S';
            left: -9px;
        }
    }

    &--direction-v {
        transform: rotate(90deg);

        &:before {
            content: 'E';
            left: -11px;
        }

        &:after {
            content: 'W';
            left: -18px;
        }
    }
}

@for $i from 1 through 11 {
    $val: 15 * $i;

    @if $i > 5 {
        $val: $val + 15;
    }

    .compass__mark:nth-child(#{$i}) {
        transform: rotate(#{$val}deg);
    }
`;

const CompassArrowContainer = styled.div`
  width: 48.076923%;
  height: 48.076923%;
  border-radius: 50%;
  background-color: #20292e;
  box-sizing: border-box;
  top: 50%;
  left: 50%;
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  transition: transform 0.3s ease;
`;

const CompassArrow = styled.div`
  width: 71%;
  height: 71%;
  margin-left: 14.5%;
  margin-top: 14.5%;
  background-color: #be4d45;
  border-radius: 0 50% 50% 50%;
  box-sizing: border-box;
  transform: rotate(45deg);
`;

const CompassLabels = styled.div`
  position: absolute;
  z-index: 1;
  background-color: ${accentColor};
  width: 57.6%;
  height: 57.6%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  box-sizing: border-box;
  box-shadow: inset 0 0 5px 3px rgba(0, 0, 0, 0.05);
  padding-top: 34px;

  & > span {
    display: inline-block;
    width: 100%;
    text-align: center;
    color: #fff6de;
    font-family: "Roboto Slab", serif;

    &:first-child {
      font-size: 56px;
      line-height: 42px;
      font-weight: 400;

      text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.35);
    }

    &:last-child {
      font-size: 38px;
      line-height: 42px;
      font-weight: 100;
      padding-left: 6px;
      opacity: 0.9;
      text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.25);
    }
  }
`;

const CompassSpan = styled.span`
  display: inline-block;
  width: 100%;
  text-align: center;
  color: #fff6de;
  font-family: "Roboto Slab", serif;

  &:first-child {
    font-size: 56px;
    line-height: 42px;
    font-weight: 400;

    text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.35);
  }

  &:last-child {
    font-size: 38px;
    line-height: 42px;
    font-weight: 100;
    padding-left: 6px;
    opacity: 0.9;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.25);
  }
`;

const Sup = styled.span`
  line-height: 18px;
  font-size: 24px;
`;
