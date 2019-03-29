const GAME_DATA = {
    rows: [562, 479, 396, 313, 230, 147, 64, -19],
    sprites: {
        2: ['images/enemy-car-blue.png', 127],
        3: ['images/enemy-car-red.png', 127],
        4: ['images/enemy-car-yellow.png', 101],
        5: ['images/enemy-car.png', 101],
        6: ['images/enemy-truck.png', 202],
        7: ['images/gem-green.png', 61]
    },
    players: {
        frog: {
            up: 'images/char-frog.png',
            down: 'images/char-frog-down.png',
            left: 'images/char-frog-left.png',
            right: 'images/char-frog-right.png',
            smash: 'images/char-frog-smash.png',
            bye: [
                'images/byeFrog/char-frog-smash1.png',
                'images/byeFrog/char-frog-smash2.png',
                'images/byeFrog/char-frog-smash3.png',
                'images/byeFrog/char-frog-smash4.png'
            ]
        }
    },
    edges: {
        right: 999,
        left: -222,
        total: 1221
    }
}

class Enemy {
    constructor(row = 2, speed = 9) {
        this.x = 0;
        this.y = GAME_DATA.rows[row];
        this.speed = speed;     // time in seconds to complete the screen
        this.active = false; 
        this.sprite = GAME_DATA.sprites[row][0]; 
        this.width =  GAME_DATA.sprites[row][1]; // needed for collision check
    }

    engineOn() {
        this.active = true;
    }

    engineOff() {
        this.active = false;
    }
    // Update the enemy's position. Parameter: dt, a time delta between ticks, ensure the game runs at the same speed for all computers.
    update(dt) {
        if(this.active) {
            let step = (dt * GAME_DATA.edges['total']) / this.speed;
            this.x += step;
        }
    }
    // Draw the enemy on the screen, required method for game
    render() {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    }
}

class EnemyLeft extends Enemy {
    constructor(row, speed) {
        super(row, speed);
        this.x = GAME_DATA.edges['left'];
    }

    update(dt) {
        super.update(dt);
        if (this.x > GAME_DATA.edges['right']) {
            this.x = GAME_DATA.edges['left'] ;
        }
    }
}

class EnemyRight extends Enemy {
    constructor(row, speed) {
        super(row, speed);
        this.x = GAME_DATA.edges['right'] ;
        this.speed *= -1;
    }

    update(dt) {
        super.update(dt);
        if (this.x < GAME_DATA.edges['left']) {
            this.x = GAME_DATA.edges['right'] ;
        }
    }
}

class Winner extends Enemy {
    constructor(speed = 300) {
        super(7, speed);
        this.currentLevel = 'level_1';
    }

    update(dt) {
        super.update(dt);
        if (this.x > 909) {
            this.x = -this.width;
        }
    }
}

// Now write your own player class. This class requires an update(), render() and a handleInput() method.
class Player {
    constructor(look) {
        this.x = 404;
        this.y = GAME_DATA.rows[0];
        this.row = 0;
        this.sprites = GAME_DATA.players[look];
        this.sprite = this.sprites['up'];
        this.allowMove = true;
    }

    reset() {
        this.x = 404;
        this.y = GAME_DATA.rows[0];
        this.row = 0;
        this.sprite = this.sprites['up'];
        this.allowMove = true;
    }

    update() {
        if ((this.row > 1) && (this.row < 7)) {
            let enemyCheck = enemiesHolder[`${this.row}`];                          // checks only in the relevant row
            for (let enemy of enemyCheck) {
                // check collision!~!!!!!!                                          // the '-25' adds a "run-over" effect by the cars
                if ((enemy.x + enemy.width - 25 > this.x) && (enemy.x < this.x + 101 - 25 )) {
                    this.row = -99;                                                 // prevents more collision checks + prevents player movement
                    this.allowMove = false;
                    const self = this;                                              // keep instnace of 'this' for the animation function
                    let i = 0;
                    const byeAnimation = setInterval(function() {                   // starts animation
                        self.sprite = self.sprites['bye'][i];
                        i += 1;
                        (enemy.active) ? enemy.engineOff() : enemy.engineOn();      // makes running-over effect for the car
                        if (i === 4) {
                            clearInterval(byeAnimation);                            // ends the animation
                        }
                    }, 75);
                    setTimeout(() => { this.reset(); }, 800);                      // restart the player
                }
            }
        }
        // check collision with the winner objects
        else if (this.row === 7) {
            let winnerCheck = enemiesHolder[`${this.row}`][0];
            if ((winnerCheck.x + winnerCheck.width > this.x) && (winnerCheck.x < this.x + 101)) {
                this.row = 99;
                setTimeout(() => { nextLevel(winnerCheck.currentLevel); }, 500);                      // next level
            }
        }
    }
    
    render() {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    }

    handleInput(keyClick) {
        if((keyClick === 'up') && (this.y > GAME_DATA.rows[7])) {
            this.y -= 83;
            this.row += 1;
            this.sprite = this.sprites['up'];
        }
        else if((keyClick === 'down') && (this.y < GAME_DATA.rows[0])) {
            this.y += 83;
            this.row -= 1;
            this.sprite = this.sprites['down'];
        }
        else if((keyClick === 'left') && (this.x > 0)){
            this.x -= 101;
            this.sprite = this.sprites['left'];
        }
        else if((keyClick === 'right') && (this.x < 808)) {
            this.x += 101;
            this.sprite = this.sprites['right'];
        }
    }
};

