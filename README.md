# tetris-react-typescript

Simple Atari Tetris game implemented with the Canvas API in React and TypeScript.

## Further Exploration

- Game Controls
  - Show game controls 
- Game States
  - Don't start the game automatically and support pausing and restarting
  

## Getting Started

The following steps are how to build and run the development server.

### Building the repo

```
npm run build
```

### Running the development server
To run the development mode in live reload.
```
npm run start
```

## Project Setup
Below are instructions on how to setup a similar project.

### Initialize the project
```
mkdir my-react-app && cd my-react-app
git init && npm init -y
```
### Install dev dependencies
This project only uses npm for development dependencies
```
npm i -D  @types/react @types/react-dom react react-dom typescript parcel-bundler react-bootstrap bootstrap @types/react-bootstrap eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint-plugin-prettier
```
### Initialize TypeScript
```
tsc --init --jsx react --sourceMap --esModuleInterop --lib es6,dom
```
### Add the following commands to package.json
```json
"start": "parcel index.html",
"build": "parcel build index.html"
```
### Happy coding
See the Getting Started section to start the project in development mode.