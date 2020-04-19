import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

enum Actions {
  gameLoop,
}

type Color = string;

type Matrix = Color[][];

type Tetromino = {
  matrix: Matrix;
  col: number;
  row: number;
};

type GameState = {
  score: number;
  level: number;
  board: Matrix;
  piece: Tetromino;
  nextPiece: Tetromino;
};

type GameStore = [GameState, React.Dispatch<Actions>];

const GRID = 32;
const WALLSIZE = 1;

const CANVAS = {
  width: 320,
  height: 640,
};

type TETROMINOCODES = "T" | "I" | "J" | "L" | "O" | "S" | "Z";

// how to draw each tetromino
// @see https://tetris.fandom.com/wiki/SRS
const TETROMINOS = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

// color of each tetromino
const COLORS = {
  I: "cyan",
  O: "yellow",
  T: "purple",
  S: "green",
  Z: "red",
  J: "blue",
  L: "orange",
};

const tetrominoToMatrix = (tetromino: number[][], color: Color): Matrix => {
  return tetromino.map((row) => row.map((col) => (col ? color : "")));
};

function getProperty<T, K extends keyof T>(o: T, propertyName: K): T[K] {
  return o[propertyName]; // o[propertyName] is of type T[K]
}

const createPiece = (): Matrix => {
  const keys = Object.keys(TETROMINOS);
  const pieceIndex = Math.floor(Math.random() * keys.length);
  const key = keys[pieceIndex] as TETROMINOCODES;
  return tetrominoToMatrix(
    getProperty(TETROMINOS, key),
    getProperty(COLORS, key)
  );
};

const createRow = () => Array(10).fill("");

const createState = (): GameState => ({
  score: 0,
  level: 0,
  piece: { matrix: createPiece(), col: 3, row: -1 },
  nextPiece: { matrix: createPiece(), col: 1, row: 0 },
  board: Array(20).fill(createRow())
});

/**
 *
 * Drawing Functions
 *
 */

const drawTetronminoBlock = (
  ctx: CanvasRenderingContext2D,
  tetromino: Tetromino,
  col: number,
  row: number
): void => {
  ctx.fillStyle = tetromino.matrix[row][col];

  // drawing 1 px smaller than the grid creates a grid effect
  const x = (tetromino.col + col) * GRID;
  const y = (tetromino.row + row) * GRID;
  const w = GRID - 1;
  const h = GRID - 1;
  ctx.fillRect(x, y, w, h);
};

const drawTetronmino = (
  ctx: CanvasRenderingContext2D,
  tetromino: Tetromino
): void => {
  tetromino.matrix.forEach((cols, row) => {
    cols.forEach((on, col) => {
      if (on) drawTetronminoBlock(ctx, tetromino, col, row);
    });
  });
};

const fillBoard = (ctx: CanvasRenderingContext2D, board: Matrix): void => {
  board.forEach((cols, row) => {
    cols.forEach((on, col) => {
      if (on) {
        ctx.fillStyle = on;
        // drawing 1 px smaller than the grid creates a grid effect
        ctx.fillRect(col * GRID, row * GRID, GRID - 1, GRID - 1);
      }
    });
  });
};

const drawWalls = (ctx: CanvasRenderingContext2D) => {
      // draw walls
  ctx.fillStyle = "lightgrey";
  ctx.fillRect(0, 0, CANVAS.width, WALLSIZE);
  ctx.fillRect(0, 0, WALLSIZE, CANVAS.height);
  ctx.fillRect(CANVAS.width - WALLSIZE, 0, WALLSIZE, CANVAS.height);
  ctx.fillRect(0, CANVAS.height - WALLSIZE, CANVAS.width, WALLSIZE);
}

const drawBoard = (ctx: CanvasRenderingContext2D, state: GameState) => {
  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);

  fillBoard(ctx, state.board);
  drawTetronmino(ctx, state.piece);
  drawWalls(ctx);
};

const reducer = (state: GameState, action: Actions) => {
  return state;
};

const GameBoard = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [state] = React.useContext(GameContext);

  React.useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawBoard(ctx, state);
  }, [canvasRef, state]);

  return <canvas ref={canvasRef} width={CANVAS.width} height={CANVAS.height} />;
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
