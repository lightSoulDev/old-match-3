import Sprite = PIXI.Sprite;
import Container = PIXI.Container;
import Texture = PIXI.Texture;

export class Switcher extends Container {

    private _sprite: Sprite;

    constructor(_norm: Texture, _switch: Texture) {
        super();

        if (createjs.Sound.muted) {
            this._sprite = new Sprite(_switch);
        } else {
            this._sprite = new Sprite(_norm);
        }
        this._sprite.anchor.set(0.5);
        this._sprite.interactive = true;
        this._sprite.buttonMode = true;

        this._sprite.on("pointerover", function (): void {
            this._sprite.alpha = 0.75;
        }.bind(this));

        this._sprite.on("pointerout", function (): void {
            this._sprite.alpha = 1;
        }.bind(this));

        this._sprite.on("pointerupoutside", function (): void {
            this._sprite.alpha = 1;
        }.bind(this));

        this._sprite.on("pointerdown", function (): void {
            this._sprite.alpha = 0.55;
        }.bind(this));

        this._sprite.on("pointerup", function (): void {
            if (this._sprite.texture == _norm) {
                this._sprite.interactive = false;
                this._sprite.texture = _switch;
                createjs.Sound.setMute(true);
                setTimeout(function () {
                    this._sprite.alpha = 1;
                    this._sprite.interactive = true;
                }.bind(this), 50);
            } else {
                this._sprite.interactive = false;
                this._sprite.texture = _norm;
                createjs.Sound.setMute(false);
                setTimeout(function () {
                    this._sprite.alpha = 1;
                    this._sprite.interactive = true;
                }.bind(this), 50);
            }
        }.bind(this));

        this.addChild(this._sprite);
    }
}