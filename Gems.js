//Gems v1.0
//Sterowanie:
//-- strzałki
//-- SHIFT - zaznaczenie

const COLORS = ['red', 'green', 'blue', 'yellow', 'purple', 'orange']


const WIDTH = 400;
const HIGHT = 600;

const GAME_SIZE = 8;
const PIXEL_SIZE = WIDTH / GAME_SIZE;

var gems = [];
var bombs = [];
var nextState = 'START';


var isGemSelected = false;
var isKeyPressed = false;
var isSwaped = false;

var userPos;
var swapPos;

var activeGemsCount = 0;
const MAX_GEMS_NUMBER = GAME_SIZE * GAME_SIZE;

var points = 0;


function setup() {
  createCanvas(WIDTH, HIGHT);

  frameRate(30)

  userPos = createVector(4, 4);
  swapPos = createVector(0, 0);

  for (let i = 0; i < GAME_SIZE; i++) {
    gems[i] = [];
    bombs[i] = [];
    for (let j = 0; j < GAME_SIZE; j++) {
      gems[i][j] = new Gem(random(COLORS));
      gems[i][j].active = false;
    }
  }
}

function draw() {


  update();

  switch (nextState) {
    case 'START':
      activeGemsCount = 0;

      for (let i = 0; i < GAME_SIZE; i++)
        for (let j = 0; j < GAME_SIZE; j++)
          if (gems[i][j] != null)
            if(gems[i][j].active) activeGemsCount++;

      if (activeGemsCount < MAX_GEMS_NUMBER)
        nextState = 'SORT';
      else
        nextState = 'CHECK';

      break;
    case 'USER':
      if (isKeyPressed) {
        if (keyCode == SHIFT) isGemSelected = !isGemSelected;

        if (isGemSelected) {
          swapPos.x = userPos.x;
          swapPos.y = userPos.y;
        }

        if (keyCode == LEFT_ARROW) userPos.x--;
        if (keyCode == RIGHT_ARROW) userPos.x++;
        if (keyCode == UP_ARROW) userPos.y--;
        if (keyCode == DOWN_ARROW) userPos.y++;
        limitPos(userPos);

        if (isGemSelected && (swapPos.x != userPos.x || swapPos.y != userPos.y)) 
          nextState = 'SWAP';
      }

      isKeyPressed = false;


      break;

    case 'SWAP':
      frameRate(5);
      isSwaped = false;
      gemsSwap(swapPos, userPos);

      if (isGemSelected) {
        nextState = 'CHECK';
        isSwaped = true;
      } else {
        nextState = 'START';
        userSwap();
      }
      break;

    case 'CHECK':
      frameRate(30);
      var gemCount = 1;
      var foundGemsToRemove = false;

      //vertical check
      for (let i = 0; i < GAME_SIZE; i++) {
        for (let j = 0, k = 1; j < GAME_SIZE - 1; j++, k = j + 1) {
          while (k < GAME_SIZE && gems[i][j].color == gems[i][k].color) {
            gemCount++;
            k++;
          }

          if (gemCount >= 3) {
            for (let z = j; z < k; z++)
              gems[i][z].destroy = true;


            //Create BOMB
            if (gemCount >= 4) {
              let bombPos;
              if (userPos.x == i && userPos.y >= j && userPos.y < k)
                bombPos = userPos.y;
              else
                bombPos = int(random(j, k - 1));

              bombs[i][bombPos] = new Bomb(gems[i][j].color, gemCount, 'V');
            }

            j = k;
            foundGemsToRemove = true;
          }



          gemCount = 1;
        }
      }

      //horizontal
      for (let j = 0; j < GAME_SIZE; j++) {
        for (let i = 0, k = 1; i < GAME_SIZE - 1; i++, k = i + 1) {

          while (k < GAME_SIZE && gems[i][j].color == gems[k][j].color) {
            gemCount++;
            k++;
          }

          if (gemCount >= 3) {
            for (let z = i; z < k; z++) {
              gems[z][j].destroy = true;
            }

            //Create BOMB
            if (gemCount >= 4) {
              let bombPos;
              if (userPos.y == j && userPos.x >= i && userPos.x < k)
                bombPos = userPos.x;
              else
                bombPos = int(random(i, k - 1));

              bombs[bombPos][j] = new Bomb(gems[i][j].color, gemCount, 'H');
            }

            i = k;
            foundGemsToRemove = true;
          }

          gemCount = 1;
        }
      }

      isGemSelected = false;

      if (foundGemsToRemove) {
        nextState = 'EXPLODE';
        isSwaped = false;
      } else if (isSwaped)
        nextState = 'SWAP';
      else
        nextState = 'USER';

      break;

    case 'EXPLODE':
      frameRate(1);
      for (let i = 0; i < GAME_SIZE; i++) {
        for (let j = 0; j < GAME_SIZE; j++) {
          if (gems[i][j].type == 'BOMB' && gems[i][j].destroy == true && gems[i][j].explode == false)
            explode(i, j);
        }
      }

      nextState = 'DESTROY';
      break;

    case 'DESTROY':
      frameRate(5);
      for (let i = 0; i < GAME_SIZE; i++)
        for (let j = 0; j < GAME_SIZE; j++)
          if(gems[i][j].destroy){
            gems[i][j].active = false;
            points += 10;
          
          }
      
      
      nextState = 'ADD_BOMBS';
      break;

    case 'ADD_BOMBS':
      frameRate(10);
      for (let i = 0; i < GAME_SIZE; i++)
        for (let j = 0; j < GAME_SIZE; j++)
          if (bombs[i][j]) {
            gems[i][j] = bombs[i][j];
            bombs[i][j] = null;
          }

      nextState = 'SORT';
      break;

    case 'SORT':
      frameRate(10);
      for (let j = GAME_SIZE - 2; j >= 0; j--) {
        for (let i = 0; i < GAME_SIZE; i++) {
          if (gems[i][j].active && !gems[i][j + 1].active)
            posSwap(i, j, i, j + 1);
        }
      }
      nextState = 'FILL';

      break;
    case 'FILL':
      frameRate(10);

      for (let j = 0; j < GAME_SIZE; j++)
        if (!gems[j][0].active)
          gems[j][0] = new Gem(random(COLORS));

      nextState = 'START';
      break;

  }
}


