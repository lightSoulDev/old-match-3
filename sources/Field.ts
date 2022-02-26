import Container = PIXI.Container;
import Graphics = PIXI.Graphics;
import { Game } from "./Game";
import { Tile } from "./Tile";
import { Plate } from "./Plate";

declare let TweenMax: any;
declare let TimelineMax: any;

export class Field extends Container {

    private _tiles: Tile[][];
    private _plates: Plate[][];
    private _selectedTile: Tile;
    private _oresCount: number = 5;

    public setOresCount(value: number): void {
        this._oresCount = value;
    }

    private _rectMask: Graphics;

    constructor() {
        super();

        this._rectMask = new Graphics();
        this.addChild(this._rectMask);

        this._rectMask.position.x = 0;
        this._rectMask.position.y = 0;
        this._rectMask.lineStyle(0);
        this._rectMask.beginFill(0xffffff, 1);
        this._rectMask.drawRect((Game.WIDTH - 8 * Game.TILE) / 2, (Game.HEIGHT - 8 * Game.TILE) / 2 + 100, Game.TILE * 8, Game.TILE * 8);

        this.mask = this._rectMask;

        let paddingX = (Game.WIDTH - 8 * Game.TILE) / 2;
        let paddingY = (Game.HEIGHT - 8 * Game.TILE) / 2 + 100;

        this._plates = new Array<Plate[]>(8);
        for (let i = 0; i < 8; i++) {
            this._plates[i] = new Array<Plate>(8);
            for (let j = 0; j < 8; j++) {
                this._plates[i][j] = new Plate();
                this._plates[i][j].position.set(paddingX + j * Game.TILE, paddingY + i * Game.TILE);
                this.addChild(this._plates[i][j]);
            }
        }
        this.on('eventSetField', this.generateField);
    }

    public getSelectedTile(): Tile {
        return this._selectedTile;
    }

    public setSelectedTile(value: Tile): void {
        this._selectedTile = value;
    }


    private startGame(): void {
        this.parent.emit("eventTimerStart");
        this.animateDestroy(this.findMatches());
    }

    private checkField(): void {
        this.animateDestroy(this.findMatches());
    }

