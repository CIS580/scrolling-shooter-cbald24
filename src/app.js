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