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