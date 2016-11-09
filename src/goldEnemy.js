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