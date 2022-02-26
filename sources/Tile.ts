import Sprite = PIXI.Sprite;
import Container = PIXI.Container;
import Texture = PIXI.Texture;
import Text = PIXI.Text;
import TextStyle = PIXI.TextStyle;
import { Field } from "./Field";
import { Game } from "./Game";
import { Plate } from "./Plate";
let IDLE: number = 0;
let SELECTED: number = 1;
declare let TweenMax: any;
declare let TimelineMax: any;

export class Tile extends Container {
    public item: Sprite;

    private _plate: Plate;
    private _points: Text;

    private _itemTextures: Texture[] = [
        null, // Пустая клетка
        Game.RES._red.texture,
        Game.RES._orange.texture,
        Game.RES._green.texture,
        Game.RES._blue.texture,
        Game.RES._pink.texture,
        Game.RES._bomb.texture,
    ];
    private _selectedTextures: Texture[] = [
        null, // Пустая клетка
        Game.RES.s_red.texture,
        Game.RES.s_orange.texture,
        Game.RES.s_green.texture,
        Game.RES.s_blue.texture,
        Game.RES.s_pink.texture,
        Game.RES.s_bomb.texture,
    ];

    protected pressedAlpha: number = 0.4;
    protected isOver: boolean = true;
    protected isDown: boolean = false;

    private _state: number;
    private _field: Field;
    
    public value: number;
    public counted: boolean;

    public pos = {
        "x": 0,
        "y": 0
    }
    public type: number;
    public highlighted: boolean;

    private setState(state: any): void {
        this._state = state;
    }

    constructor(field: Field, _plate: Plate, pos: number[]) {
        super();

        this.pos.x = pos[0];
        this.pos.y = pos[1];

        this.counted = false;
        this.value = 50;

        this._field = field;

        this._points = new Text();
        this._points.style = new TextStyle({
            fontSize: 60, fontFamily: "Visitor TT2 BFK", fill: '#ffffff', align: "center", fontWeight: "600",
            dropShadow: true,
            dropShadowDistance: 6,
            dropShadowBlur: 5,
        });


        this._points.anchor.set(0.5);
        this._points.position.set(Game.TILE / 2 + 4, Game.TILE / 2 + 4);

        this.setState(IDLE);
    }

    public setUp(t: number, fall: number = 0, mult: number = 1) {
        this.item = new Sprite();
        this.item.scale.set(1);
        this.item.anchor.set(0.5);
        this.item.position.set(Game.TILE / 2, Game.TILE / 2);
        this.item.interactive = true;
        this.item.buttonMode = true;
        this.item.on("pointerover", function (): void {
            if (this._state == IDLE) {
                this.item.alpha = 0.5;
            }
        }.bind(this));

        this.item.on("pointerout", function (): void {
            if (this._state == IDLE) {
                this.item.alpha = 1;
            }
        }.bind(this));

        this.item.on("pointerdown", function (): void {
            if (this._state == IDLE) {
                this.select();
            } else {
                if (this._state == SELECTED) {
                    this.deselect();
                }
            }
        }.bind(this));

        this.item.on("pointerupoutside", function (): void {
            // if (this._state == SELECTED) {
            //     this.deselect();
            // }
        }.bind(this));
        
        this.item.on("pointerup", function (): void {
            // if (this._state == SELECTED) {
            //     this.deselect();
            // }
            if (this._field.getSelectedTile() != null && this._field.getSelectedTile() != this) {
                this.swap();
            }
        }.bind(this));
        
        this.addChild(this.item);
        this.addChild(this._points);
        this._points.alpha = 0;
        this.setType(t, fall, mult);
    }

    // Выбор шарика
    public select(): void {
        if (this._field.getSelectedTile() == null) {
            this._field.setSelectedTile(this);
            this._field.highlightNeighbours(this);
            this.setState(SELECTED);

            // TweenMax.fromTo(this.item, 0.3, { alpha: this.item.alpha }, { alpha: this.pressedAlpha });
            this.item.texture = this._selectedTextures[this.type];
            this.item.alpha = 1;

            createjs.Sound.play(Game.SOUND_SELECT, createjs.Sound.INTERRUPT_ANY, 0, 0, 0, 0.05);
        } else {
            this.swap();
        }
    }

