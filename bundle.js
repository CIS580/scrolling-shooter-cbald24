(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/**
 * @module BulletPool
 * A class for managing bullets in-game
 * We use a Float32Array to hold our bullet info,
 * as this creates a single memory buffer we can
 * iterate over, minimizing cache misses.
 * Values stored are: positionX, positionY, velocityX,
 * velocityY in that order.
 */
module.exports = exports = AABullets;

var cur;
/**
 * @constructor BulletPool
 * Creates a BulletPool of the specified size
 * @param {uint} size the maximum number of bullets to exits concurrently
 */
function AABullets(maxSize) {
  this.pool = new Float32Array(4 * maxSize);
  this.end = 0;
  this.max = maxSize;
}

/**
 * @function add
 * Adds a new bullet to the end of the BulletPool.
 * If there is no room left, no bullet is created.
 * @param {Vector} position where the bullet begins
 * @param {Vector} velocity the bullet's velocity
*/
AABullets.prototype.add = function(position, velocity) {
  if(this.end < this.max) {
    this.pool[4*this.end] = position.x;
    this.pool[4*this.end+1] = position.y;
    this.pool[4*this.end+2] = velocity.x;
    this.pool[4*this.end+3] = velocity.y;
    this.end++;
  }
}

/**
 * @function update
 * Updates the bullet using its stored velocity, and
 * calls the callback function passing the transformed
 * bullet.  If the callback returns true, the bullet is
 * removed from the pool.
 * Removed bullets are replaced with the last bullet's values
 * and the size of the bullet array is reduced, keeping
 * all live bullets at the front of the array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {function} callback called with the bullet's position,
 * if the return value is true, the bullet is removed from the pool
 */
AABullets.prototype.update = function(elapsedTime, callback, player) {
  for(var i = 0; i < this.end; i++){
    // Move the bullet
    this.pool[4*i] += this.pool[4*i+2];
    this.pool[4*i+1] += this.pool[4*i+3];
    cur = {x: this.pool[4*i], y: this.pool[4*i+1], width: 2, height: 2, type: 'aa'};
    if(player.checkHit(cur))
    {
        this.pool[4*i] = -100;
        this.pool[4*i+1] = -100;
    }
    // If a callback was supplied, call it
    if(callback && callback({
      x: this.pool[4*i],
      y: this.pool[4*i+1]
    })) {
      // Swap the current and last bullet if we
      // need to remove the current bullet
      this.pool[4*i] = this.pool[4*(this.end-1)];
      this.pool[4*i+1] = this.pool[4*(this.end-1)+1];
      this.pool[4*i+2] = this.pool[4*(this.end-1)+2];
      this.pool[4*i+3] = this.pool[4*(this.end-1)+3];
      // Reduce the total number of bullets by 1
      this.end--;
      // Reduce our iterator by 1 so that we update the
      // freshly swapped bullet.
      i--;
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
AABullets.prototype.render = function(elapsedTime, ctx) {
  // Render the bullets as a single path
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "grey";
  for(var i = 0; i < this.end; i++) {
    ctx.moveTo(this.pool[4*i], this.pool[4*i+1]);
    ctx.arc(this.pool[4*i], this.pool[4*i+1], 2, 0, 2*Math.PI);
  }
  ctx.fill();
  ctx.restore();
}
},{}],2:[function(require,module,exports){
"use strict";


const Explosion = require('./explosion');
const AABullets = require('./aaBullet');
const Vector = require('./vector');
const Camera = require('./camera');
const BULLET_SPEED = 3;
const cd = 4000;
/**
 * @module Player
 * A class representing a player's helicopter
 */
module.exports = exports = AntiAir;

function AntiAir(loc)
{
    this.pos = {
        x: loc.x,
        y: loc.y
    };
    this.sprite = new Image();
    this.sprite.src = "assets/aa.png";
    this.image = {x: 48, y: 31};
    this.width = 23;
    this.height = 22;
    this.explo = new Explosion(3);
    this.timer = 0;
    this.bullets = new AABullets (4);
}

AntiAir.prototype.update = function(elapsedTime, player, camera)
{
    this.explo.update(elapsedTime);
    this.timer -= elapsedTime;
    if(this.timer < 0)
    {
        this.fire({x: player.pos.x, y: player.pos.y});
        this.timer = cd;
    }
    this.bullets.update(elapsedTime, function(bullet){
    if(!camera.onScreen(bullet)) return true;
    return false;
    }, player);
}

AntiAir.prototype.render= function(elapsedTime, ctx)
{
    ctx.drawImage(this.sprite, this.image.x, this.image.y, this.width, this.height, this.pos.x, this.pos.y, this.width, this.height);
    this.explo.render(elapsedTime, ctx);
    this.bullets.render(elapsedTime, ctx);
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

AntiAir.prototype.checkHit= function(cur)
{
    if(this.pos.x + this.width - 1 < cur.x || this.pos.x + 1 > cur.x + cur.width || this.pos.y + this.height - 1 < cur.y || this.pos.y + 1 > cur.y + cur.height)
    {
        return false;
    }
    this.explo.emit({x: this.pos.x + 10, y: this.pos.y + 14});
    this.pos = {x: -200, y: -200};
    return true;
}

AntiAir.prototype.fire = function(direction)
{
   
    var xDiff = direction.x - this.pos.x;
    var yDiff = direction.y - this.pos.y;
    var angle = Math.atan2(xDiff, yDiff);
    var velocity = {
        x: (Math.sin(angle)),
        y: Math.cos(angle)
    };
    velocity = Vector.scale(velocity, BULLET_SPEED);
    this.bullets.add(this.pos, velocity);
}


},{"./aaBullet":1,"./camera":6,"./explosion":8,"./vector":19}],3:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Game = require('./game');
const Vector = require('./vector');
const Camera = require('./camera');
const Player = require('./player');
const BulletPool = require('./bullet_pool');
const MisslePool = require('./missle_pool');
const WideMissle = require('./wide_missle');
const LaserPool = require('./laser_pool');
const PowerUp = require('./powerUp');
const GoldEnemy = require('./goldEnemy');
const EnemyPlane = require('./enemyPlane');
const AntiAir = require('./anti_air');
const Spinner = require('./spinner');
const Turret = require('./turret');
const fireCD = 1500;

/* Global variables */
var canvas = document.getElementById('screen');
var health = 100;
var game = new Game(canvas, update, render);
var input = {
  up: false,
  down: false,
  left: false,
  right: false,
  fire: false
}
var fired = false;
var fTimer = 0;
var camera = new Camera(canvas);
var bullets = new BulletPool(10);
var missles = new MisslePool(3);
var wides = new WideMissle(3);
var lasers = new LaserPool(3);
var player = new Player(bullets, missles, wides, lasers);
var kama = new GoldEnemy({x: 200, y: 0});
var strafe = new EnemyPlane({x:100, y: 30});
var aa = new AntiAir({x: 350, y: 350});
var spin = new Spinner({x: 700, y:650});
var turret = new Turret({x:950, y: 500});
var enemies = [];
enemies.push(spin);
enemies.push(kama);
enemies.push(strafe);
enemies.push(aa);
enemies.push(turret);
var lasPow = new PowerUp('lsr', {x: 600, y: 600});
var missPow = new PowerUp('miss', {x: 100, y: 100});
var widePow = new PowerUp('wide', {x: 100, y: 600});
/**
 * @function onkeydown
 * Handles keydown events
 */
window.onkeydown = function(event) {
  switch(event.key) {
    case "ArrowUp":
    case "w":
      input.up = true;
      event.preventDefault();
      break;
    case "ArrowDown":
    case "s":
      input.down = true;
      event.preventDefault();
      break;
    case "ArrowLeft":
    case "a":
      input.left = true;
      event.preventDefault();
      break;
    case "ArrowRight":
    case "d":
      input.right = true;
      event.preventDefault();
      break;
    case "q":
      input.fire = true; 
      event.preventDefault();
      break;
  }
}

/**
 * @function onkeyup
 * Handles keydown events
 */
window.onkeyup = function(event) {
  switch(event.key) {
    case "ArrowUp":
    case "w":
      input.up = false;
      event.preventDefault();
      break;
    case "ArrowDown":
    case "s":
      input.down = false;
      event.preventDefault();
      break;
    case "ArrowLeft":
    case "a":
      input.left = false;
      event.preventDefault();
      break;
    case "ArrowRight":
    case "d":
      input.right = false;
      event.preventDefault();
      break;
    case "q":
      input.fire = false;
      event.preventDefault();
      break;
  }
}

/**
 * @function masterLoop
 * Advances the game in sync with the refresh rate of the screen
 * @param {DOMHighResTimeStamp} timestamp the current time
 */
var masterLoop = function(timestamp) {
  game.loop(timestamp);
  window.requestAnimationFrame(masterLoop);
}
masterLoop(performance.now());

/**
 * @function update
 * Updates the game state, moving
 * game objects and handling interactions
 * between them.
 * @param {DOMHighResTimeStamp} elapsedTime indicates
 * the number of milliseconds passed since the last frame.
 */
function update(elapsedTime) {

  // update the player
  player.update(elapsedTime, input);
  if(input.fire && fTimer <=0)
  {
    switch(player.wState)
    {
      case "bullets":
        player.fireBullet({x: 0, y: -5});
        break;
      case "missle":
        player.fireMissle({x: 0, y: -5});
        break;
      case "laser":
        player.fireWide({x: 0, y: -3});
        break;
      case "wide":
        player.fireLaser({x: 0, y: -3});
        break;
    }
    
    fTimer = fireCD;
  } 
  else{
    fTimer -= elapsedTime;
  }
  // update the camera
  camera.update(player.position);
  if(checkCollision(player, missPow))
  {
    player.wState = "missle";
  }
  if(checkCollision(player, lasPow))
  {
    player.wState = "laser";
  }
  if(checkCollision(player, widePow))
  {
    player.wState = "wide";
  }
  // Update bullets
  bullets.update(elapsedTime, function(bullet){
    if(!camera.onScreen(bullet)) return true;
    return false;
  }, enemies);

  missles.update(elapsedTime, function(missle){
    if(!camera.onScreen(missle)) return true;
    return false;
  }, enemies);

  wides.update(elapsedTime, function(wide){
    if(!camera.onScreen(wide)) return true;
    return false;
  }, enemies);

  lasers.update(elapsedTime, function(laser){
    if(!camera.onScreen(laser)) return true;
    return false;
  }, enemies);
  strafe.fire();
  aa.update(elapsedTime, player, camera);
  kama.update(elapsedTime, player);
  spin.update(elapsedTime, player);
  turret.update(elapsedTime, player, camera);
  strafe.update(elapsedTime, player, camera);
}

/**
  * @function render
  * Renders the current game state into a back buffer.
  * @param {DOMHighResTimeStamp} elapsedTime indicates
  * the number of milliseconds passed since the last frame.
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function render(elapsedTime, ctx) {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 1024, 786);

  // TODO: Render background

  // Transform the coordinate system using
  // the camera position BEFORE rendering
  // objects in the world - that way they
  // can be rendered in WORLD cooridnates
  // but appear in SCREEN coordinates
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  renderWorld(elapsedTime, ctx);
  ctx.restore();

  // Render the GUI without transforming the
  // coordinate system
  renderGUI(elapsedTime, ctx);
}

/**
  * @function renderWorld
  * Renders the entities in the game world
  * IN WORLD COORDINATES
  * @param {DOMHighResTimeStamp} elapsedTime
  * @param {CanvasRenderingContext2D} ctx the context to render to
  */
function renderWorld(elapsedTime, ctx) {
    // Render the bullets
    ctx.fillStyle = 'rgb(130, 80, 45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    bullets.render(elapsedTime, ctx);
    missles.render(elapsedTime, ctx);
    wides.render(elapsedTime, ctx);
    lasers.render(elapsedTime, ctx);
    // Render the player
    kama.render(elapsedTime, ctx);
    strafe.render(elapsedTime, ctx);
    aa.render(elapsedTime, ctx);
    spin.render(elapsedTime, ctx);
    player.render(elapsedTime, ctx);
    turret.render(elapsedTime, ctx);
    lasPow.render(ctx);
    missPow.render(ctx);
    widePow.render(ctx);
}

/**
  * @function renderGUI
  * Renders the game's GUI IN SCREEN COORDINATES
  * @param {DOMHighResTimeStamp} elapsedTime
  * @param {CanvasRenderingContext2D} ctx
  */
function renderGUI(elapsedTime, ctx) {
  player.renderHealth(ctx);
}


function checkCollision(thing1, thing2)
{
  if(thing1.pos.x + thing1.width - 1 < thing2.pos.x || thing1.pos.x + 1 > thing2.pos.x + thing2.width || thing1.pos.y + thing1.height - 1 < thing2.pos.y || thing1.pos.y + 1 > thing2.pos.y + thing2.height)
  {
    return false;
  }
  return true;
}
},{"./anti_air":2,"./bullet_pool":5,"./camera":6,"./enemyPlane":7,"./game":9,"./goldEnemy":10,"./laser_pool":12,"./missle_pool":13,"./player":14,"./powerUp":15,"./spinner":17,"./turret":18,"./vector":19,"./wide_missle":20}],4:[function(require,module,exports){
"use strict";

/**
 * @module BulletPool
 * A class for managing bullets in-game
 * We use a Float32Array to hold our bullet info,
 * as this creates a single memory buffer we can
 * iterate over, minimizing cache misses.
 * Values stored are: positionX, positionY, velocityX,
 * velocityY in that order.
 */
module.exports = exports = BadBullets;

var cur;
/**
 * @constructor BulletPool
 * Creates a BulletPool of the specified size
 * @param {uint} size the maximum number of bullets to exits concurrently
 */
function BadBullets(maxSize) {
  this.pool = new Float32Array(4 * maxSize);
  this.end = 0;
  this.max = maxSize;
}

/**
 * @function add
 * Adds a new bullet to the end of the BulletPool.
 * If there is no room left, no bullet is created.
 * @param {Vector} position where the bullet begins
 * @param {Vector} velocity the bullet's velocity
*/
BadBullets.prototype.add = function(position, velocity) {
  if(this.end < this.max) {
    this.pool[4*this.end] = position.x;
    this.pool[4*this.end+1] = position.y;
    this.pool[4*this.end+2] = velocity.x;
    this.pool[4*this.end+3] = velocity.y;
    this.end++;
  }
}

/**
 * @function update
 * Updates the bullet using its stored velocity, and
 * calls the callback function passing the transformed
 * bullet.  If the callback returns true, the bullet is
 * removed from the pool.
 * Removed bullets are replaced with the last bullet's values
 * and the size of the bullet array is reduced, keeping
 * all live bullets at the front of the array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {function} callback called with the bullet's position,
 * if the return value is true, the bullet is removed from the pool
 */
BadBullets.prototype.update = function(elapsedTime, callback, player) {
  for(var i = 0; i < this.end; i++){
    // Move the bullet
    this.pool[4*i] += this.pool[4*i+2];
    this.pool[4*i+1] += this.pool[4*i+3];
    cur = {x: this.pool[4*i], y: this.pool[4*i+1], width: 2, height: 2, type: 'bullets'};
    if(player.checkHit(cur))
    {
        this.pool[4*i] = -100;
        this.pool[4*i+1] = -100;
    }
    // If a callback was supplied, call it
    if(callback && callback({
      x: this.pool[4*i],
      y: this.pool[4*i+1]
    })) {
      // Swap the current and last bullet if we
      // need to remove the current bullet
      this.pool[4*i] = this.pool[4*(this.end-1)];
      this.pool[4*i+1] = this.pool[4*(this.end-1)+1];
      this.pool[4*i+2] = this.pool[4*(this.end-1)+2];
      this.pool[4*i+3] = this.pool[4*(this.end-1)+3];
      // Reduce the total number of bullets by 1
      this.end--;
      // Reduce our iterator by 1 so that we update the
      // freshly swapped bullet.
      i--;
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
BadBullets.prototype.render = function(elapsedTime, ctx) {
  // Render the bullets as a single path
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "black";
  for(var i = 0; i < this.end; i++) {
    ctx.moveTo(this.pool[4*i], this.pool[4*i+1]);
    ctx.arc(this.pool[4*i], this.pool[4*i+1], 2, 0, 2*Math.PI);
  }
  ctx.fill();
  ctx.restore();
}

},{}],5:[function(require,module,exports){
"use strict";

/**
 * @module BulletPool
 * A class for managing bullets in-game
 * We use a Float32Array to hold our bullet info,
 * as this creates a single memory buffer we can
 * iterate over, minimizing cache misses.
 * Values stored are: positionX, positionY, velocityX,
 * velocityY in that order.
 */
module.exports = exports = BulletPool;

var cur;
/**
 * @constructor BulletPool
 * Creates a BulletPool of the specified size
 * @param {uint} size the maximum number of bullets to exits concurrently
 */
function BulletPool(maxSize) {
  this.pool = new Float32Array(4 * maxSize);
  this.end = 0;
  this.max = maxSize;
}

/**
 * @function add
 * Adds a new bullet to the end of the BulletPool.
 * If there is no room left, no bullet is created.
 * @param {Vector} position where the bullet begins
 * @param {Vector} velocity the bullet's velocity
*/
BulletPool.prototype.add = function(position, velocity) {
  if(this.end < this.max) {
    this.pool[4*this.end] = position.x;
    this.pool[4*this.end+1] = position.y;
    this.pool[4*this.end+2] = velocity.x;
    this.pool[4*this.end+3] = velocity.y;
    this.end++;
  }
}

/**
 * @function update
 * Updates the bullet using its stored velocity, and
 * calls the callback function passing the transformed
 * bullet.  If the callback returns true, the bullet is
 * removed from the pool.
 * Removed bullets are replaced with the last bullet's values
 * and the size of the bullet array is reduced, keeping
 * all live bullets at the front of the array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {function} callback called with the bullet's position,
 * if the return value is true, the bullet is removed from the pool
 */
BulletPool.prototype.update = function(elapsedTime, callback, enemies) {
  for(var i = 0; i < this.end; i++){
    // Move the bullet
    this.pool[4*i] += this.pool[4*i+2];
    this.pool[4*i+1] += this.pool[4*i+3];
    cur = {x: this.pool[4*i], y: this.pool[4*i+1], width: 2, height: 2};
    for(var j = 0; j<enemies.length; j++)
    {
      enemies[j].checkHit(cur);
    }
    // If a callback was supplied, call it
    if(callback && callback({
      x: this.pool[4*i],
      y: this.pool[4*i+1]
    })) {
      // Swap the current and last bullet if we
      // need to remove the current bullet
      this.pool[4*i] = this.pool[4*(this.end-1)];
      this.pool[4*i+1] = this.pool[4*(this.end-1)+1];
      this.pool[4*i+2] = this.pool[4*(this.end-1)+2];
      this.pool[4*i+3] = this.pool[4*(this.end-1)+3];
      // Reduce the total number of bullets by 1
      this.end--;
      // Reduce our iterator by 1 so that we update the
      // freshly swapped bullet.
      i--;
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
BulletPool.prototype.render = function(elapsedTime, ctx) {
  // Render the bullets as a single path
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = "black";
  for(var i = 0; i < this.end; i++) {
    ctx.moveTo(this.pool[4*i], this.pool[4*i+1]);
    ctx.arc(this.pool[4*i], this.pool[4*i+1], 2, 0, 2*Math.PI);
  }
  ctx.fill();
  ctx.restore();
}

},{}],6:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Vector = require('./vector');

/**
 * @module Camera
 * A class representing a simple camera
 */
module.exports = exports = Camera;

/**
 * @constructor Camera
 * Creates a camera
 * @param {Rect} screen the bounds of the screen
 */
function Camera(screen) {
  this.x = 0;
  this.y = 0;
  this.width = screen.width;
  this.height = screen.height;
}

/**
 * @function update
 * Updates the camera based on the supplied target
 * @param {Vector} target what the camera is looking at
 */
Camera.prototype.update = function(target) {
  // TODO: Align camera with player
}

/**
 * @function onscreen
 * Determines if an object is within the camera's gaze
 * @param {Vector} target a point in the world
 * @return true if target is on-screen, false if not
 */
Camera.prototype.onScreen = function(target) {
  return (
     target.x > this.x &&
     target.x < this.x + this.width &&
     target.y > this.y &&
     target.y < this.y + this.height
   );
}

/**
 * @function toScreenCoordinates
 * Translates world coordinates into screen coordinates
 * @param {Vector} worldCoordinates
 * @return the tranformed coordinates
 */
Camera.prototype.toScreenCoordinates = function(worldCoordinates) {
  return Vector.subtract(worldCoordinates, this);
}

/**
 * @function toWorldCoordinates
 * Translates screen coordinates into world coordinates
 * @param {Vector} screenCoordinates
 * @return the tranformed coordinates
 */
Camera.prototype.toWorldCoordinates = function(screenCoordinates) {
  return Vector.add(screenCoordinates, this);
}

},{"./vector":19}],7:[function(require,module,exports){
"use strict";


const Explosion = require('./explosion');
const BadBullets = require('./bad_bullets');
const Vector = require('./vector');
const Camera = require('./camera');
const BULLET_SPEED = 5;
/**
 * @module Player
 * A class representing a player's helicopter
 */
module.exports = exports = EnemyPlane;

function EnemyPlane(loc)
{
    this.pos = {
        x: loc.x,
        y: loc.y
    };
    this.sprite = new Image();
    this.sprite.src = "assets/planes.png";
    this.image = {x: 26, y: 56};
    this.width = 21;
    this.height = 28;
    this.explo = new Explosion(3);
    this.state = 'right';
    this.bullets = new BadBullets(10);
}

EnemyPlane.prototype.update = function(elapsedTime, player, camera)
{
    if(this.state == 'right')
    {
        this.pos.x += 3;
        if(this.pos.x > 1000)
        {
            this.state = "left";
        }
    }
    else{
        this.pos.x -= 3;
        if(this.pos.x <25)
        {
            this.state = 'right';
        }
    }
    this.explo.update(elapsedTime);
    this.bullets.update(elapsedTime, function(bullet){
        if(!camera.onScreen(bullet)) return true;
        return false;
    }, player);
}

EnemyPlane.prototype.render= function(elapsedTime, ctx)
{
    ctx.drawImage(this.sprite, this.image.x, this.image.y, this.width, this.height, this.pos.x, this.pos.y, this.width, this.height);
    this.explo.render(elapsedTime, ctx);
    this.bullets.render(elapsedTime, ctx);
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

EnemyPlane.prototype.checkHit= function(cur)
{
    if(this.pos.x + this.width - 1 < cur.x || this.pos.x + 1 > cur.x + cur.width || this.pos.y + this.height - 1 < cur.y || this.pos.y + 1 > cur.y + cur.height)
    {
        return false;
    }
    this.explo.emit({x: this.pos.x + 10, y: this.pos.y + 14});
    this.pos = {x: -200, y: -200};
    return true;
}

EnemyPlane.prototype.fire = function()
{
    //var pos = Vector.add(this.pos, {x:30, y:30});
    var velocity = Vector.scale(Vector.normalize({x: 0, y: 3}), BULLET_SPEED);
    this.bullets.add(this.pos, velocity);
}
},{"./bad_bullets":4,"./camera":6,"./explosion":8,"./vector":19}],8:[function(require,module,exports){
"use strict";

/**
 * @module SmokeParticles
 * A class for managing a particle engine that
 * emulates a smoke trail
 */
module.exports = exports = Explosion;

/**
 * @constructor SmokeParticles
 * Creates a SmokeParticles engine of the specified size
 * @param {uint} size the maximum number of particles to exist concurrently
 */
function Explosion(maxSize) {
  this.pool = new Float32Array(3 * maxSize);
  this.start = 0;
  this.end = 0;
  this.wrapped = false;
  this.max = maxSize;
}

/**
 * @function emit
 * Adds a new particle at the given position
 * @param {Vector} position
*/
Explosion.prototype.emit = function(position) {
  if(this.end != this.max) {
    this.pool[3*this.end] = position.x;
    this.pool[3*this.end+1] = position.y;
    this.pool[3*this.end+2] = 0.0;
    this.end++;
  } else {
    this.pool[3] = position.x;
    this.pool[4] = position.y;
    this.pool[5] = 0.0;
    this.end = 1;
  }
}

/**
 * @function update
 * Updates the particles
 * @param {DOMHighResTimeStamp} elapsedTime
 */
Explosion.prototype.update = function(elapsedTime) {
  function updateParticle(i) {
    this.pool[3*i+2] += elapsedTime;
    if(this.pool[3*i+2] > 2000) this.start = i;
  }
  var i;
  if(this.wrapped) {
    for(i = 0; i < this.end; i++){
      updateParticle.call(this, i);
    }
    for(i = this.start; i < this.max; i++){
      updateParticle.call(this, i);
    }
  } else {
    for(i = this.start; i < this.end; i++) {
      updateParticle.call(this, i);
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
Explosion.prototype.render = function(elapsedTime, ctx) {
  function renderParticle(i){
    var alpha = 1 - (this.pool[3*i+2] / 1000);
    var radius = 0.1 * this.pool[3*i+2];
    if(radius > 24) radius = 24;
    ctx.beginPath();
    ctx.arc(
      this.pool[3*i],   // X position
      this.pool[3*i+1], // y position
      radius, // radius
      0,
      2*Math.PI
    );
    ctx.fillStyle = 'rgba(255, 125, 0, ' + alpha + ')';
    ctx.fill();
  }

  // Render the particles individually
  var i;
  if(this.wrapped) {
    for(i = 0; i < this.end; i++){
      renderParticle.call(this, i);
    }
    for(i = this.start; i < this.max; i++){
      renderParticle.call(this, i);
    }
  } else {
    for(i = this.start; i < this.end; i++) {
      renderParticle.call(this, i);
    }
  }
}
},{}],9:[function(require,module,exports){
"use strict";

/**
 * @module exports the Game class
 */
module.exports = exports = Game;

/**
 * @constructor Game
 * Creates a new game object
 * @param {canvasDOMElement} screen canvas object to draw into
 * @param {function} updateFunction function to update the game
 * @param {function} renderFunction function to render the game
 */
function Game(screen, updateFunction, renderFunction) {
  this.update = updateFunction;
  this.render = renderFunction;

  // Set up buffers
  this.frontBuffer = screen;
  this.frontCtx = screen.getContext('2d');
  this.backBuffer = document.createElement('canvas');
  this.backBuffer.width = screen.width;
  this.backBuffer.height = screen.height;
  this.backCtx = this.backBuffer.getContext('2d');

  // Start the game loop
  this.oldTime = performance.now();
  this.paused = false;
}

/**
 * @function pause
 * Pause or unpause the game
 * @param {bool} pause true to pause, false to start
 */
Game.prototype.pause = function(flag) {
  this.paused = (flag == true);
}

/**
 * @function loop
 * The main game loop.
 * @param{time} the current time as a DOMHighResTimeStamp
 */
Game.prototype.loop = function(newTime) {
  var game = this;
  var elapsedTime = newTime - this.oldTime;
  this.oldTime = newTime;

  if(!this.paused) this.update(elapsedTime);
  this.render(elapsedTime, this.frontCtx);

  // Flip the back buffer
  this.frontCtx.drawImage(this.backBuffer, 0, 0);
}

},{}],10:[function(require,module,exports){
"use strict";


const Explosion = require('./explosion');
/**
 * @module Player
 * A class representing a player's helicopter
 */
module.exports = exports = GoldEnemy;

function GoldEnemy(loc)
{
    this.pos = {
        x: loc.x,
        y: loc.y
    };
    this.sprite = new Image();
    this.sprite.src = "assets/planes.png";
    this.image = {x: 123, y: 28};
    this.width = 20;
    this.height = 26;
    this.explo = new Explosion(3);
}

GoldEnemy.prototype.update = function(elapsedTime, player)
{
    this.pos.y += 2;
    this.explo.update(elapsedTime);
    var cur = {x: this.pos.x, y: this.pos.y, width: this.width, height: this.height, type: 'kama'};
    player.checkHit(cur);
}

GoldEnemy.prototype.render= function(elapsedTime, ctx)
{
    ctx.drawImage(this.sprite, this.image.x, this.image.y, this.width, this.height, this.pos.x, this.pos.y, this.width, this.height);
    this.explo.render(elapsedTime, ctx);
}


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

GoldEnemy.prototype.checkHit= function(cur)
{
    if(this.pos.x + this.width - 1 < cur.x || this.pos.x + 1 > cur.x + cur.width || this.pos.y + this.height - 1 < cur.y || this.pos.y + 1 > cur.y + cur.height)
  {
    return false;
  }
  this.explo.emit({x: this.pos.x + 10, y: this.pos.y + 13});
  this.pos = {x: -200, y: -200};
  return true;
}
},{"./explosion":8}],11:[function(require,module,exports){
"use strict";

/**
 * @module SmokeParticles
 * A class for managing a particle engine that
 * emulates a smoke trail
 */
module.exports = exports = LaserParticles;

/**
 * @constructor SmokeParticles
 * Creates a SmokeParticles engine of the specified size
 * @param {uint} size the maximum number of particles to exist concurrently
 */
function LaserParticles(maxSize) {
  this.pool = new Float32Array(3 * maxSize);
  this.start = 0;
  this.end = 0;
  this.wrapped = false;
  this.max = maxSize;

}

/**
 * @function emit
 * Adds a new particle at the given position
 * @param {Vector} position
*/
LaserParticles.prototype.emit = function(position) {
  if(this.end != this.max) {
    this.pool[3*this.end] = position.x;
    this.pool[3*this.end+1] = position.y;
    this.pool[3*this.end+2] = 0.0;
    this.end++;
  } else {
    this.pool[3] = position.x;
    this.pool[4] = position.y;
    this.pool[5] = 0.0;
    this.end = 1;
  }
}

/**
 * @function update
 * Updates the particles
 * @param {DOMHighResTimeStamp} elapsedTime
 */
LaserParticles.prototype.update = function(elapsedTime) {
  function updateParticle(i) {
    this.pool[3*i+2] += elapsedTime;
    if(this.pool[3*i+2] > 2000) this.start = i;
  }
  var i;
  if(this.wrapped) {
    for(i = 0; i < this.end; i++){
      updateParticle.call(this, i);
    }
    for(i = this.start; i < this.max; i++){
      updateParticle.call(this, i);
    }
  } else {
    for(i = this.start; i < this.end; i++) {
      updateParticle.call(this, i);
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
LaserParticles.prototype.render = function(elapsedTime, ctx) {
  function renderParticle(i){
    var alpha = 1 - (this.pool[3*i+2] / 300);
    var radius = 0.3 * this.pool[3*i+2];
    if(radius > 8) radius = 8;
    ctx.beginPath();
    ctx.arc(
      this.pool[3*i],   // X position
      this.pool[3*i+1], // y position
      radius, // radius
      0,
      2*Math.PI
    );
    
    ctx.fillStyle = 'rgba(125, 225, 255,' + alpha + ')';
    ctx.fill();
  }

  // Render the particles individually
  var i;
  if(this.wrapped) {
    for(i = 0; i < this.end; i++){
      renderParticle.call(this, i);
    }
    for(i = this.start; i < this.max; i++){
      renderParticle.call(this, i);
    }
  } else {
    for(i = this.start; i < this.end; i++) {
      renderParticle.call(this, i);
    }
  }
}

},{}],12:[function(require,module,exports){
"use strict";

/**
 * @module BulletPool
 * A class for managing bullets in-game
 * We use a Float32Array to hold our bullet info,
 * as this creates a single memory buffer we can
 * iterate over, minimizing cache misses.
 * Values stored are: positionX, positionY, velocityX,
 * velocityY in that order.
 */
module.exports = exports = LaserPool;

var cur;
const LaserParticles = require('./laser_particle');
const laserCD = 15;

/**
 * @constructor BulletPool
 * Creates a BulletPool of the specified size
 * @param {uint} size the maximum number of bullets to exits concurrently
 */
function LaserPool(maxSize) {
  this.pool = new Float32Array(4 * maxSize);
  this.end = 0;
  this.max = maxSize;
  this.sprite = new Image();
  this.sprite.src = 'assets/missles.png'
  this.iHeight = 13;
  this.iWidth = 23;
  this.laser = new LaserParticles(maxSize*100);
  this.laserTimer = 0;
}

/**
 * @function add
 * Adds a new bullet to the end of the BulletPool.
 * If there is no room left, no bullet is created.
 * @param {Vector} position where the bullet begins
 * @param {Vector} velocity the bullet's velocity
*/
LaserPool.prototype.add = function(position, velocity) {
  if(this.end < this.max) {
    this.pool[4*this.end] = position.x;
    this.pool[4*this.end+1] = position.y;
    this.pool[4*this.end+2] = velocity.x;
    this.pool[4*this.end+3] = velocity.y;
    this.end++;
    //this.laser.emit(position);
  }
}

/**
 * @function update
 * Updates the bullet using its stored velocity, and
 * calls the callback function passing the transformed
 * bullet.  If the callback returns true, the bullet is
 * removed from the pool.
 * Removed bullets are replaced with the last bullet's values
 * and the size of the bullet array is reduced, keeping
 * all live bullets at the front of the array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {function} callback called with the bullet's position,
 * if the return value is true, the bullet is removed from the pool
 */
LaserPool.prototype.update = function(elapsedTime, callback, enemies) {
  for(var i = 0; i < this.end; i++){
    // Move the bullet
    this.pool[4*i] += this.pool[4*i+2];
    this.pool[4*i+1] += this.pool[4*i+3];
    if(this.laserTimer <= 0)
    {
      this.laser.emit({x: this.pool[4*i], y: this.pool[4*i+1]});
      //this.laser.emit({x: this.pool[4*i]+23, y: this.pool[4*i+1]});
      this.laserTimer= laserCD;
    }
    cur = {x: this.pool[4*i], y: this.pool[4*i+1], width: 2, height: 2};
    for(var j = 0; j<enemies.length; j++)
    {
      enemies[j].checkHit(cur);
    }
    // If a callback was supplied, call it
    if(callback && callback({
      x: this.pool[4*i],
      y: this.pool[4*i+1]
    })) {
      // Swap the current and last bullet if we
      // need to remove the current bullet
      this.pool[4*i] = this.pool[4*(this.end-1)];
      this.pool[4*i+1] = this.pool[4*(this.end-1)+1];
      this.pool[4*i+2] = this.pool[4*(this.end-1)+2];
      this.pool[4*i+3] = this.pool[4*(this.end-1)+3];
      // Reduce the total number of bullets by 1
      this.end--;
      // Reduce our iterator by 1 so that we update the
      // freshly swapped bullet.
      i--;
    }
  }
  
  this.laserTimer -= elapsedTime;
  this.laser.update(elapsedTime);
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
LaserPool.prototype.render = function(elapsedTime, ctx) {
  // Render the bullets as a single path
  ctx.save();
  this.laser.render(elapsedTime, ctx);
  
  for(var i = 0; i < this.end; i++) {
    ctx.drawImage(this.sprite, 13, 70, 11, 42, this.pool[4*i] - 6, this.pool[4*i+1], 11, 42);
    //ctx.moveTo(this.pool[4*i], this.pool[4*i+1]);
   //ctx.arc(this.pool[4*i], this.pool[4*i+1], 2, 0, 2*Math.PI);
  }
  
  ctx.restore();
}

},{"./laser_particle":11}],13:[function(require,module,exports){
"use strict";

/**
 * @module BulletPool
 * A class for managing bullets in-game
 * We use a Float32Array to hold our bullet info,
 * as this creates a single memory buffer we can
 * iterate over, minimizing cache misses.
 * Values stored are: positionX, positionY, velocityX,
 * velocityY in that order.
 */
module.exports = exports = MisslePool;

var cur;
const SmokeParticles = require('./smoke_particles');
const smokeCD = 25;

/**
 * @constructor BulletPool
 * Creates a BulletPool of the specified size
 * @param {uint} size the maximum number of bullets to exits concurrently
 */
function MisslePool(maxSize) {
  this.pool = new Float32Array(4 * maxSize);
  this.end = 0;
  this.max = maxSize;
  this.sprite = new Image();
  this.sprite.src = 'assets/missles.png'
  this.iHeight = 13;
  this.iWidth = 7;
  this.smoke = new SmokeParticles(maxSize*50, 'rgba(160, 160, 160,');
  this.smokeTimer = 0;

}

/**
 * @function add
 * Adds a new bullet to the end of the BulletPool.
 * If there is no room left, no bullet is created.
 * @param {Vector} position where the bullet begins
 * @param {Vector} velocity the bullet's velocity
*/
MisslePool.prototype.add = function(position, velocity) {
  if(this.end < this.max) {
    this.pool[4*this.end] = position.x;
    this.pool[4*this.end+1] = position.y;
    this.pool[4*this.end+2] = velocity.x;
    this.pool[4*this.end+3] = velocity.y;
    this.end++;
    this.smoke.emit(position);
  }
}

/**
 * @function update
 * Updates the bullet using its stored velocity, and
 * calls the callback function passing the transformed
 * bullet.  If the callback returns true, the bullet is
 * removed from the pool.
 * Removed bullets are replaced with the last bullet's values
 * and the size of the bullet array is reduced, keeping
 * all live bullets at the front of the array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {function} callback called with the bullet's position,
 * if the return value is true, the bullet is removed from the pool
 */
MisslePool.prototype.update = function(elapsedTime, callback, enemies) {
  for(var i = 0; i < this.end; i++){
    // Move the bullet
    this.pool[4*i] += this.pool[4*i+2];
    this.pool[4*i+1] += this.pool[4*i+3];
    if(this.smokeTimer <= 0)
    {
      this.smoke.emit({x: this.pool[4*i], y: this.pool[4*i+1]});
      this.smokeTimer= smokeCD;
    }
    cur = {x: this.pool[4*i], y: this.pool[4*i+1], width: 2, height: 2};
    for(var j = 0; j<enemies.length; j++)
    {
      enemies[j].checkHit(cur);
    }
    // If a callback was supplied, call it
    if(callback && callback({
      x: this.pool[4*i],
      y: this.pool[4*i+1]
    })) {
      // Swap the current and last bullet if we
      // need to remove the current bullet
      this.pool[4*i] = this.pool[4*(this.end-1)];
      this.pool[4*i+1] = this.pool[4*(this.end-1)+1];
      this.pool[4*i+2] = this.pool[4*(this.end-1)+2];
      this.pool[4*i+3] = this.pool[4*(this.end-1)+3];
      // Reduce the total number of bullets by 1
      this.end--;
      // Reduce our iterator by 1 so that we update the
      // freshly swapped bullet.
      i--;
    }
  }
  
  this.smokeTimer -= elapsedTime;
  this.smoke.update(elapsedTime);
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
MisslePool.prototype.render = function(elapsedTime, ctx) {
  // Render the bullets as a single path
  ctx.save();
  ctx.draw
  for(var i = 0; i < this.end; i++) {
    ctx.drawImage(this.sprite, 135, 15, 7, 13, this.pool[4*i], this.pool[4*i+1], 7, 13);
    //ctx.moveTo(this.pool[4*i], this.pool[4*i+1]);
   //ctx.arc(this.pool[4*i], this.pool[4*i+1], 2, 0, 2*Math.PI);
  }
  this.smoke.render(elapsedTime, ctx);
  ctx.restore();
}

},{"./smoke_particles":16}],14:[function(require,module,exports){
"use strict";

/* Classes and Libraries */
const Vector = require('./vector');
const Explosion = require('./explosion');

/* Constants */
const PLAYER_SPEED = 5;
const BULLET_SPEED = 10;
const MISSLE_SPEED = 13;
const WIDE_SPEED = 6;
/**
 * @module Player
 * A class representing a player's helicopter
 */
module.exports = exports = Player;

/**
 * @constructor Player
 * Creates a player
 * @param {BulletPool} bullets the bullet pool
 */
function Player(bullets, missles, wideMiss, laser) {
  this.bullets = bullets;
  this.missles = missles;
  this.wide = wideMiss;
  this.laser = laser;
  this.state = "idle";
  this.angle = 0;
  this.pos = {x: 200, y: 200};
  this.velocity = {x: 0, y: 0};
  this.img = new Image()
  this.img.src = 'assets/tyrian.shp.007D3C.png';
  this.health = 100;
  this.explo = null;
  this.height = 27;
  this.width = 23;
  this.wState = "bullets";
  this.explo = new Explosion(3);
}

/**
 * @function update
 * Updates the player based on the supplied input
 * @param {DOMHighResTimeStamp} elapedTime
 * @param {Input} input object defining input, must have
 * boolean properties: up, left, right, down
 */
Player.prototype.update = function(elapsedTime, input) {

  // set the velocity
  this.velocity.x = 0;
  if(input.left) this.velocity.x -= PLAYER_SPEED;
  if(input.right) this.velocity.x += PLAYER_SPEED;
  this.velocity.y = 0;
  if(input.up) this.velocity.y -= PLAYER_SPEED / 2;
  if(input.down) this.velocity.y += PLAYER_SPEED / 2;
  
  // determine player angle
  this.angle = 0;
  if(this.velocity.x < 0) this.angle = -1;
  if(this.velocity.x > 0) this.angle = 1;

  // move the player
  this.pos.x += this.velocity.x;
  this.pos.y += this.velocity.y;

  // don't let the player move off-screen
  if(this.pos.x < 0) this.pos.x = 0;
  if(this.pos.x > 1024) this.pos.x = 1024;
  if(this.pos.y > 786) this.pos.y = 786;
  this.explo.update(elapsedTime);
}

/**
 * @function render
 * Renders the player helicopter in world coordinates
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
Player.prototype.render = function(elapsedTime, ctx) {
  var offset = this.angle * 23;
  ctx.save();
  
  ctx.translate(this.pos.x, this.pos.y);
  this.explo.render(elapsedTime, ctx);
  ctx.drawImage(this.img, 48+offset, 57, 23, 27, -12.5, -12, 23, 27);
  
  ctx.restore();
  
}

/**
 * @function fireBullet
 * Fires a bullet
 * @param {Vector} direction
 */
Player.prototype.fireBullet = function(direction) {
  //var pos = Vector.add(this.pos, {x:30, y:30});
  var velocity = Vector.scale(Vector.normalize(direction), BULLET_SPEED);
  this.bullets.add(this.pos, velocity);
}

Player.prototype.fireMissle = function(direction) {
  var pos = Vector.add(this.pos, {x:30, y:30});
  var velocity = Vector.scale(Vector.normalize(direction), MISSLE_SPEED);
  this.missles.add(this.pos, velocity);
}

Player.prototype.fireWide = function(direction) {
  var pos = Vector.add(this.pos, {x:30, y:30});
  var velocity = Vector.scale(Vector.normalize(direction), WIDE_SPEED);
  this.wide.add(this.pos, velocity);
}

Player.prototype.fireLaser = function(direction) {
  var pos = Vector.add(this.pos, {x:30, y:30});
  var velocity = Vector.scale(Vector.normalize(direction), WIDE_SPEED);
  this.laser.add(this.pos, velocity);
}

Player.prototype.checkHit= function(cur)
{
    if(this.pos.x + this.width < cur.x || this.pos.x > cur.x + cur.width || this.pos.y + this.height < cur.y || this.pos.y + 1 > cur.y + cur.height)
  {
    return false;
  }
  switch (cur.type)
  {
    case "bullets":
      this.health -= 2;
      break;
    case "plane":
      this.health -= 100;
      break;
    case "aa":
      this.health -= 20;
      break;
    case "spin":
      this.health = 0;
      break;
    case "kama":
      this.health = 0;
      break;
  }
  if(this.health < 0)
  {
    this.health = 0;
  }
  if(this.health <= 0)
  {
    this.explo.emit({x: this.pos.x +5, y: this.pos.y + 200});
    this.pos = {x: -200, y: -200};
  }
  return true;
}

Player.prototype.renderHealth = function(ctx)
{
  ctx.fillStyle = 'grey';
  ctx.fillRect(15, 750, 104, 14);
  ctx.fillStyle = 'black';
  ctx.fillRect(17, 752, 100, 10);
  if(this.health > 50)
  {
    ctx.fillStyle = 'green';
  }
  else if(this.health >25)
  {
    ctx.fillStyle = 'yellow';
  }
  else
  {
    ctx.fillStyle = 'red';
  }
  
  ctx.fillRect(17, 752, this.health, 10);
}
},{"./explosion":8,"./vector":19}],15:[function(require,module,exports){
"use strict";

module.exports = exports = PowerUp;

function PowerUp(type, loc)
{
    this.pos = {
        x: loc.x,
        y: loc.y
    }
    this.sprite = new Image();
    this.sprite.src = 'assets/powerUps.png'
    this.type = type;
    this.width = 20;
    this.height = 21;
    switch(type)
    {
        case "miss":
            this.image = {
                x: 122,
                y: 143,
                h: 21,
                w: 20
            };
            break;
        case "wide":
            this.image = {
                x: 98,
                y: 115,
                h: 21,
                w: 20
            };
            break;
        case "lsr":
            this.image = {
                x: 26,
                y: 143,
                h: 21,
                w: 20
            };
            break;
    }
}

PowerUp.prototype.update = function()
{

}

PowerUp.prototype.render = function(ctx)
{
    ctx.drawImage(this.sprite, this.image.x, this.image.y, this.image.w, this.image.h, this.pos.x, this.pos.y, this.image.w, this.image.h);
}
},{}],16:[function(require,module,exports){
"use strict";

/**
 * @module SmokeParticles
 * A class for managing a particle engine that
 * emulates a smoke trail
 */
module.exports = exports = SmokeParticles;

/**
 * @constructor SmokeParticles
 * Creates a SmokeParticles engine of the specified size
 * @param {uint} size the maximum number of particles to exist concurrently
 */
function SmokeParticles(maxSize, color) {
  this.pool = new Float32Array(3 * maxSize);
  this.start = 0;
  this.end = 0;
  this.wrapped = false;
  this.max = maxSize;
  this.color = color;
}

/**
 * @function emit
 * Adds a new particle at the given position
 * @param {Vector} position
*/
SmokeParticles.prototype.emit = function(position) {
  if(this.end != this.max) {
    this.pool[3*this.end] = position.x;
    this.pool[3*this.end+1] = position.y;
    this.pool[3*this.end+2] = 0.0;
    this.end++;
  } else {
    this.pool[3] = position.x;
    this.pool[4] = position.y;
    this.pool[5] = 0.0;
    this.end = 1;
  }
}

/**
 * @function update
 * Updates the particles
 * @param {DOMHighResTimeStamp} elapsedTime
 */
SmokeParticles.prototype.update = function(elapsedTime) {
  function updateParticle(i) {
    this.pool[3*i+2] += elapsedTime;
    if(this.pool[3*i+2] > 2000) this.start = i;
  }
  var i;
  if(this.wrapped) {
    for(i = 0; i < this.end; i++){
      updateParticle.call(this, i);
    }
    for(i = this.start; i < this.max; i++){
      updateParticle.call(this, i);
    }
  } else {
    for(i = this.start; i < this.end; i++) {
      updateParticle.call(this, i);
    }
  }
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
SmokeParticles.prototype.render = function(elapsedTime, ctx) {
  function renderParticle(i){
    var alpha = 1 - (this.pool[3*i+2] / 1000);
    var radius = 0.1 * this.pool[3*i+2];
    if(radius > 5) radius = 5;
    ctx.beginPath();
    ctx.arc(
      this.pool[3*i],   // X position
      this.pool[3*i+1], // y position
      radius, // radius
      0,
      2*Math.PI
    );
    ctx.fillStyle = this.color + alpha + ')';
    //ctx.fillStyle = 'rgba(160, 160, 160,' + alpha + ')';
    ctx.fill();
  }

  // Render the particles individually
  var i;
  if(this.wrapped) {
    for(i = 0; i < this.end; i++){
      renderParticle.call(this, i);
    }
    for(i = this.start; i < this.max; i++){
      renderParticle.call(this, i);
    }
  } else {
    for(i = this.start; i < this.end; i++) {
      renderParticle.call(this, i);
    }
  }
}

},{}],17:[function(require,module,exports){
"use strict";


const Explosion = require('./explosion');
const Vector = require('./vector');
const Camera = require('./camera');
const MS_PER_FRAME = 200;
/**
 * @module Player
 * A class representing a player's helicopter
 */
module.exports = exports = Spinner;

function Spinner(loc)
{
    this.pos = {
        x: loc.x,
        y: loc.y
    };
    this.sprite = new Image();
    this.sprite.src = "assets/spinner.png";
    this.image = {x: 49, y: 116};
    this.width = 47;
    this.height = 47;
    this.explo = new Explosion(3);
    this.frameTimer = 0;
}

Spinner.prototype.update = function(elapsedTime, player)
{
    this.explo.update(elapsedTime);
    this.frameTimer += elapsedTime;
    if(this.frameTimer > MS_PER_FRAME)
    {
        this.frameTimer = 0;
        if(this.image.x == 49)
        {
            this.image.x = 96;
        }
        else{
            this.image.x = 49
        }
    }
    var cur = {x: this.pos.x, y: this.pos.y, width: this.width, height: this.height, type: 'spin'};
    player.checkHit(cur);
}

Spinner.prototype.render= function(elapsedTime, ctx)
{
    ctx.drawImage(this.sprite, this.image.x, this.image.y, this.width, this.height, this.pos.x, this.pos.y, this.width, this.height);
    this.explo.render(elapsedTime, ctx);
}

Spinner.prototype.checkHit= function(cur)
{
    if(this.pos.x + this.width - 1 < cur.x || this.pos.x + 1 > cur.x + cur.width || this.pos.y + this.height - 1 < cur.y || this.pos.y + 1 > cur.y + cur.height)
    {
        return false;
    }
    this.explo.emit({x: this.pos.x + 23, y: this.pos.y + 23});
    this.pos = {x: -200, y: -200};
    return true;
}



},{"./camera":6,"./explosion":8,"./vector":19}],18:[function(require,module,exports){
"use strict";


const Explosion = require('./explosion');
const BadBullets = require('./bad_bullets');
const Camera = require('./camera');
const Vector = require('./vector');
const BULLET_SPEED = 5;
const cd = 800;
/**
 * @module Player
 * A class representing a player's helicopter
 */
module.exports = exports = Turret;

function Turret(loc)
{
    this.pos = {
        x: loc.x,
        y: loc.y
    };
    this.sprite = new Image();
    this.sprite.src = "assets/turret.png";
    this.image = {x: 3, y: 35};
    this.width = 18;
    this.height = 13;
    this.explo = new Explosion(3);
    this.bullets = new BadBullets(20);
    this.timer = 0;
}

Turret.prototype.update = function(elapsedTime, player, camera)
{
    this.timer += elapsedTime;
    if(this.timer > cd)
    {
        this.timer = 0;
        this.fire();
    }
    this.explo.update(elapsedTime);
    this.bullets.update(elapsedTime, function(bullet){
        if(!camera.onScreen(bullet)) return true;
        return false;
    }, player);
}

Turret.prototype.render= function(elapsedTime, ctx)
{
    ctx.drawImage(this.sprite, this.image.x, this.image.y, this.width, this.height, this.pos.x, this.pos.y, this.width, this.height);
    this.explo.render(elapsedTime, ctx);
    this.bullets.render(elapsedTime, ctx);
}

Turret.prototype.checkHit= function(cur)
{
    if(this.pos.x + this.width - 1 < cur.x || this.pos.x + 1 > cur.x + cur.width || this.pos.y + this.height - 1 < cur.y || this.pos.y + 1 > cur.y + cur.height)
    {
        return false;
    }
    this.explo.emit({x: this.pos.x + 10, y: this.pos.y + 14});
    this.pos = {x: -200, y: -200};
    return true;
}

Turret.prototype.fire = function()
{
    //var pos = Vector.add(this.pos, {x:30, y:30});
    var velocity = Vector.scale(Vector.normalize({x: -4, y: 0}), BULLET_SPEED);
    this.bullets.add(this.pos, velocity);
}
},{"./bad_bullets":4,"./camera":6,"./explosion":8,"./vector":19}],19:[function(require,module,exports){
"use strict";

/**
 * @module Vector
 * A library of vector functions.
 */
module.exports = exports = {
  add: add,
  subtract: subtract,
  scale: scale,
  rotate: rotate,
  dotProduct: dotProduct,
  magnitude: magnitude,
  normalize: normalize
}


/**
 * @function rotate
 * Scales a vector
 * @param {Vector} a - the vector to scale
 * @param {float} scale - the scalar to multiply the vector by
 * @returns a new vector representing the scaled original
 */
function scale(a, scale) {
 return {x: a.x * scale, y: a.y * scale};
}

/**
 * @function add
 * Computes the sum of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed sum
*/
function add(a, b) {
 return {x: a.x + b.x, y: a.y + b.y};
}

/**
 * @function subtract
 * Computes the difference of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed difference
 */
function subtract(a, b) {
  return {x: a.x - b.x, y: a.y - b.y};
}

/**
 * @function rotate
 * Rotates a vector about the Z-axis
 * @param {Vector} a - the vector to rotate
 * @param {float} angle - the angle to roatate by (in radians)
 * @returns a new vector representing the rotated original
 */
function rotate(a, angle) {
  return {
    x: a.x * Math.cos(angle) - a.y * Math.sin(angle),
    y: a.x * Math.sin(angle) + a.y * Math.cos(angle)
  }
}

/**
 * @function dotProduct
 * Computes the dot product of two vectors
 * @param {Vector} a the first vector
 * @param {Vector} b the second vector
 * @return the computed dot product
 */
function dotProduct(a, b) {
  return a.x * b.x + a.y * b.y
}

/**
 * @function magnitude
 * Computes the magnitude of a vector
 * @param {Vector} a the vector
 * @returns the calculated magnitude
 */
function magnitude(a) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

/**
 * @function normalize
 * Normalizes the vector
 * @param {Vector} a the vector to normalize
 * @returns a new vector that is the normalized original
 */
function normalize(a) {
  var mag = magnitude(a);
  return {x: a.x / mag, y: a.y / mag};
}

},{}],20:[function(require,module,exports){
"use strict";

/**
 * @module BulletPool
 * A class for managing bullets in-game
 * We use a Float32Array to hold our bullet info,
 * as this creates a single memory buffer we can
 * iterate over, minimizing cache misses.
 * Values stored are: positionX, positionY, velocityX,
 * velocityY in that order.
 */
module.exports = exports = WideMissle;

var cur;
const SmokeParticles = require('./smoke_particles');
const smokeCD = 15;

/**
 * @constructor BulletPool
 * Creates a BulletPool of the specified size
 * @param {uint} size the maximum number of bullets to exits concurrently
 */
function WideMissle(maxSize) {
  this.pool = new Float32Array(4 * maxSize);
  this.end = 0;
  this.max = maxSize;
  this.sprite = new Image();
  this.sprite.src = 'assets/missles.png'
  this.iHeight = 13;
  this.iWidth = 23;
  this.smoke = new SmokeParticles(maxSize*200, 'rgba(110, 240, 0,');
  this.smokeTimer = 0;
}

/**
 * @function add
 * Adds a new bullet to the end of the BulletPool.
 * If there is no room left, no bullet is created.
 * @param {Vector} position where the bullet begins
 * @param {Vector} velocity the bullet's velocity
*/
WideMissle.prototype.add = function(position, velocity) {
  if(this.end < this.max) {
    this.pool[4*this.end] = position.x;
    this.pool[4*this.end+1] = position.y;
    this.pool[4*this.end+2] = velocity.x;
    this.pool[4*this.end+3] = velocity.y;
    this.end++;
    this.smoke.emit(position);
  }
}

/**
 * @function update
 * Updates the bullet using its stored velocity, and
 * calls the callback function passing the transformed
 * bullet.  If the callback returns true, the bullet is
 * removed from the pool.
 * Removed bullets are replaced with the last bullet's values
 * and the size of the bullet array is reduced, keeping
 * all live bullets at the front of the array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {function} callback called with the bullet's position,
 * if the return value is true, the bullet is removed from the pool
 */
WideMissle.prototype.update = function(elapsedTime, callback, enemies) {
  for(var i = 0; i < this.end; i++){
    // Move the bullet
    this.pool[4*i] += this.pool[4*i+2];
    this.pool[4*i+1] += this.pool[4*i+3];
    if(this.smokeTimer <= 0)
    {
      this.smoke.emit({x: this.pool[4*i], y: this.pool[4*i+1]});
      this.smoke.emit({x: this.pool[4*i]+23, y: this.pool[4*i+1]});
      this.smokeTimer= smokeCD;
    }
    cur = {x: this.pool[4*i], y: this.pool[4*i+1], width: 2, height: 2};
    for(var j = 0; j<enemies.length; j++)
    {
      enemies[j].checkHit(cur);
    }
    // If a callback was supplied, call it
    if(callback && callback({
      x: this.pool[4*i],
      y: this.pool[4*i+1]
    })) {
      // Swap the current and last bullet if we
      // need to remove the current bullet
      this.pool[4*i] = this.pool[4*(this.end-1)];
      this.pool[4*i+1] = this.pool[4*(this.end-1)+1];
      this.pool[4*i+2] = this.pool[4*(this.end-1)+2];
      this.pool[4*i+3] = this.pool[4*(this.end-1)+3];
      // Reduce the total number of bullets by 1
      this.end--;
      // Reduce our iterator by 1 so that we update the
      // freshly swapped bullet.
      i--;
    }
  }
  
  this.smokeTimer -= elapsedTime;
  this.smoke.update(elapsedTime);
}

/**
 * @function render
 * Renders all bullets in our array.
 * @param {DOMHighResTimeStamp} elapsedTime
 * @param {CanvasRenderingContext2D} ctx
 */
WideMissle.prototype.render = function(elapsedTime, ctx) {
  // Render the bullets as a single path
  ctx.save();
  this.smoke.render(elapsedTime, ctx);
  
  for(var i = 0; i < this.end; i++) {
    ctx.drawImage(this.sprite, 109, 98, 23, 13, this.pool[4*i], this.pool[4*i+1], 23, 13);
    //ctx.moveTo(this.pool[4*i], this.pool[4*i+1]);
   //ctx.arc(this.pool[4*i], this.pool[4*i+1], 2, 0, 2*Math.PI);
  }
  
  ctx.restore();
}

},{"./smoke_particles":16}]},{},[3]);
