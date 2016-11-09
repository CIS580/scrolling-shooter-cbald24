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


