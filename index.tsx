import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

enum Actions {
  gameLoop,
}

type GameState = {
  score: number;
  level: number;
};

type GameStore = [GameState, React.Dispatch<Actions>];

const CANVAS = {
  width: 320,
  height: 640,
};

const createState = (): GameState => ({
  score: 0,
  level: 0,
});

const drawBoard = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
};

const reducer = (state: GameState, action: Actions) => {
  return state;
};

const GameBoard = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawBoard(ctx);
  }, [canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS.width}
      height={CANVAS.height}
    />
  );
};

const Theme: React.FC = (props) => {
  React.useEffect(() => {
    const { style } = document.body;
    style.backgroundColor = "#282c34";
    style.color = "white";
  });
  return <Fragment>{props.children}</Fragment>;
};

const GameContext = React.createContext<GameStore>([createState(), () => {}]);

const GameStateProvider: React.FC = (props) => {
  const store = React.useReducer(reducer, createState());
  return (
    <GameContext.Provider value={store}>{props.children}</GameContext.Provider>
  );
};

export const App = () => (
  <Theme>
    <GameStateProvider>
      <Container style={{ textAlign: "center" }} fluid>
        <h3 className="m-3">Tetris</h3>
        <Row>
          <Col md={4}></Col>
          <Col md={4}>
            <GameBoard />
          </Col>
          <Col md={4}></Col>
        </Row>
      </Container>
    </GameStateProvider>
  </Theme>
);

ReactDOM.render(<App />, document.querySelector("#root"));
