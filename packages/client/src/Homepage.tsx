import { useParams } from "react-router-dom";
import styled from "styled-components";
import { BackgroundImg, Link } from "./styles/global";

export function HomePage({ showButton }: { showButton?: boolean }) {
  const { worldAddress, block } = useParams<{ worldAddress: string | undefined; block: string | undefined }>();
  return (
    <Container>
      <BackgroundImg style={{ zIndex: -1 }} />
      <div
        style={{
          height: "79%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "19px",
        }}
      >
        <Logo src="/img/ds-logo.png" />
        {showButton && (
          <div style={{ display: "flex", width: "100%", gap: "6px" }}>
            <Link to={`/app`} state={{ worldAddress, block }}>
              Enter
            </Link>
          </div>
        )}
      </div>
    </Container>
  );
}

const Logo = styled.img`
  height: 74%;
`;
const Container = styled.div`
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: -1;
  left: -1;  
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
  justify-items: center;
  grid-gap: 15px;
  z-index: 500;
x
  pointer-events: all;
  color: white;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: hsla(0, 0%, 0%, 0.6);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
`;
