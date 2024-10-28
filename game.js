const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 670,
    scene: {
        preload: preload,
        create: create,
    }
};

const game = new Phaser.Game(config);

const words = ["SEAT", "SET", "EAST", "TEA", "EAT"];
const wordsLetters = words.map(word => word.split(''));

const rows = 15;
const cols = 15;
const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () =>
    ({ isFilled: false, letter: '', usedForConnection: false })));

const placedWordsInfo = [];

let gameover = false;

function preload() {
    this.cameras.main.setBackgroundColor('#3600db');
}

function create() {
    createBoxes.call(this);
    createRefreshButton.call(this);
    play.call(this);
    drawLetters.call(this);
}

function play() {
    shuffle(wordsLetters);
    placeFirstWord.call(this);
    placeOtherWords.call(this);
}

function placeFirstWord() {
    placedWordsInfo.length = 0; // clear the array

    const firstWord = wordsLetters[0];

    const firstWordDirection = Phaser.Math.Between(0, 1); // 0 = horizontal, 1 = vertical

    let x, y;

    if (firstWordDirection === 0) {
        y = Math.floor((cols - firstWord.length) / 2);
        x = Math.floor(rows / 2);

        for (let i = 0; i < firstWord.length; i++) {
            grid[x][y + i].isFilled = true;
            grid[x][y + i].letter = firstWord[i];
        }
    } else {
        y = Math.floor(cols / 2);
        x = Math.floor((rows - firstWord.length) / 2);

        for (let i = 0; i < firstWord.length; i++) {
            grid[x + i][y].isFilled = true;
            grid[x + i][y].letter = firstWord[i];
        }
    }

    placedWordsInfo.push({ placedWord: firstWord, direction: firstWordDirection, startRow: x, startCol: y });
}

function placeOtherWords() {
    for (let i = 1, indexOfSelectedWordToConnect = 0; i < wordsLetters.length; i++) {
        const word = wordsLetters[i];

        const selectedWordToConnect = placedWordsInfo[indexOfSelectedWordToConnect];

        const commonLetters = findCommonLetters(word, selectedWordToConnect);
        shuffle(commonLetters);

        let placed;
        for (const commonLetter of commonLetters) {
            if (selectedWordToConnect.direction === 0) {
                if (checkUnwantedSituationVertical(word, commonLetter, selectedWordToConnect)) {
                    placed = false;
                    continue;
                }
                placeWordVertical(word, commonLetter, selectedWordToConnect);
                placed = true;
                indexOfSelectedWordToConnect = 0;
                shuffle(placedWordsInfo);
                break;
            } else {
                if (checkUnwantedSituationHorizontal(word, commonLetter, selectedWordToConnect)) {
                    placed = false;
                    continue;
                }
                placeWordHorizontal(word, commonLetter, selectedWordToConnect);
                placed = true;
                indexOfSelectedWordToConnect = 0;
                shuffle(placedWordsInfo);
                break;
            }
        }

        if (!placed) {
            i--;
            indexOfSelectedWordToConnect++;
            if (indexOfSelectedWordToConnect === placedWordsInfo.length) {
                gameover = true;
                break;
            }
        }
    }

    if (gameover) {
        gameover = false;
        resetGrid.call(this);
        clearLetters.call(this);
        play.call(this);
    }
}

function checkUnwantedSituationVertical(word, commonLetter, selectedWordToConnect) {
    const y = selectedWordToConnect.startCol + commonLetter.indexInConnectedWord;
    const x = selectedWordToConnect.startRow;

    for (let i = commonLetter.indexInWord + 1; i < word.length; i++) {
        if (grid[x + (i - commonLetter.indexInWord)][y].isFilled) {
            return true; // Collision detected
        }

        if (grid[x + (i - commonLetter.indexInWord)][y - 1].isFilled ||
            grid[x + (i - commonLetter.indexInWord)][y + 1].isFilled ||
            grid[x + (i - commonLetter.indexInWord) + 1][y].isFilled) {
            return true; // Side by side letters detected
        }
    }

    for (let i = commonLetter.indexInWord - 1; i >= 0; i--) {
        if (grid[x - (commonLetter.indexInWord - i)][y].isFilled) {
            return true; // Collision detected
        }

        if (grid[x - (commonLetter.indexInWord - i)][y - 1].isFilled ||
            grid[x - (commonLetter.indexInWord - i)][y + 1].isFilled ||
            grid[x - (commonLetter.indexInWord - i) - 1][y].isFilled) {
            return true; // Side by side letters detected
        }
    }

    return false; // No collision or side by side letters
}

function checkUnwantedSituationHorizontal(word, commonLetter, selectedWordToConnect) {
    const x = selectedWordToConnect.startRow + commonLetter.indexInConnectedWord;
    const y = selectedWordToConnect.startCol;

    for (let i = commonLetter.indexInWord + 1; i < word.length; i++) {
        if (grid[x][y + (i - commonLetter.indexInWord)].isFilled) {
            return true; // Collision detected
        }

        if (grid[x - 1][y + (i - commonLetter.indexInWord)].isFilled ||
            grid[x + 1][y + (i - commonLetter.indexInWord)].isFilled ||
            grid[x][y + (i - commonLetter.indexInWord) + 1].isFilled) {
            return true; // Side by side letters detected
        }
    }

    for (let i = commonLetter.indexInWord - 1; i >= 0; i--) {
        if (grid[x][y - (commonLetter.indexInWord - i)].isFilled) {
            return true; // Collision detected
        }

        if (grid[x - 1][y - (commonLetter.indexInWord - i)].isFilled ||
            grid[x + 1][y - (commonLetter.indexInWord - i)].isFilled ||
            grid[x][y - (commonLetter.indexInWord - i) - 1].isFilled) {
            return true; // Side by side letters detected
        }
    }

    return false; // No collision
}

