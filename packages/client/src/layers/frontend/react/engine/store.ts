import { action, observable } from "mobx";
import { Observable } from "rxjs";
import { SetupResult } from "../../../../setupMUD";
import { GridConfiguration, UIComponent } from "./types";

export const EngineStore = observable({
  UIComponents: new Map<string, UIComponent>(),
});

export const registerUIComponent = action(
  <T>(
    id: string,
    gridConfig: GridConfiguration,
    requirement: (MUD: SetupResult) => Observable<T>,
    Render: React.FC<NonNullable<T>>
  ) => {
    EngineStore.UIComponents.set(id, { requirement, Render: Render as React.FC, gridConfig });
  }
);
