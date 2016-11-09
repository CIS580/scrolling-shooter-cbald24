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