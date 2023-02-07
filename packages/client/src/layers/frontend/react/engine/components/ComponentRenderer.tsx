import { useStream } from "@latticexyz/std-client";
import { filterNullishValues } from "@latticexyz/utils";
import { observer } from "mobx-react-lite";
import React, { useMemo } from "react";
import styled from "styled-components";
import { Layers } from "../../../../../types";
import { useEngineStore, useLayers } from "../hooks";
import { GridConfiguration, UIComponent } from "../types";
import { Cell } from "./Cell";

const UIGrid = styled.div`
  display: grid;
  overflow: hidden;
  grid-template-columns: repeat(12, 8.33%);
  grid-template-rows: repeat(12, 8.33%);
  position: absolute;
  left: 0;
  top: 0;
  height: 100vh;
  width: 100vw;
  pointer-events: none;
  z-index: 100;
`;

const UIComponentContainer: React.FC<{ gridConfig: GridConfiguration }> = React.memo(({ children, gridConfig }) => {
  const { colStart, colEnd, rowStart, rowEnd } = gridConfig;

  return (
    <Cell
      style={{
        gridRowStart: rowStart,
        gridRowEnd: rowEnd,
        gridColumnStart: colStart,
        gridColumnEnd: colEnd,
      }}
    >
      {children}
    </Cell>
  );
});

export const UIComponentRenderer: React.FC<{ layers: Layers; id: string; uiComponent: UIComponent }> = React.memo(
  ({ layers, id, uiComponent: { requirement, Render, gridConfig } }) => {
    const req = useMemo(() => requirement(layers), [requirement, layers]);
    const state = useStream(req);
    if (!state) return null;

    return (
      <UIComponentContainer key={`component-${id}`} gridConfig={gridConfig}>
        {<Render {...state} />}
      </UIComponentContainer>
    );
  }
);

export const ComponentRenderer: React.FC = observer(() => {
  const { UIComponents } = useEngineStore();
  const layers = useLayers();
  if (!layers) return null;

  return (
    <UIGrid
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseOver={(e) => e.stopPropagation()}
    >
      {filterNullishValues(
        // Iterate through all registered UIComponents
        // and return those whose requirements are fulfilled
        [...UIComponents.entries()].map(([id, uiComponent]) => {
          return (
            <UIComponentRenderer layers={layers} id={id} key={`componentRenderer-${id}`} uiComponent={uiComponent} />
          );
        })
      )}
    </UIGrid>
  );
});
