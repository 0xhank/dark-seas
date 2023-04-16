import React, { useCallback, useState } from "react";
import styled, { css } from "styled-components";
import { colors } from "../../../../styles/global";
import { Table } from "./Table";

const TableCell = styled.div`
  padding: 2px 4px;
`;

const Header = styled(TableCell)`
  ${({ isActive, isReverse }: { isActive: boolean; isReverse: boolean }) => css`
    padding: 2px 4px;
    font-weight: normal;
    font-size: 1.25rem;
    color: ${colors.darkGold};
    user-select: none;
    cursor: pointer;
    ${isActive && "text-decoration: underline;"}
    ${isActive && "font-weight: bold;"}

    &:hover {
      text-decoration: underline;
    }
  `}
`;

export function SortableTable<T>({
  rows,
  headers,
  columns,
  sortFunctions,
  alignments,
  paginated,
}: {
  rows: T[];
  headers: React.ReactNode[];
  columns: Array<(t: T, i: number) => React.ReactNode>;
  sortFunctions: Array<(a: T, b: T) => number>;
  alignments?: Array<"r" | "c" | "l">;
  paginated?: boolean;
}) {
  const [sortByColumn, setSortByColumn] = useState<number | undefined>(undefined);
  const [reverse, setReverse] = useState(false);
  const sortFn = sortByColumn !== undefined ? sortFunctions[sortByColumn] : undefined;
  const sortedRows = [...rows];

  if (sortFn !== undefined) {
    sortedRows.sort((a, b) => {
      if (reverse) {
        return sortFn(b, a);
      } else {
        return sortFn(a, b);
      }
    });
  }

  // when you click on a column, cycle between three states:
  // 1) sort by that column
  // 2) sort by the reverse of that column
  // 3) sort by nothing
  const onColumnTitleClicked = useCallback(
    (columnIndex: number) => {
      if (sortByColumn === columnIndex) {
        if (reverse) {
          setReverse(false);
          setSortByColumn(undefined);
        } else {
          setReverse(true);
        }
      } else {
        setSortByColumn(columnIndex);
        setReverse(false);
      }
    },
    [sortByColumn, reverse]
  );

  return (
    <Table
      paginated={paginated}
      headerStyle={{
        backgroundColor: colors.tan,
        position: "sticky",
        top: 0,
        display: "relative",
        zIndex: 101,
      }}
      rows={sortedRows}
      headers={headers.map((originalHeader, i) => (
        <Header
          key={i}
          onClick={() => onColumnTitleClicked(i)}
          isActive={sortByColumn === i}
          isReverse={reverse && sortByColumn === i}
        >
          {originalHeader}
        </Header>
      ))}
      columns={columns}
      alignments={alignments}
    />
  );
}
