var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");
var game, snake, foodManager;
 
game = {
  score: 0,
  coins: 0,
  fps: 5,
  over: true,
  paused: false,
  message: 'Press Space to Start',
  powerups: {
    invincible: false,
    invincibleEndTime: 0
  },
 
  start: function () {
    game.over = false;
    game.paused = false;
    game.message = null;
    game.score = 0;
    game.coins = 0;
    game.fps = 5;
    game.powerups.invincible = false;
    snake.init();
    foodManager.init();
    updateCoinsDisplay();
  },
 
  stop: function () {
    game.over = true;
    game.message = 'GAME OVER';
  },
 
  drawScore: function () {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
      scoreElement.textContent = 'Errors: ' + game.score;
    }
  },
 
  drawMessage: function () {
    if (game.message !== null) {
      context.fillStyle = '#00F';
      context.strokeStyle = '#FFF';
      context.font = (canvas.height / 12) + 'px Impact';
      context.textAlign = 'center';
      context.fillText(game.message, canvas.width / 2, canvas.height / 2);
      context.strokeText(game.message, canvas.width / 2, canvas.height / 2);
    }
 
    if (game.paused) {
      context.fillStyle = '#00F';
      context.strokeStyle = '#FFF';
      context.font = (canvas.height / 12) + 'px Impact';
      context.textAlign = 'center';
      context.fillText('Game Paused', canvas.width / 2, canvas.height / 2 - 20);
      context.strokeText('Game Paused', canvas.width / 2, canvas.height / 2 - 20);
      context.fillText('Press Space to Continue', canvas.width / 2, canvas.height / 2 + 60);
      context.strokeText('Press Space to Continue', canvas.width / 2, canvas.height / 2 + 60);
    }
  },
 
  resetCanvas: function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }
};
 
snake = {
  size: 50,
  direction: 'left',
  sections: [],
  headImage: new Image(),
  bodyImage: new Image(),
  tailImage: new Image(),
 
  init: function () {
    snake.sections = [];
    snake.direction = 'left';
    const startX = Math.floor(canvas.width / 2 / snake.size) * snake.size + snake.size / 2;
    const startY = Math.floor(canvas.height / 2 / snake.size) * snake.size + snake.size / 2;
 
    snake.sections.push({ x: startX - 2 * snake.size, y: startY, type: 'tail' });
    snake.sections.push({ x: startX - snake.size, y: startY, type: 'body' });
    snake.sections.push({ x: startX, y: startY, type: 'head' });
 
    snake.headImage.src = 'head.png';
    snake.bodyImage.src = 'body.png';
    snake.tailImage.src = 'tail.png';
  },
 
  move: function () {
  if (!game.over && !game.paused) {
      const head = snake.sections[0];
      let newX = head.x;
      let newY = head.y;

      switch (snake.direction) {
          case 'up': newY -= snake.size; break;
          case 'down': newY += snake.size; break;
          case 'left': newX -= snake.size; break;
          case 'right': newX += snake.size; break;
      }

      // Handle wall collisions differently when invincible
      if (game.powerups.invincible) {
          if (newX < snake.size / 2) {
              newX = snake.size / 2;
              snake.direction = 'right'; // Bounce right
          } else if (newX >= canvas.width - snake.size / 2) {
              newX = canvas.width - snake.size / 2 - 1;
              snake.direction = 'left'; // Bounce left
          }
          
          if (newY < snake.size / 2) {
              newY = snake.size / 2;
              snake.direction = 'down'; // Bounce down
          } else if (newY >= canvas.height - snake.size / 2) {
              newY = canvas.height - snake.size / 2 - 1;
              snake.direction = 'up'; // Bounce up
          }
      } else if (snake.isCollision(newX, newY)) {
          game.stop();
          return;
      }

      snake.sections.unshift({ x: newX, y: newY, type: 'head' });
      if (snake.sections.length > 1) {
        snake.sections[1].type = 'body';
      }
 
      let ateFood = foodManager.checkCollision(newX, newY);
      if (ateFood) {
        game.score++;
        if (game.fps < 30) game.fps++;
 
        if (game.score % 10 === 0) {
          foodManager.increaseFoodCount();
        }
 
        foodManager.set();
      } else {
        snake.sections.pop();
      }
 
      if (snake.sections.length > 1) {
        snake.sections[snake.sections.length - 1].type = 'tail';
      }
    }
  },
 
  draw: function () {
    for (let i = 0; i < snake.sections.length; i++) {
      const part = snake.sections[i];
      let img;
      let flipX = false;
      let flipY = false;
      let rotation = 0;
 
      if (game.score >= 10) {
        context.filter = 'saturate(3) hue-rotate(-120deg)';
      } else {
        context.filter = 'none';
      }

      switch (part.type) {
        case 'head':
          img = snake.headImage;
          switch (snake.direction) {
            case 'right': flipX = true; break;
            case 'up': rotation = 90; break;
            case 'down': rotation = -90; break;
          }
          snake.drawRotatedImage(img, part.x, part.y, flipX, flipY, rotation);
          break;
 
        case 'body':
          img = snake.bodyImage;
          const prev = snake.sections[i - 1];
          const dx = part.x - prev.x;
          const dy = part.y - prev.y;
          if (dx > 0) { flipX = true; rotation = 0; }
          else if (dx < 0) { flipX = false; rotation = 0; }
          else if (dy < 0) { rotation = -90; }
          else if (dy > 0) { rotation = 90; }
          snake.drawRotatedImage(img, part.x, part.y, flipX, flipY, rotation);
          break;
 
        case 'tail':
          img = snake.tailImage;
          if (i > 0) {
            const prev = snake.sections[i - 1];
            const dx = part.x - prev.x;
            const dy = part.y - prev.y;
            if (dx > 0) rotation = 0;
            else if (dx < 0) { flipX = true; rotation = 0; }
            else if (dy < 0) rotation = -90;
            else if (dy > 0) rotation = 90;
          }
          snake.drawRotatedImage(img, part.x, part.y, flipX, flipY, rotation);
          break;
      }

      context.filter = 'none';
    }
  },
 
  drawRotatedImage: function (image, x, y, flipX, flipY, rotation) {
    context.save();
    context.translate(x, y);
    context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    context.rotate(rotation * Math.PI / 180);
    context.drawImage(image, -snake.size / 2, -snake.size / 2, snake.size, snake.size);
    context.restore();
  },
 
  isCollision: function (x, y) {
    // When invincible, only check for self-collisions
    if (game.powerups.invincible) {
        return snake.sections.some((s, i) => i !== 0 && s.x === x && s.y === y);
    }
    
    // Normal collision detection
    if (
        x < snake.size / 2 || x >= canvas.width ||
        y < snake.size / 2 || y >= canvas.height
    ) return true;

    return snake.sections.some((s, i) => i !== 0 && s.x === x && s.y === y);
}
};
 
