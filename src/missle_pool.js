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