// Now instantiate your objects. // Place all enemy objects in an array called allEnemies // Place the player object in a variable called player
let allEnemies = [];

// expected to recieve enemies as objects, ordered by row number - being created each level
const enemiesHolder = {
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: []
};

// Level structure: row, speed [enemies intervals 0%-100%]
// intervals number = enemies number, Row 7 is the 'winner' spot, from [0-66]
const levels = {
    level_1: [[],
        [],
        [2, 11, [18, 82]],
        [3, 10, [18, 82]],
        [4, 10, [16, 82]],
        [5, 8, [18, 84]],
        [6, 9, [24, 82]],
        [7, 300, [0]]
    ],

    level_2: [[],
        [],
        [2, 9, [8, 82]],
        [3, 8, [18, 92]],
        [4, 8, [8, 82]],
        [5, 6, [18, 92]],
        [6, 7, [8, 82]],
        [7, -240, [66]]
    ],

    level_3: [[],
        [],
        [2, 8, [35, 65, 95]],
        [3, 7, [10, 30, 70]],
        [4, 7, [20, 40, 80]],
        [5, 3, [60]],
        [6, 6, [30, 80]],
        [7, 180, [22]]
    ],

    level_4: [[],
        [],
        [2, 7, [15, 35, 55]],
        [3, 7, [10, 30, 70, 90]],
        [4, 6, [20, 40, 80]],
        [5, 3, [50, 85]],
        [6, 5, [30, 80]],
        [7, 120, [44]]
    ],

    game_over: [[],
        [],
        [2, 999, [18, 46, 70]],
        [3, 888, [10, 40, 70, 90]],
        [4, 999, [18, 42, 62, 80]],
        [5, 777, [15, 50, 85]],
        [6, 555, [18, 80]],
        [7, 222, [11, 33, 55, 77]]
    ]
}

const player = new Player('frog');

// Recieves an array in the level format above
function BuildLevel([row, speed, intervals = [50]]) {
    //Trasnforms intervals to locations on x-axis
    intervals = intervals.map(function(inter){
        inter = GAME_DATA.edges['total'] * (inter/100)
        return inter;
    });
    //Creates enemies, place them into the enemies object by row
    for (let i = 0; i < intervals.length; i++) {
        if (row !== 7) {
            let enemy = {};

            if (row%2 === 0) {
                enemy = new EnemyRight(row, speed);
                enemy.x -= intervals[i];
            } else {
                enemy = new EnemyLeft(row, speed);
                enemy.x += intervals[i];
            }
            enemiesHolder[`${row}`].push(enemy);
        }
        // if it's row 7, create the winner object
        else {
            let winner = new Winner(speed);
            winner.x += intervals[i];
            enemiesHolder[`${row}`].push(winner);
        }
    }
}

function startGame(level) {
    // reset enemies and creates the level enemies if recieved a level, otherwise just erase the board
    for (let i = 2; i <= 7; i++) {
        enemiesHolder[i] = [];
        if(level) BuildLevel(level[i]);
    }
    /* Turn object into many arrays, than, into one array - for the render method of the engine.*/
    let enemyArrays = Object.values(enemiesHolder);
    allEnemies = [].concat.apply([], enemyArrays);

    setTimeout(() => {
        allEnemies.forEach(enemy => enemy.engineOn()); 
    }, 1500);

    player.reset();
}

function nextLevel(finishedLevel) {
    // keep the levels names
    let all_levels = Object.keys(levels);
    for (let i = 0; i < all_levels.length; i++) {
        if (finishedLevel === all_levels[i]) {
            // keeps the next level data
            let nextLevel = all_levels[i+1];
            startGame(levels[nextLevel]);
            if (nextLevel !== 'game_over') {
                // saves the level in the new winner object
                enemiesHolder['7'][0].currentLevel = nextLevel;
            }
            else {
                player.row = 8; // creates god mode
                console.log("game over");
            }
            break;
        }
    }
}

document.addEventListener('keydown', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        49: 'level1',
        50: 'level2',
        51: 'level3',
        52: 'level4',
        53: 'game over',
    };
    if ((player.allowMove) && (e.keyCode >= 37) && (e.keyCode <= 40)) {
        player.handleInput(allowedKeys[e.keyCode]);
        player.allowMove = false;
    }
    // cheats
    else if ((e.keyCode >= 49) && (e.keyCode <= 53)) {
        let num = (48 - e.keyCode) * -1;
        if (e.keyCode < 53) {
            startGame(levels[`level_${num}`]); 
        }
        else {
            if (e.keyCode === 53)
            startGame(levels['game_over']);
            player.row = 8;
        }
    }
});

document.addEventListener('keyup', function(e) {
    if (player.row >= 0) {
        player.allowMove = true;
    }
});

// starts the game!
startGame(levels['level_1']);