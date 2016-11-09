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

