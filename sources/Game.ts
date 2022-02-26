import Sprite = PIXI.Sprite;
import Text = PIXI.Text;
import TextStyle = PIXI.TextStyle;
import Container = PIXI.Container;
import Graphics = PIXI.Graphics;
import Sound = createjs.Sound;
import { Field } from "./Field";
import { Switcher } from "./Switcher"
import { MenuButton } from "./Button"
declare let TweenMax: any;
declare let TimelineMax: any;


export class Game extends Container {

    public static WIDTH: number = 768;
    public static HEIGHT: number = 1366;
    public static TILE: number = 90;
    public static IDLE: number = 0;
    public static INGAME: number = 1;
    public static GAMEOVER: number = 2;
    public static RES: any;

    public static SOUND_SELECT: any = "Select";
    public static SOUND_UNSELECT: any = "Unselect"
    public static SOUND_DESTROY: any = "Destroy"
    public static SOUND_PRESS: any = "Press"
    public static SOUND_AMBIENT: any = "Ambient";

    private _field: Field;
    private _background: Sprite;
    private _soundSwitcher: Switcher;
    private _restartButton: MenuButton;
    private _textStyle: TextStyle;
    private _timerText: Text;
    private _scoreText: Text;
    private _comboText: Text;
    private _timeToPlay: number = 180;
    private _time: number;
    private _timer: any;
    private _score: number;
    private _combo: number;
    private _state: number;
    public get state(): number {
        return this._state;
    }
    
    public get combo(): number {
        return this._combo;
    }


    constructor(resources: any) {
        super();
        Game.RES = resources;
        this._score = 0;
        this._combo = 0;
        this._state = Game.IDLE;

        this.on('eventTimerStart', this.startTimer);
        this.on('eventComboEnd', this.endCombo);
        this.on('eventComboUp', this.upCombo);

        this._field = new Field();
        this._background = new Sprite(Game.RES.background.texture);
        this._soundSwitcher = new Switcher(Game.RES.soundSwitcherOn.texture, Game.RES.soundSwitcherOff.texture);
        this._restartButton = new MenuButton("RESTART");
        this._scoreText = new Text(this._score.toString());
        this._comboText = new Text("x1");
        this._timerText = new Text("-:--");

        this.setUI();
        this.setSounds();

        this.addChild(this._background);
        this.addChild(this._field);
        // this.addChild(this._soundSwitcher);
        this.addChild(this._comboText);
        this.addChild(this._timerText);
        this.addChild(this._scoreText);

        this._field.emit('eventSetField');
    }

    private setUI(): void {
        this._background.width = Game.WIDTH;
        this._background.height = Game.HEIGHT;
        this._background.alpha = 0.6;

        this._textStyle = new TextStyle({
            fontSize: 80, fontFamily: "Visitor TT2 BFK", fill: '#ffffff', align: "center", fontWeight: "600",
            dropShadow: true,
            dropShadowDistance: 6,
            dropShadowBlur: 5,
        });

        this._scoreText.style = this._textStyle;
        this._scoreText.anchor.set(0.5);
        this._scoreText.position.set(Game.WIDTH / 2, 300);

        this._comboText.style = this._textStyle;
        this._comboText.anchor.set(0.5);
        this._comboText.position.set(Game.WIDTH / 2, Game.HEIGHT - 120);
        this._comboText.alpha = 0;
        this._comboText.style.fontSize = 100;

        this._timerText.style = this._textStyle;
        this._timerText.anchor.set(0.5);
        this._timerText.position.set(Game.WIDTH * 0.8, 150);

        this._soundSwitcher.position.set(Game.WIDTH * 0.2, 140);
        this._soundSwitcher.scale.set(0.8);

        this._restartButton.on('click', function (): void {
            let game: Game = new Game(Game.RES);
            this.parent.addChild(game);
            this.destroy();
        }.bind(this));
    }

    private setSounds(): void {
        Sound.registerSound("./resources/assets/sounds/ambient.mp3", Game.SOUND_AMBIENT);
        Sound.registerSound("./resources/assets/sounds/select.mp3", Game.SOUND_SELECT);
        Sound.registerSound("./resources/assets/sounds/unselect.mp3", Game.SOUND_UNSELECT);
        Sound.registerSound("./resources/assets/sounds/destroy.mp3", Game.SOUND_DESTROY);
        Sound.registerSound("./resources/assets/sounds/press.mp3", Game.SOUND_PRESS);
        Sound.on("fileload", this.onSoundLoad, Game.SOUND_AMBIENT);
    }

    // Обработчик проигрывания фоновой музыки
    private onSoundLoad(): void {
        createjs.Sound.play(Game.SOUND_AMBIENT, createjs.Sound.INTERRUPT_ANY, 0, 0, -1, 0.5);
    }

    // Старт таймера ограничения времени игры
    private startTimer(): void {
        this._time = this._timeToPlay;
        this._state = Game.INGAME;
        this.setTimerText();
        this._timer = new TimelineMax({ repeat: this._timeToPlay, repeatDelay: 1, onComplete: this.onTimerEnd.bind(this), onRepeat: this.onTimerTick.bind(this) });
    }

    private onTimerEnd(): void {
        this._time = 0;
        this.setTimerText();
        this._state = Game.GAMEOVER;
        if (this._combo == 0)
            this.endGame();
    }

    private endGame(): void {
        this._field.switchInteractive(false);
        this.removeChild(this._field);

        TweenMax.to(this._field, 2, { alpha: 0 });
        TweenMax.to(this._scoreText, 2, { x: Game.WIDTH / 2, y: Game.HEIGHT * 0.45 });
        TweenMax.to(this._scoreText.scale, 2, { x: 1.5, y: 1.5 });

        this.addChild(this._restartButton);
        this._restartButton.setInteractive(false);
        let tl = new TimelineMax({ onComplete: function() { this._restartButton.setInteractive(true); }.bind(this) });
        tl.fromTo(this._restartButton, 2, { x: Game.WIDTH / 2, y: Game.HEIGHT - 300, alpha: 0 },
            { x: Game.WIDTH / 2, y: Game.HEIGHT * 0.55, alpha: 1 });
    }

    private endCombo(): void {
        this._combo = 0;
        TweenMax.to(this._comboText, 0.5, { alpha: 0 });

        if (this._state == Game.GAMEOVER)
            this.endGame();
    }
    
    private upCombo(value: number): void {
        if (this._combo == 0) {
            TweenMax.to(this._comboText, 0.2, { alpha: 1 });
            this._combo = 1;
        } else {
            TweenMax.fromTo(this._comboText.scale, 1, { x: 1.75, y: 1.75 }, { x: 1, y: 1 });
            this._combo += 1;
        }

        this._comboText.text = "x" + this._combo.toString();
        this._score += value * this._combo;
        this._scoreText.text = this._score.toString();
    }


    private onTimerTick(): void {
        this._time -= 1;
        this.setTimerText();
    }


    private setTimerText(): void {
        let sec = this._time % 60;
        let min = (this._time - sec) / 60;
        let keyChar = (sec < 10) ? "0" : "";
        this._timerText.text = min.toString() + ":" + keyChar + sec.toString();
    }
}