    // Унтичтожение игрового поля
    private destroyField(): void {
        if (this._tiles == null) return;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                this._tiles[i][j].destroy();
            }
        }
    }

    private getRandomType() {
        let type = Math.floor(Math.random() * this._oresCount) + 1;
            if (Math.floor(Math.random() * 8) == 2) {
                type = 6;
            }
        return type;
    }

    // Генерация игрового поля заполненного тайлами
    private generateField(): void {
        if (this._tiles != null) {
            this.destroyField();
            this._tiles = null;
        }
        this._tiles = new Array<Tile[]>(8);

        let paddingX = (Game.WIDTH - 8 * Game.TILE) / 2;
        let paddingY = (Game.HEIGHT - 8 * Game.TILE) / 2 + 100;

        for (let i = 0; i < 8; i++) {
            this._tiles[i] = new Array<Tile>(8);
            for (let j = 0; j < 8; j++) {
                let type = this.getRandomType();
                
                this._tiles[i][j] = new Tile(this, this._plates[i][j], [i, j]);
                this.addChild(this._tiles[i][j]);

                this._tiles[i][j].position.set(paddingX + j * Game.TILE, paddingY + i * Game.TILE);
                this._tiles[i][j].setUp(type, 1.5, 8);
            }
        }

        // Блокировка шариков в полёте
        this.switchInteractive(false);

        let tl = new TimelineMax({ repeat: 1, repeatDelay: 1.7, onComplete: this.startGame.bind(this) });
    }

    // Генерация тайлов после их уничтожения
    private generateTiles(): void {
        for (let i = 0; i < this._tiles.length; i++) {
            for (let j = 0; j < this._tiles[i].length; j++) {
                if (this._tiles[i][j].type == 0)
                    this._tiles[i][j].setType(this.getRandomType(), 0.5, 2);
            }
        }

        let tl = new TimelineMax({ repeat: 1, repeatDelay: 0.5, onComplete: this.checkField.bind(this) });
    }

    // Переключатель воздействия на элементы пользователем
    public switchInteractive(interactive: boolean) {
        for (let i = 0; i < this._tiles.length; i++) {
            for (let j = 0; j < this._tiles[i].length; j++) {
                this._tiles[i][j].switchInteractive(interactive);
            }
        }
    }

    // Подсветка соседнего тайла, елси онн образует новую комбинацию
    public createsNewMatch(s: Tile, n: Tile) {
        let temp = n.type;
        let currentMatches = this.findMatches().length;
        n.type = s.type;
        s.type = temp;
        let newMatches = this.findMatches().length;
        s.type = n.type;
        n.type = temp;

        if (newMatches > currentMatches)
            return true;

        return false;
    }

    public areNeighbours(a: Tile, b: Tile = this._selectedTile): boolean {
        return (Math.abs(a.pos.x - b.pos.x) + Math.abs(a.pos.y - b.pos.y)) == 1
    }
    // Подсветка клеток на которые возможно походить
    public highlightNeighbours(a: Tile, hide: boolean = false): void {
        // Верхний равен верхнему тайлу от текущего и проверки строки над вернхим тайлом, либо null
        let upper = this._tiles[a.pos.x - 1] && this._tiles[a.pos.x - 1][a.pos.y];
        let right = this._tiles[a.pos.x] && this._tiles[a.pos.x][a.pos.y + 1];
        let bottom = this._tiles[a.pos.x + 1] && this._tiles[a.pos.x + 1][a.pos.y];
        let left = this._tiles[a.pos.x] && this._tiles[a.pos.x][a.pos.y - 1];

        if (upper && this.createsNewMatch(a, upper))
            upper.highlight(hide);
        if (right && this.createsNewMatch(a, right))
            right.highlight(hide);
        if (bottom && this.createsNewMatch(a, bottom))
            bottom.highlight(hide);
        if (left && this.createsNewMatch(a, left))
            left.highlight(hide);
    }

    //  Отключение подсветки клеток на которые возможно походить
    public unHighlightNeighbours(a: Tile): void {
        // Верхний равен верхнему тайлу от текущего и проверки строки над вернхим тайлом, либо null
        let upper = this._tiles[a.pos.x - 1] && this._tiles[a.pos.x - 1][a.pos.y];
        let right = this._tiles[a.pos.x] && this._tiles[a.pos.x][a.pos.y + 1];
        let bottom = this._tiles[a.pos.x + 1] && this._tiles[a.pos.x + 1][a.pos.y];
        let left = this._tiles[a.pos.x] && this._tiles[a.pos.x][a.pos.y - 1];

        if (upper && upper.highlighted) upper.unHighlight();
        if (right && right.highlighted) right.unHighlight();
        if (bottom && bottom.highlighted) bottom.unHighlight();
        if (left && left.highlighted) left.unHighlight();
    }

    // Гравитация или генерация шариков
    public dropTiles(): void {
        let shiftsCounter = this.dropLine();
        let tl = new TimelineMax({ repeat: 1, repeatDelay: 0.225, onComplete: this.checkLineDrop.bind(this, shiftsCounter) });
    }

    private checkLineDrop(shiftsCounter: number): void {
        if (shiftsCounter > 0)
            this.dropTiles();
        else
            this.generateTiles();
    }

    // Сдвиг шариков, если над пустой клеткой есть шарик
    private dropLine(): number {
        let shiftsCounter = 0;
        for (let j = 0; j < this._tiles.length; j++) {
            for (let i = this._tiles[j].length - 1; i >= 0; i--) {
                if (this._tiles[i][j].type == 0) {
                    if (this._tiles[i - 1]) {
                        if (this._tiles[i - 1][j].type != 0) shiftsCounter += 1;
                        this._tiles[i][j].setType(this._tiles[i - 1][j].type, 0.2);
                        this._tiles[i - 1][j].setType(0);
                    }
                }
            }
        }
        return shiftsCounter;
    }

    // Удаление совпадений
    private destroyMatches(matches: Tile[][]): void {
        for (let i = 0; i < matches.length; i++) {
            for (let j = 0; j < matches[i].length; j++) {
                let t = matches[i][j];
                // this._tiles[t.pos.x][t.pos.y].counted = false;
                this._tiles[t.pos.x][t.pos.y].setType(0);
            }
        }
        let tl = new TimelineMax({ repeat: 1, repeatDelay: 0.25, onComplete: this.dropTiles.bind(this) });
    }

    private getBlowArea(a: Tile) {
        let upper = this._tiles[a.pos.x - 1] && this._tiles[a.pos.x - 1][a.pos.y];
        let right = this._tiles[a.pos.x] && this._tiles[a.pos.x][a.pos.y + 1];
        let bottom = this._tiles[a.pos.x + 1] && this._tiles[a.pos.x + 1][a.pos.y];
        let left = this._tiles[a.pos.x] && this._tiles[a.pos.x][a.pos.y - 1];

        let leftupper = this._tiles[a.pos.x - 1] && this._tiles[a.pos.x - 1][a.pos.y - 1];
        let rightupper = this._tiles[a.pos.x - 1] && this._tiles[a.pos.x - 1][a.pos.y + 1];
        
        let leftbottom = this._tiles[a.pos.x + 1] && this._tiles[a.pos.x + 1][a.pos.y - 1];
        let rightbottom = this._tiles[a.pos.x + 1] && this._tiles[a.pos.x + 1][a.pos.y + 1];

        let result: Tile[] = new Array<Tile>();

        if (upper && upper.type != 6) result.push(upper);
        if (right && right.type != 6) result.push(right);
        if (bottom && bottom.type != 6) result.push(bottom);
        if (left && left.type != 6) result.push(left);
        if (leftupper && leftupper.type != 6) result.push(leftupper);
        if (rightupper && rightupper.type != 6) result.push(rightupper);
        if (leftbottom && leftbottom.type != 6) result.push(leftbottom);
        if (rightbottom && rightbottom.type != 6) result.push(rightbottom);

        return result;
    }

    // Анимация удаления совпадений
    private animateDestroy(matches: Tile[][]): void {
        if (matches.length > 0) {
            this.switchInteractive(false);
            for (let i = 0; i < matches.length; i++) {
                for (let j = 0; j < matches[i].length; j++) {
                    if (!matches[i][j].counted ) {
                        this.parent.emit('eventComboUp', matches[i][j].value);
                        let game = this.parent as Game;
                        matches[i][j].blow(game.combo);
                        if (matches[i][j].type == 6) {
                            let blow = this.getBlowArea(matches[i][j]);
                            matches.push(blow);
                        }
                    }
                }
            }

            createjs.Sound.play(Game.SOUND_DESTROY, createjs.Sound.INTERRUPT_ANY, 0, 0, 0, 1);
            let tl = new TimelineMax({ repeat: 1, repeatDelay: 0.425, onComplete: this.destroyMatches.bind(this, matches) });
        } else {
            this.switchInteractive(true);
            this.parent.emit('eventComboEnd');
        }
    }

    // Поиск возможных совпадений по горизонтали и цвертикали
    public findMatches(): Tile[][] {
        let v_matches: Tile[][] = new Array();
        let h_matches: Tile[][] = new Array();
        let v_temp: Tile[];
        let h_temp: Tile[];

        let matches: Tile[][] = new Array();

        for (let i = 0; i < this._tiles.length; i++) {
            for (let j = 1; j < this._tiles[i].length; j++) {
                if (this._tiles[i][j].type == this._tiles[i][j - 1].type && this._tiles[i][j].type != 0) {
                    if (h_temp == null) {
                        h_temp = new Array();
                        h_temp.push(this._tiles[i][j - 1]);
                        h_temp.push(this._tiles[i][j]);
                    } else {
                        h_temp.push(this._tiles[i][j]);
                    }
                } else {
                    if (h_temp != null) {
                        if (h_temp.length > 2){
                            h_matches.push(h_temp);
                        }
                        h_temp = null;
                    }
                }
            }
            if (h_temp != null) {
                if (h_temp.length > 2) {
                    h_matches.push(h_temp);
                }

                h_temp = null;
            }
        }

        for (let j = 0; j < this._tiles.length; j++) {
            for (let i = 1; i < this._tiles[j].length; i++) {
                if (this._tiles[i][j].type == this._tiles[i - 1][j].type && this._tiles[i][j].type != 0) {
                    if (v_temp == null) {
                        v_temp = new Array();
                        v_temp.push(this._tiles[i - 1][j]);
                        v_temp.push(this._tiles[i][j]);
                    } else {
                        v_temp.push(this._tiles[i][j]);
                    }
                } else {
                    if (v_temp != null) {
                        if (v_temp.length > 2)
                            v_matches.push(v_temp);

                        v_temp = null;
                    }
                }
            }
            if (v_temp != null) {
                if (v_temp.length > 2)
                    v_matches.push(v_temp);

                v_temp = null;
            }
        }

        if (v_matches.length > 0) {
            for (let i = 0; i < v_matches.length; i++) {
                matches.push(v_matches[i]);
            }
        }

        if (h_matches.length > 0) {
            for (let i = 0; i < h_matches.length; i++) {
                matches.push(h_matches[i]);
            }
        }

        return (matches);
    }
}