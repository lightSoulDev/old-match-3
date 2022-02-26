import Sprite = PIXI.Sprite;
import Container = PIXI.Container;
import Texture = PIXI.Texture;
import Text = PIXI.Text;
import TextStyle = PIXI.TextStyle;
import { Game } from "./Game";

export class Button extends Container {

    private _sprite: Sprite;
    private _normalTexture: Texture;
    private _pressTexture: Texture;
    protected _text: Text;
    protected _pressedAlpha: number = 0.4;

    constructor(_norm: Texture, _pressed: Texture, _text: string = "",
        _fonstSize: number = 18, _fill: string = "#ffffff", _align: string = "center") {
        super();

        this._sprite = new Sprite();
        this.setAnchor(0.5, 0.5);
        this.setInteractive(true);
        this._sprite.buttonMode = true;

        this._normalTexture = _norm;
        this._pressTexture = _pressed;

        this._text = new Text(_text);
        this._text.anchor.set(0.5, 0.5);
        this._text.position.set(0, this._sprite.height / 2);
        this._text.style = new TextStyle({
            fontSize: _fonstSize, fontFamily: "Visitor TT2 BFK", fill: _fill, align: _align, fontWeight: "400",
            dropShadow: false
        });
        this.setShadowEffects();


        this._sprite.on("pointerover", function (): void {
            this.setPressStyle();
        }.bind(this));

        this._sprite.on("pointerout", function (): void {
            if (this.alpha == 1)
                this.setNormalStyle();
        }.bind(this));

        this._sprite.on("pointerdown", function (): void {
            this.alpha = this._pressedAlpha;
            createjs.Sound.play(Game.SOUND_PRESS, createjs.Sound.INTERRUPT_ANY, 0, 0, 0, 0.5);
            this.setPressStyle();
        }.bind(this));

        this._sprite.on("pointerupoutside", function (): void {
            this.alpha = 1;
            if (this._sprite.texture == this._pressTexture)
                this.setNormalStyle();
        }.bind(this));

        this._sprite.on("pointerup", function (): void {
            this.setNormalStyle();
            this.setInteractive(false);
            this.emit("click");
            setTimeout(function (): void {
                this.alpha = 1;
                this.setInteractive(true);
            }.bind(this), 50);
        }.bind(this));

        this._sprite.texture = this._normalTexture;
        this.addChild(this._sprite);
        this.addChild(this._text);
    }

    public setAnchor(x: number, y: number): void {
        this._sprite.anchor.set(x, y);
    }

    // Функции для кастомизирования кнопок
    public setNormalStyle(): void {
        this._sprite.texture = this._normalTexture;
        this._text.style.fontWeight = "400";
        this._text.style.dropShadow = false;
    }

    public setPressStyle(): void {
        this._sprite.texture = this._pressTexture;
        this._text.style.fontWeight = "500";
        this._text.style.dropShadow = true;
    }

    public setShadowEffects(): void {
        this._text.style.dropShadowDistance = 6;
        this._text.style.dropShadowBlur = 5;
    }

    public reset(): void {
        this.setNormalStyle();
        this.setInteractive(true);
        this.alpha = 1;
    }

    public setInteractive(value: boolean): void {
        this._sprite.interactive = value;
    }
}

// Особый случай класса button
export class MenuButton extends Button {
    constructor(text: string, _fonstSize: number = 48,
        _fill: string = '#00ccff', _align: string = "center") {
        super(Game.RES.menuButtonNormal.texture, Game.RES.menuButtonPress.texture, text,
            _fonstSize, _fill, _align);
    }
}