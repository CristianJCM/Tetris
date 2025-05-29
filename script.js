const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
ctx.scale(30, 30);  // Escalamos para que cada bloque sea 20x20 px

const arenaWidth = 12;
const arenaHeight = 20;

let isPaused = false;
let isGameOver = false;

function playerHardDrop() {
  while (!collide(arena, player)) {
    player.pos.y++;
  }
  player.pos.y--; // una fila atrás para evitar colisión
  merge(arena, player);
  playerReset();
  arenaSweep();
  updateScore();
  dropCounter = 0;
}

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

const arena = createMatrix(arenaWidth, arenaHeight);

function createPiece(type) {
  switch(type) {
    case 'T':
      return [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ];
    case 'O':
      return [
        [2, 2],
        [2, 2],
      ];
    case 'L':
      return [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3],
      ];
    case 'J':
      return [
        [0, 4, 0],
        [0, 4, 0],
        [4, 4, 0],
      ];
    case 'I':
      return [
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
      ];
    case 'S':
      return [
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0],
      ];
    case 'Z':
      return [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
      ];
  }
}

const colors = [
  null,
  '#FF0D72', // T
  '#0DC2FF', // O
  '#0DFF72', // L
  '#F538FF', // J
  '#FF8E0D', // I
  '#FFE138', // S
  '#3877FF', // Z
];

let dropCounter = 0;
let dropInterval = 1000; // caida cada 1s

let lastTime = 0;
let score = 0;

const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
};

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y=0; y < m.length; y++) {
    for(let x=0; x < m[y].length; x++) {
      if (m[y][x] !== 0 &&
          (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
            return true;
          }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function rotate(matrix, dir) {
  for (let y=0; y < matrix.length; y++) {
    for (let x=0; x < y; x++) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while(collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerReset() {
  const pieces = 'TJLOSZI';
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (arenaWidth / 2 | 0) - (player.matrix[0].length / 2 | 0);
  if (collide(arena, player)) {
    isGameOver = true;
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('pause-message').style.display = 'none';
    document.getElementById('restart-message').style.display = 'block';
  return;
}


}


function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length -1; y >= 0; y--) {
    for (let x=0; x < arena[y].length; x++) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    score += rowCount * 10;
    rowCount *= 2;
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawMatrix(arena, {x: 0, y: 0});
  drawMatrix(player.matrix, player.pos);
}

function update(time = 0) {
  if (isPaused || isGameOver) return; // 👈 Pausa o Game Over

  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }
  draw();
  requestAnimationFrame(update);
}

function updateScore() {
  document.getElementById('score').textContent = score;
}

document.addEventListener('keydown', event => {
  switch(event.key) {
    case 'ArrowLeft':
      if (!isPaused && !isGameOver) playerMove(-1);
      break;
    case 'ArrowRight':
      if (!isPaused && !isGameOver) playerMove(1);
      break;
    case 'ArrowDown':
      if (!isPaused && !isGameOver) playerDrop();
      break;
    case 'ArrowUp':
      if (!isPaused && !isGameOver) playerRotate(1);
      break;
    case ' ':
      if (!isPaused && !isGameOver) {
        event.preventDefault();
        playerHardDrop();
      }
      break;
    case 'Escape':
      if (!isGameOver) {
        isPaused = !isPaused;
        const pauseMsg = document.getElementById('pause-message');
        pauseMsg.style.display = isPaused ? 'block' : 'none';
        if (!isPaused) update(); // Reanudar
      }
      break;
    case 'r':
    case 'R':
      if (isGameOver) {
        arena.forEach(row => row.fill(0));
        score = 0;
        updateScore();
        isGameOver = false;
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('restart-message').style.display = 'none';
        playerReset();
        update();
      }
      break;
  }
});



playerReset();
updateScore();
update();
