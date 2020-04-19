import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

enum Actions {
  pauseGame,
  resumeGame,
  startGame,
  moveDown,
  moveRight,
  moveLeft,
  rotatePiece,
  gameCycle,
}

enum KeyCode {
  spaceBar = 32,
  leftArrow = 37,
  upArrow = 38,
  rightArrow = 39,
  downArrow = 40,
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
  gravity: number;
};

type GameStore = [GameState, React.Dispatch<Actions>];
type GameTransducer = (state: GameState) => GameState;

const FPS = 60;
const GRID = 32;

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

const transform = (state: GameState, transducer: GameTransducer) =>
  transducer(state);

function getProperty<T, K extends keyof T>(o: T, propertyName: K): T[K] {
  return o[propertyName]; // o[propertyName] is of type T[K]
}

const tetrominoToMatrix = (tetromino: number[][], color: Color): Matrix => {
  return tetromino.map((row) => row.map((col) => (col ? color : "")));
};

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

// Tetris gravity system
// @see https://tetris.fandom.com/wiki/Tetris_Worlds#Gravity
const calcSpeedCurve = (level: number): number => {
  return Math.pow(0.8 - (level - 1) * 0.007, level - 1) * FPS;
};

const createState = (): GameState => ({
  score: 0,
  level: 1,
  piece: { matrix: createPiece(), col: 3, row: -1 },
  nextPiece: { matrix: createPiece(), col: 1, row: 0 },
  board: Array(20).fill(createRow()),
  gravity: calcSpeedCurve(1),
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

const drawBoard = (
  ctx: CanvasRenderingContext2D,
  board: Matrix,
  piece: Tetromino
) => {
  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);

  fillBoard(ctx, board);
  drawTetronmino(ctx, piece);
};

/**
 *
 * Transducers
 *
 */

const checkBoundary = (
  matrix: Matrix,
  predict: (block: Color, row: number, col: number) => boolean
): boolean => {
  // return false if any block in the piece is out of bounds or collides with a line on the board
  return matrix.reduce<boolean>(
    (prev, row, rowIdx) =>
      row.reduce(
        (prev, block, colIdx) => prev && predict(block, rowIdx, colIdx),
        prev
      ),
    true
  );
};

const isValidMove = (
  board: Matrix,
  matrix: Matrix,
  pieceRow: number,
  pieceCol: number
): boolean => {
  const blockInBounds = (block: Color, row: number, col: number): boolean => {
    return (
      !block ||
      (row + pieceRow < 20 && col + pieceCol < 10 && col + pieceCol >= 0)
    );
  };
  const didNotCollide = (block: Color, row: number, col: number): boolean => {
    return (
      !block || row + pieceRow < 0 || !board[row + pieceRow][col + pieceCol]
    );
  };
  return (
    checkBoundary(matrix, blockInBounds) && checkBoundary(matrix, didNotCollide)
  );
};

const moveDown = (state: GameState): GameState => {
  const { piece, board } = state;
  const row = piece.row + 1;
  return isValidMove(board, piece.matrix, row, piece.col)
    ? {
        ...state,
        piece: { ...piece, row },
      }
    : state;
};

const moveRight = (state: GameState): GameState => {
  const { piece, board } = state;
  const col = piece.col + 1;
  return isValidMove(board, piece.matrix, piece.row, col)
    ? {
        ...state,
        piece: { ...piece, col },
      }
    : state;
};

const moveLeft = (state: GameState): GameState => {
  const { piece, board } = state;
  const col = piece.col - 1;
  return isValidMove(board, piece.matrix, piece.row, col)
    ? {
        ...state,
        piece: { ...piece, col },
      }
    : state;
};

const rotatePiece = (state: GameState): GameState => {
  const { piece, board } = state;

  // rotate an NxN matrix 90deg
  const rotate = (matrix: Matrix): Matrix => {
    const N = matrix.length - 1;
    return matrix.map((row, i) => row.map((val, j) => matrix[N - j][i]));
  };

  const matrix = rotate(piece.matrix);
  return isValidMove(board, matrix, piece.row, piece.col)
    ? {
        ...state,
        piece: { ...state.piece, matrix },
      }
    : state;
};

/**
 *
 * End turn transforms
 *
 */
const placePiece = (state: GameState): GameState => {
  const { board, piece } = state;
  const rows: Matrix = board.map((row) => [...row]);
  if (piece) {
    piece.matrix.forEach((row, rowIdx) =>
      row.forEach((on, colIdx) => {
        if (on) rows[rowIdx + piece.row][colIdx + piece.col] = on;
      })
    );
  }
  return {
    ...state,
    board: rows,
  };
};

const findFullRows = (lines: Matrix): number[] => {
  return lines.reduce((prev, row, rowIdx) => {
    const rowCount = row.reduce((count, on) => (on ? count + 1 : count), 0);
    return rowCount === 10 ? prev.concat([rowIdx]) : prev;
  }, [] as number[]);
};

const pickNewPiece = (): Matrix => {
  const keys = Object.keys(TETROMINOS);
  const pieceIndex = Math.floor(Math.random() * keys.length);
  const key = keys[pieceIndex] as TETROMINOCODES;
  return tetrominoToMatrix(
    getProperty(TETROMINOS, key),
    getProperty(COLORS, key)
  );
};

const selectNextGamePiece = (state: GameState): GameState => {
  const matrix = state.nextPiece?.matrix || pickNewPiece();

  return {
    ...state,
    piece: { matrix, col: 3, row: -1 },
    nextPiece: {
      matrix: pickNewPiece(),
      col: 1,
      row: 0,
    },
  };
};

const nextTurn = (state: GameState): GameState => {
  return [placePiece, selectNextGamePiece].reduce(transform, state);
};

const gameCycle = (state: GameState): GameState => {
  const newState = moveDown(state);
  return newState.piece.row === state.piece.row ? nextTurn(state) : newState;
};

const reducer = (state: GameState, action: Actions) => {
  return action === Actions.moveDown
    ? moveDown(state)
    : action === Actions.moveLeft
    ? moveLeft(state)
    : action === Actions.moveRight
    ? moveRight(state)
    : action === Actions.rotatePiece
    ? rotatePiece(state)
    : action === Actions.gameCycle
    ? gameCycle(state)
    : state;
};

const keyHandler = (dispatch: React.Dispatch<Actions>) => (
  e: KeyboardEvent
) => {
  if (e.keyCode === KeyCode.leftArrow) dispatch(Actions.moveLeft);
  else if (e.keyCode === KeyCode.upArrow) dispatch(Actions.rotatePiece);
  else if (e.keyCode === KeyCode.rightArrow) dispatch(Actions.moveRight);
  else if (e.keyCode === KeyCode.downArrow) dispatch(Actions.moveDown);
};

const NextPiece: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [state] = React.useContext(GameContext);

  React.useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) drawBoard(ctx, [], state.nextPiece);
    }
  }, [canvasRef, state]);

  return (
    <Fragment>
      <div>
        <b>Next Piece</b>
        <br />
      </div>
      <br />
      <canvas
        ref={canvasRef}
        width="160"
        height="160"
        style={{ color: "white" }}
      ></canvas>
    </Fragment>
  );
};

const GameBoard = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [state, dispatch] = React.useContext(GameContext);

  React.useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawBoard(ctx, state.board, state.piece);
  }, [canvasRef, state]);

  // use animation frames to dispatch the game loop based on gravity
  React.useEffect(() => {
    let frameId: number;
    let loopCount = state.gravity;
    const loop = () => {
      frameId = requestAnimationFrame(loop);
      loopCount = loopCount > 0 ? loopCount - 1 : state.gravity;
      if (loopCount === 0) dispatch(Actions.gameCycle);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [canvasRef]);

  // setup keyboard handlers
  React.useEffect(() => {
    const keyDown = keyHandler(dispatch);
    document.addEventListener("keydown", keyDown);
    return () => {
      document.removeEventListener("keydown", keyDown);
    };
  });

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS.width}
      height={CANVAS.height}
      style={{ border: "1px solid white" }}
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
          <Col md={4} style={{ textAlign: "left" }}>
            <NextPiece />
          </Col>
        </Row>
      </Container>
    </GameStateProvider>
  </Theme>
);

ReactDOM.render(<App />, document.querySelector("#root"));