function placeWordVertical(word, commonLetter, selectedWordToConnect) {
    const y = selectedWordToConnect.startCol + commonLetter.indexInConnectedWord;
    const common = selectedWordToConnect.startRow;

    grid[common][y].usedForConnection = true;

    let info = { placedWord: word, direction: 1, startRow: common, startCol: y };

    let x;
    for (let i = commonLetter.indexInWord + 1; i < word.length; i++) {
        x = common + (i - commonLetter.indexInWord);
        grid[x][y].isFilled = true;
        grid[x][y].letter = word[i];
    }

    for (let i = commonLetter.indexInWord - 1; i >= 0; i--) {
        x = common - (commonLetter.indexInWord - i);
        grid[x][y].isFilled = true;
        grid[x][y].letter = word[i];
        info.startRow = x;
    }

    placedWordsInfo.push(info);
}

function placeWordHorizontal(word, commonLetter, selectedWordToConnect) {
    const x = selectedWordToConnect.startRow + commonLetter.indexInConnectedWord;
    const common = selectedWordToConnect.startCol;

    grid[x][common].usedForConnection = true;

    let info = { placedWord: word, direction: 0, startRow: x, startCol: common };

    let y;
    for (let i = commonLetter.indexInWord + 1; i < word.length; i++) {
        y = common + (i - commonLetter.indexInWord);
        grid[x][y].isFilled = true;
        grid[x][y].letter = word[i];
    }

    for (let i = commonLetter.indexInWord - 1; i >= 0; i--) {
        y = common - (commonLetter.indexInWord - i);
        grid[x][y].isFilled = true;
        grid[x][y].letter = word[i];
        info.startCol = y;
    }

    placedWordsInfo.push(info);
}

function findCommonLetters(word, selectedWordToConnect) {
    const commonLetters = [];

    for (let i = 0; i < word.length; i++) {
        for (let j = 0; j < selectedWordToConnect.placedWord.length; j++) {
            if (word[i] === selectedWordToConnect.placedWord[j]) {
                const x = findCoordinatesOfCommonLetter(j, selectedWordToConnect).x;
                const y = findCoordinatesOfCommonLetter(j, selectedWordToConnect).y;

                if (!grid[x][y].usedForConnection) {
                    commonLetters.push({ indexInWord: i, indexInConnectedWord: j, letter: word[i] });
                }
            }
        }
    }

    return commonLetters;
}

function findCoordinatesOfCommonLetter(j, selectedWordToConnect) {
    if (selectedWordToConnect.direction === 0) {
        return { x: selectedWordToConnect.startRow, y: selectedWordToConnect.startCol + j };
    }
    else {
        return { x: selectedWordToConnect.startRow + j, y: selectedWordToConnect.startCol };
    }
}

function drawLetters() {
    grid.forEach(row => {
        row.forEach(cell => {
            const box = cell.box;
            this.add.text(box.x, box.y, cell.letter, {
                fontSize: '25px',
                fontFamily: 'Arial',
                fill: 'black'
            }).setOrigin(0.5);
        });
    });
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function createBoxes() {
    const boxWidth = 35;
    const boxHeight = 35;
    const space = 5;

    const totalWidth = cols * boxWidth + (cols - 1) * space;
    const totalHeight = rows * boxHeight + (rows - 1) * space;

    const startX = (this.cameras.main.width - totalWidth) / 4;
    const startY = (this.cameras.main.height - totalHeight) / 2;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = startX + col * (boxWidth + space);
            const y = startY + row * (boxHeight + space);

            const box = this.add.rectangle(x, y, boxWidth, boxHeight, 0xADD8E6).setStrokeStyle(2, 0x000000);

            grid[row][col].box = box;
        }
    }
}

function createRefreshButton() {
    const buttonX = this.cameras.main.width - 235;
    const buttonY = this.cameras.main.height / 2;

    const button = this.add.rectangle(buttonX, buttonY, 120, 45, 0xbf0000)
        .setOrigin(0.5)
        .setInteractive()
        .setStrokeStyle(2, 0x000000);

    this.add.text(buttonX, buttonY, 'Refresh', {
        fontSize: '25px',
        fontFamily: 'Arial',
        fill: 'black'
    }).setOrigin(0.5);

    button.on('pointerover', () => {
        this.input.setDefaultCursor('pointer');
    });
    button.on('pointerout', () => {
        this.input.setDefaultCursor('');
    });

    button.on('pointerup', () => {
        resetGrid.call(this);
        clearLetters.call(this);
        play.call(this);
        drawLetters.call(this);
    });
}

function resetGrid() {
    grid.forEach(row => {
        row.forEach(cell => {
            if (cell.isFilled) {
                cell.isFilled = false;
                cell.letter = '';
                cell.usedForConnection = false;
            }
        });
    });
}

function clearLetters() {
    const boxWidth = 40;
    const boxHeight = 40;
    const space = 5;

    const startX = (this.cameras.main.width - (cols * boxWidth + (cols - 1) * space)) / 4;
    const startY = (this.cameras.main.height - (rows * boxHeight + (rows - 1) * space)) / 2;

    const texts = this.children.list.filter(child => child instanceof Phaser.GameObjects.Text);

    texts.forEach(text => {
        const cellX = Math.floor((text.x - startX) / (boxWidth + space));
        const cellY = Math.floor((text.y - startY) / (boxHeight + space));

        if (cellX >= 0 && cellX < cols && cellY >= 0 && cellY < rows) {
            //text.destroy();
            text.setText("");
        }
    });
}