function explode(x, y) {
  let color = gems[x][y].color;
  gems[x][y].explode = true;
  points += 5;

  switch (gems[x][y].bombType) {
    case 'SQUARE':
      for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
          if (gems[i] != null) {
            if (gems[i][j] != null) {
              gems[i][j].destroy = true;
              drawX(i, j, color);
            }
          }
        }
      }
      break;

    case 'H_LINE':
      for (let i = 0; i < GAME_SIZE; i++) {
        gems[i][y].destroy = true;
        drawX(i, y, color);
      }
      break;

    case 'V_LINE':
      for (let j = 0; j < GAME_SIZE; j++) {
        gems[x][j].destroy = true;
        drawX(x, j, color);
      }
      break;

    case 'X_LINE':
      let b1 = y - x;
      let b2 = y + x;

      for (let x = 0; x < GAME_SIZE; x++) {
        if (gems[x][x + b1] != null) {
          gems[x][x + b1].destroy = true;
          drawX(x, x + b1, color);
        }

        if (gems[x][-x + b2] != null) {
          gems[x][-x + b2].destroy = true;
          drawX(x, -x + b2, color);
        }
      }
      break;

    case 'PLUS':
      for (let i = x - 1; i <= x + 1; i++)
        for (let j = 0; j < GAME_SIZE; j++) 
          if (gems[i] != null)
          if (gems[i][j] != null) {
            gems[i][j].destroy = true;
            drawX(i, j, color);
          }
      
      for (let i = y - 1; i <= y + 1; i++)
        for (let j = 0; j < GAME_SIZE; j++)
          if (gems[j]!= null)
          if (gems[j][i] != null) {
            gems[j][i].destroy = true;
            drawX(j, i, color);
          }
      
      break;

    case 'ALL':
      for (let i = 0; i < GAME_SIZE; i++)
        for (let j = 0; j < GAME_SIZE; j++) {
          gems[i][j].destroy = true;
          drawX(i, j, color);
        }

      break;
  }

  if (gems[x][y].bombType != 'ALL')
    for (let i = 0; i < GAME_SIZE; i++)
      for (let j = 0; j < GAME_SIZE; j++)
        if (gems[i][y].type == 'BOMB' && gems[i][j].destroy && !gems[i][j].explode)
          explode(i, j);
}



function drawX(i, j, color) {
  push();
  strokeWeight(3);
  stroke(color);
  line(i * PIXEL_SIZE, j * PIXEL_SIZE, (i + 1) * PIXEL_SIZE, (j + 1) * PIXEL_SIZE);
  line((i + 1) * PIXEL_SIZE, j * PIXEL_SIZE, i * PIXEL_SIZE, (j + 1) * PIXEL_SIZE);
  pop();
}



function update() {
  background(200);
  drawUser();
  drawSwap();
  drawGems();
  drawPanel();

}

function drawGems() {
  for (let i = 0; i < GAME_SIZE; i++) {
    for (let j = 0; j < GAME_SIZE; j++) {
      if (gems[i][j].active)
        gems[i][j].draw(i, j);
    }
  }
}

function drawUser() {
  push()
  strokeWeight(2);
  if(nextState == 'USER')
    stroke(color('black'));
  else
    stroke(color('white'));
  noFill();
  //fill(color('white'))

  rect(userPos.x * PIXEL_SIZE, userPos.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
  pop()
}

function drawSwap() {
  push()
  noStroke();

  if (isGemSelected) {
    fill(color('gray'))
    rect(swapPos.x * PIXEL_SIZE, swapPos.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
  }
  pop()
}

function limitPos(pos) {
  if (pos.x < 0) pos.x = 0;
  if (pos.x > GAME_SIZE - 1) pos.x = GAME_SIZE - 1;
  if (pos.y < 0) pos.y = 0;
  if (pos.y > GAME_SIZE - 1) pos.y = GAME_SIZE - 1;
}

function keyPressed() {
  isKeyPressed = true;
}

function posSwap(x1, y1, x2, y2) {
  let temp = gems[x1][y1];
  gems[x1][y1] = gems[x2][y2];
  gems[x2][y2] = temp;
}

function gemsSwap(a, b) {
  posSwap(a.x, a.y, b.x, b.y);
}

function userSwap() {
  let c = userPos;
  userPos.x = swapPos.x;
  userPos.y = swapPos.y;
  swapPos.x = c.x;
  swapPos.y = c.y;
}


function rand(x, y) {
  return int(random(x, y + 1))
}
