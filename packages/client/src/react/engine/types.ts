import React from "react";
import { Observable } from "rxjs";
import { SetupResult } from "../../../../setupMUD";

export type GridConfiguration = {
  gridColumnStart: number;
  gridColumnEnd: number;
  gridRowStart: number;
  gridRowEnd: number;
};

export interface UIComponent<T = unknown> {
  gridConfig: GridConfiguration;
  requirement(MUD: SetupResult): Observable<T>;
  Render: React.FC<NonNullable<T>>;
}
