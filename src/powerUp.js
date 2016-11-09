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