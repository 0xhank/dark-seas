import React from "react";
import styled from "styled-components";

const WINDOW_CLASSNAME = "react-ui-window";

export const Cell: React.FC<{ style: React.CSSProperties }> = ({ children, style }) => {
  return (
    <Container style={style} className={WINDOW_CLASSNAME}>
      {children}
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  color: #fff;
`;
