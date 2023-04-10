import { useState } from "react";
import styled, { css } from "styled-components";
import { Title, colors } from "../../styles/global";

export type Tab = {
  name: string;
  component: React.ReactNode;
};
export function TabbedView({ tabs }: { tabs: Tab[] }) {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  return (
    <>
      <TabButtonContainer>
        {tabs.map((tab, i) => (
          <TabButton key={i} active={i === selectedTabIndex} onClick={() => setSelectedTabIndex(i)}>
            {tab.name}
          </TabButton>
        ))}
      </TabButtonContainer>
      <Title> {tabs[selectedTabIndex].name}</Title>
      {tabs[selectedTabIndex].component}
    </>
  );
}

const TabButton = styled.div<{ active: boolean }>`
  ${({ active }: { active: boolean }) => css`
    color: ${colors.brown};
    text-decoration: none;
    border-radius: 3px;
    border: 1px solid ${colors.darkBrown};
    padding: 4px 8px;
    margin-right: 4px;
    margin-left: 4px;
    flex-grow: 1;
    text-align: center;
    cursor: pointer;
    user-select: none;

    &:first-child {
      margin-left: 0;
    }

    &:last-child {
      margin-right: 0;
    }

    &:hover {
      background-color: ${colors.lightGold};

      ${active &&
      css`
        background-color: ${colors.lightGold};
      `}
    }

    ${active &&
    css`
      cursor: default;
      color: ${colors.darkBrown};
      background-color: ${colors.gold};
    `}
  `}
`;

const TabButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
`;
