import { action, observable } from "mobx";
import { Observable } from "rxjs";
import { Layers } from "../../../../types";
import { GridConfiguration, UIComponent } from "./types";

export const EngineStore = observable({
  UIComponents: new Map<string, UIComponent>(),
});

export const registerUIComponent = action(
  <T>(
    id: string,
    gridConfig: GridConfiguration,
    requirement: (layers: Layers) => Observable<T>,
    Render: React.FC<NonNullable<T>>
  ) => {
    EngineStore.UIComponents.set(id, { requirement, Render: Render as React.FC, gridConfig });
  }
);