    // Отмена выбора шарика
    public deselect(playSound: boolean = true): void {
        if (this._field.getSelectedTile() == this) {
            this._field.setSelectedTile(null);
        }
        this._field.unHighlightNeighbours(this);
        this.setState(IDLE);

        // TweenMax.fromTo(this.item, 0.3, { alpha: this.item.alpha }, { alpha: 1 });
        this.item.texture = this._itemTextures[this.type]

        if (playSound)
            createjs.Sound.play(Game.SOUND_UNSELECT, createjs.Sound.INTERRUPT_ANY, 0, 0, 0, 0.05);
    }

    // Смена позиций двух шариков между друг другом
    public swap(): void {
        if (this.highlighted) {

            let selectedTile = this._field.getSelectedTile();

            this._field.switchInteractive(false);
            this._field.unHighlightNeighbours(selectedTile);
            let y1 = (selectedTile.pos.x - this.pos.x) * Game.TILE;
            let x1 = (selectedTile.pos.y - this.pos.y) * Game.TILE;

            selectedTile.item.alpha = 1;
            this.item.alpha = 1;
            selectedTile.item.texture = selectedTile._itemTextures[selectedTile.type];


            TweenMax.to(this.item, 0.75, { x: this.item.x + x1, y: this.item.y + y1 });
            TweenMax.to(selectedTile.item, 0.75, { x: this.item.x - x1, y: this.item.y - y1 });
            let tl = new TimelineMax({
                repeat: 1, repeatDelay: 1, onComplete: function () {
                    let temp = this.type;
                    var selected = this._field.getSelectedTile();
                    this.setType(selected.type);
                    selected.setType(temp);
                    TweenMax.set(this.item, { x: Game.TILE / 2, y: Game.TILE / 2 });
                    TweenMax.set(selected.item, { x: Game.TILE / 2, y: Game.TILE / 2 });
                    selected.deselect(false);

                    let matches = this._field.findMatches();
                    this._field.animateDestroy(matches);
                }.bind(this)
            });
        }
    }

    public blow (combo: number) {
        TweenMax.to(this.item, 0.4, { alpha: 0, rotation: 2.5 });
        TweenMax.to(this.item.scale, 0.4, { x: 0, y: 0 });
        this.counted = true;
        let value = (this.value * combo);
        this._points.text = value.toString();
        if (value >= 10000) this._points.style.fontSize = 34;
        else if (value >= 1000) this._points.style.fontSize = 44;
        else if (value >= 100) this._points.style.fontSize = 54;
        else this._points.style.fontSize = 64;
        TweenMax.fromTo(this._points, 0.3, {alpha: 0}, {alpha: 1});
        TweenMax.fromTo(this._points.scale, 0.3, { x: 0, y: 0 }, { x: 1, y: 1 });
    }

    // Установка типа шарика
    public setType(t: number, fall: number = 0, mult: number = 1, event: string = ""): void {
        if (fall > 0) {
            let tl = new TimelineMax({ onComplete: this.onTileFall.bind(this, event) });
            tl.fromTo(this.item, fall, { y: this.item.y - Game.TILE * mult }, { y: this.item.y });
        }
        if (t == 0 && this.counted) {
            this.counted = false;
            TweenMax.fromTo(this._points, 0.75, {alpha: 1}, {alpha: 0});
            TweenMax.fromTo(this._points.scale, 0.75, { x: 1, y: 1 }, { x: 0, y: 0 });
        }

        this.type = t;
        this.item.texture = this._itemTextures[this.type];
        this.item.alpha = 1;
        this.item.rotation = 0;
        this.item.scale.set(1);
    }

    public onTileFall(event: string): void {
        if (this.parent && event != "")
            this.parent.emit(event);
    }

    // Подсветка клетки
    public highlight(hide: boolean): void {
        this.highlighted = true;
    }

    // Отмена подсветки клетки
    public unHighlight(): void {
        this.highlighted = false;
    }

    // Переключатель воздействия на элементы пользователем
    public switchInteractive(interactive: boolean): void {
        this.item.interactive = interactive;
        this.item.buttonMode = interactive;
    }
}