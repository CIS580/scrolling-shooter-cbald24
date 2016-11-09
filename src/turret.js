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