foodManager = {
  foods: [],
  count: 1,
  image: new Image(),
 
  init: function () {
    this.count = 1;
    this.image.src = 'error.png';
    this.set();
  },
 
  set: function () {
    this.foods = [];
    let gridCols = canvas.width / snake.size;
    let gridRows = canvas.height / snake.size;
 
    while (this.foods.length < this.count) {
      let x = Math.floor(Math.random() * gridCols) * snake.size + snake.size / 2;
      let y = Math.floor(Math.random() * gridRows) * snake.size + snake.size / 2;
 
      let occupied = snake.sections.some(s => s.x === x && s.y === y) ||
                     this.foods.some(f => f.x === x && f.y === y);
 
      if (!occupied) {
        this.foods.push({ x, y });
      }
    }
  },
 
  draw: function () {
    for (let food of this.foods) {
      context.drawImage(this.image, food.x - snake.size / 2, food.y - snake.size / 2, snake.size, snake.size);
    }
  },
 
  checkCollision: function (x, y) {
    for (let i = 0; i < this.foods.length; i++) {
      if (Math.round(this.foods[i].x) === Math.round(x) && Math.round(this.foods[i].y) === Math.round(y)) {
        this.foods.splice(i, 1);
        game.coins++;
        updateCoinsDisplay();
        return true;
      }
    }
    return false;
  },
 
  increaseFoodCount: function () {
    this.count++;
  }
};
 
// Shop and Powerup Functions
function buyPowerup(type) {
  if (game.over) return;
  
  const cost = 5;
  if (game.coins >= cost) {
    game.coins -= cost;
    updateCoinsDisplay();
    
    if (type === 'invincible') {
      game.powerups.invincible = true;
      game.powerups.invincibleEndTime = Date.now() + 5000;
    }
  }
}

function updateCoinsDisplay() {
  const coinsElement = document.getElementById('coins');
  if (coinsElement) {
    coinsElement.textContent = 'Coins: ' + game.coins;
  }
}

function checkPowerups() {
  if (game.powerups.invincible && Date.now() > game.powerups.invincibleEndTime) {
    game.powerups.invincible = false;
  }
}

var inverseDirection = {
  'up': 'down',
  'left': 'right',
  'right': 'left',
  'down': 'up'
};
 
var keys = {
  up: [38, 75, 87],
  down: [40, 74, 83],
  left: [37, 65, 72],
  right: [39, 68, 76],
  start_game: [13, 32]
};
 
function getKey(value) {
  for (var key in keys) {
    if (keys[key].includes(value)) return key;
  }
  return null;
}
 
var CanPressButton = true;
 
addEventListener("keydown", function (e) {
  var lastKey = getKey(e.keyCode);
  if (['up', 'down', 'left', 'right'].includes(lastKey) &&
    lastKey !== inverseDirection[snake.direction] && CanPressButton) {
    snake.direction = lastKey;
    CanPressButton = false;
  } else if (lastKey === 'start_game' && game.over) {
    game.start();
  } else if (lastKey === 'start_game' && !game.over) {
    game.paused = !game.paused;
  }
}, false);
 
var requestAnimationFrame = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame;
 
function loop() {
  game.resetCanvas();
  
  if (!game.over && !game.paused) {
    checkPowerups();
    snake.move();
    foodManager.draw();
    snake.draw();
  }

  game.drawScore();
  game.drawMessage();
  
  if (game.powerups.invincible) {
    context.fillStyle = 'rgba(0, 255, 255, 0.1)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    const timeLeft = Math.ceil((game.powerups.invincibleEndTime - Date.now()) / 1000);
    context.fillStyle = '#00F';
    context.strokeStyle = '#FFF';
    context.font = (canvas.height / 15) + 'px Impact';
    context.textAlign = 'center';
    context.fillText('INVINCIBLE: ' + timeLeft + 's', canvas.width / 2, canvas.height - 20);
    context.strokeText('INVINCIBLE: ' + timeLeft + 's', canvas.width / 2, canvas.height - 20);
}

  setTimeout(function () {
    requestAnimationFrame(loop);
    CanPressButton = true;
  }, 1000 / game.fps);
}
 
requestAnimationFrame(loop);