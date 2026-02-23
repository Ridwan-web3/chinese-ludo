// 飞行棋游戏 - 基于图片棋盘
const boardContainer = document.querySelector('.board-container');
const BOARD_SIZE = 600;

// 颜色定义
const COLORS = {
    red: { main: '#e74c3c', light: '#fadbd8', dark: '#c0392b', emoji: '🔴', name: '红色' },
    yellow: { main: '#f39c12', light: '#fdebd0', dark: '#d68910', emoji: '🟡', name: '黄色' },
    blue: { main: '#3498db', light: '#d6eaf8', dark: '#2980b9', emoji: '🔵', name: '蓝色' },
    green: { main: '#27ae60', light: '#d5f4e6', dark: '#229954', emoji: '🟢', name: '绿色' }
};

// 所有玩家颜色列表（用于布局和初始化）
const ALL_COLORS = ['red', 'yellow', 'blue', 'green'];

// 游戏中实际参与的玩家（在游戏开始时设置）
let activePlayers = [];

// 玩家顺序 - 按照顺时针：黄->蓝->红->绿（已废弃，使用 activePlayers）
const PLAYERS = ['yellow', 'blue', 'red', 'green'];

// 基地位置 - 用户标注的精确坐标
// 每个基地有4个圆形停机位
const HOME_POSITIONS = {
    yellow: [ // 左上角黄色基地
        { x: 81, y: 74 },
        { x: 127, y: 75 },
        { x: 127, y: 122 },
        { x: 81, y: 123 }
    ],
    blue: [   // 右上角蓝色基地
        { x: 473, y: 75 },
        { x: 518, y: 74 },
        { x: 517, y: 125 },
        { x: 472, y: 124 }
    ],
    red: [    // 右下角红色基地
        { x: 471, y: 488 },
        { x: 519, y: 488 },
        { x: 518, y: 535 },
        { x: 473, y: 535 }
    ],
    green: [  // 左下角绿色基地
        { x: 82, y: 487 },
        { x: 126, y: 487 },
        { x: 81, y: 536 },
        { x: 126, y: 536 }
    ]
};

// 各颜色起点位置（起飞后第一个停留位置，掷6点后从基地移动到这里）
const START_POSITIONS = {
    yellow: { x: 49, y: 188 },
    blue: { x: 411, y: 43 },
    red: { x: 549, y: 424 },
    green: { x: 188, y: 565 }
};

// 飞行通道配置 - 基于主路径索引
// 每个颜色的棋子停在触发索引时，自动飞到目标索引
const SHORTCUTS = {
    yellow: { trigger: 17, destination: 29 },    // 黄色: 17 → 29
    blue: { trigger: 30, destination: 42 },      // 蓝色: 30 → 42
    red: { trigger: 43, destination: 3 },        // 红色: 43 → 3 (跨越循环)
    green: { trigger: 4, destination: 16 }       // 绿色: 4 → 16
};

// 主路径上各颜色对应的格子索引（用于颜色飞跃）
// 当棋子停在自己颜色的格子上时，飞到下一个同色格子
// 根据用户标注的颜色代码：
// 黄色：1/5/9/13-49, 蓝色：2/6/10-50, 红色：3/7/11-51, 绿色：0/4/8-48
const PATH_COLORS = {
    yellow: [1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49],
    blue: [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50],
    red: [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51],
    green: [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48]
};

// 终点通道入口配置 - 各颜色在主路径上进入终点通道的索引
const FINISH_ENTRY_INDEX = {
    yellow: 49,   // 黄色在主路径索引49进入终点通道
    blue: 10,     // 蓝色在主路径索引10进入终点通道
    red: 23,      // 红色在主路径索引23进入终点通道
    green: 36     // 绿色在主路径索引36进入终点通道
};

// 各颜色在主路径中的起点索引（起飞后第一个停留后的下一步）
const PATH_START_INDEX = {
    yellow: 0,    // 黄色从主路径索引0开始: 0,1,2,3...
    blue: 13,     // 蓝色从主路径索引13开始: 13,14,15,16...
    red: 26,      // 红色从主路径索引26开始: 26,27,28...
    green: 39     // 绿色从主路径索引39开始: 39,40,41...
};

// 主路径 - 52个格子，沿着棋盘外圈顺时针（用户标注的精确坐标）
const MAIN_PATH = [
    { x: 91, y: 212 },   // 0
    { x: 122, y: 198 },  // 1
    { x: 151, y: 198 },  // 2
    { x: 183, y: 212 },  // 3
    { x: 209, y: 184 },  // 4
    { x: 195, y: 150 },  // 5
    { x: 196, y: 120 },  // 6
    { x: 209, y: 86 },   // 7
    { x: 241, y: 74 },   // 8
    { x: 270, y: 74 },   // 9
    { x: 300, y: 75 },   // 10
    { x: 330, y: 75 },   // 11
    { x: 358, y: 74 },   // 12
    { x: 390, y: 86 },   // 13
    { x: 404, y: 119 },  // 14
    { x: 404, y: 150 },  // 15
    { x: 390, y: 184 },  // 16
    { x: 416, y: 212 },  // 17
    { x: 448, y: 198 },  // 18
    { x: 477, y: 198 },  // 19
    { x: 508, y: 212 },  // 20
    { x: 519, y: 244 },  // 21
    { x: 518, y: 276 },  // 22
    { x: 520, y: 307 },  // 23
    { x: 519, y: 336 },  // 24
    { x: 519, y: 366 },  // 25
    { x: 508, y: 399 },  // 26
    { x: 477, y: 413 },  // 27
    { x: 447, y: 413 },  // 28
    { x: 416, y: 400 },  // 29
    { x: 391, y: 428 },  // 30
    { x: 405, y: 461 },  // 31
    { x: 404, y: 491 },  // 32
    { x: 390, y: 526 },  // 33
    { x: 358, y: 536 },  // 34
    { x: 328, y: 537 },  // 35
    { x: 299, y: 537 },  // 36
    { x: 270, y: 537 },  // 37
    { x: 239, y: 536 },  // 38
    { x: 210, y: 526 },  // 39
    { x: 195, y: 491 },  // 40
    { x: 196, y: 460 },  // 41
    { x: 210, y: 427 },  // 42
    { x: 182, y: 398 },  // 43
    { x: 151, y: 413 },  // 44
    { x: 122, y: 413 },  // 45
    { x: 90, y: 399 },   // 46
    { x: 81, y: 366 },   // 47
    { x: 79, y: 335 },   // 48
    { x: 80, y: 305 },   // 49
    { x: 80, y: 275 },   // 50
    { x: 82, y: 245 }    // 51
];

// 中心终点坐标（各颜色的最终目标）
const CENTER_FINISH = {
    yellow: { x: 274, y: 306 },  // 黄色中心终点
    blue: { x: 300, y: 278 },   // 蓝色中心终点
    red: { x: 325, y: 306 },   // 红色中心终点
    green: { x: 300, y: 333 }   // 绿色中心终点
};

// 终点通道 - 从主路径进入中心的6格路径
// 索引0在主路径上（入口），索引5是中心终点
const HOME_STRETCH = {
    yellow: [
        { x: 80, y: 306 },   // 入口（在主路径上）
        { x: 123, y: 305 },  // 第2格
        { x: 152, y: 305 },  // 第3格
        { x: 181, y: 305 },  // 第4格
        { x: 211, y: 305 },  // 第5格
        { x: 240, y: 305 }   // 第6格（接近中心）
    ],
    blue: [
        { x: 300, y: 75 },   // 入口（在主路径上）
        { x: 300, y: 118 },  // 第2格
        { x: 300, y: 150 },  // 第3格
        { x: 300, y: 181 },  // 第4格
        { x: 300, y: 211 },  // 第5格
        { x: 300, y: 242 }   // 第6格（接近中心）
    ],
    red: [
        { x: 520, y: 306 },  // 入口（在主路径上）
        { x: 477, y: 305 },  // 第2格
        { x: 448, y: 305 },  // 第3格
        { x: 418, y: 305 },  // 第4格
        { x: 389, y: 306 },  // 第5格
        { x: 359, y: 306 }   // 第6格（接近中心）
    ],
    green: [
        { x: 300, y: 536 },  // 入口（在主路径上）
        { x: 300, y: 492 },  // 第2格
        { x: 299, y: 461 },  // 第3格
        { x: 300, y: 430 },  // 第4格
        { x: 299, y: 399 },  // 第5格
        { x: 299, y: 369 }   // 第6格（接近中心）
    ]
};

// 游戏状态
let gameState = {
    activePlayers: [],      // 参与游戏的玩家颜色数组
    currentPlayerIndex: 0,  // 当前玩家在 activePlayers 中的索引
    diceValue: 0,
    diceRolled: false,
    pieces: {
        red: [
            { position: -1, finished: false },
            { position: -1, finished: false },
            { position: -1, finished: false },
            { position: -1, finished: false }
        ],
        yellow: [
            { position: -1, finished: false },
            { position: -1, finished: false },
            { position: -1, finished: false },
            { position: -1, finished: false }
        ],
        blue: [
            { position: -1, finished: false },
            { position: -1, finished: false },
            { position: -1, finished: false },
            { position: -1, finished: false }
        ],
        green: [
            { position: -1, finished: false },
            { position: -1, finished: false },
            { position: -1, finished: false },
            { position: -1, finished: false }
        ]
    },
    gameOver: false,
    pieceElements: {}
};

// 获取当前玩家颜色
function getCurrentPlayerColor() {
    return gameState.activePlayers[gameState.currentPlayerIndex];
}

// 检查玩家是否参与游戏
function isPlayerActive(color) {
    return gameState.activePlayers.includes(color);
}

// 获取棋子在主路径上的实际索引
function getMainPathIndex(color, position) {
    // position >= 1 表示在主路径上走过的步数
    // position = 1 对应 PATH_START_INDEX[color]
    // position = 2 对应 PATH_START_INDEX[color] + 1
    // 以此类推，需要计算循环

    const startIndex = PATH_START_INDEX[color];
    // position 1 = startIndex, position 2 = startIndex + 1, ...
    const actualIndex = (startIndex + position - 1) % 52;
    return actualIndex;
}

// 检查棋子是否在终点通道上
function isInFinishStretch(color, position) {
    const startIndex = PATH_START_INDEX[color];
    const finishEntry = FINISH_ENTRY_INDEX[color];

    // 计算当前在主路径上的索引
    let currentSteps = position; // 从起点开始走的步数
    const actualIndex = (startIndex + currentSteps - 1) % 52;

    // 检查是否已经经过了终点入口
    // 需要判断从起点走到当前索引是否经过了finishEntry
    if (finishEntry >= startIndex) {
        // 终点入口在起点后面（没有跨越循环边界）
        return actualIndex > finishEntry || currentSteps > (finishEntry - startIndex + 1);
    } else {
        // 终点入口在起点前面（跨越了循环边界）
        // 比如红色从26开始，终点入口是24，需要走到循环之后
        const stepsToEntry = (52 - startIndex) + finishEntry + 1;
        return currentSteps > stepsToEntry;
    }
}

// 获取棋子位置坐标
function getPieceCoordinates(color, pieceIndex) {
    const piece = gameState.pieces[color][pieceIndex];

    // 在基地
    if (piece.position === -1) {
        return HOME_POSITIONS[color][pieceIndex];
    }

    // 在起点位置（刚掷出6点起飞）
    if (piece.position === 0) {
        return START_POSITIONS[color];
    }

    // 已完成 - 返回到基地（停机坪）
    if (piece.finished) {
        // 完成的棋子按顺序回到基地的4个位置
        const finishedPieces = gameState.pieces[color].filter(p => p.finished);
        const finishedIndex = finishedPieces.findIndex(p => p === piece);
        return HOME_POSITIONS[color][finishedIndex];
    }

    // 检查是否在终点通道上
    if (isInFinishStretch(color, piece.position)) {
        // 计算在终点通道中的位置
        const startIndex = PATH_START_INDEX[color];
        const finishEntry = FINISH_ENTRY_INDEX[color];

        // 计算到达终点入口的步数
        let stepsToEntry;
        if (finishEntry >= startIndex) {
            stepsToEntry = finishEntry - startIndex + 1;
        } else {
            stepsToEntry = (52 - startIndex) + finishEntry + 1;
        }

        // 计算在终点通道中的索引（0-5）
        const finishIndex = piece.position - stepsToEntry;

        if (finishIndex < 6) {
            return HOME_STRETCH[color][finishIndex];
        } else if (piece.position >= 56) {
            return CENTER_FINISH[color];
        }
    }

    // 在主路径上
    const actualIndex = getMainPathIndex(color, piece.position);
    return MAIN_PATH[actualIndex];
}

// 创建棋子元素
function createPieceElement(color, index) {
    const piece = document.createElement('div');
    piece.className = `piece ${color}`;
    piece.id = `piece-${color}-${index}`;
    piece.textContent = index + 1;
    piece.onclick = () => handlePieceClick(color, index);

    const coords = getPieceCoordinates(color, index);
    // 不再使用-15偏移，直接使用用户标注的坐标作为棋子中心
    piece.style.left = coords.x + 'px';
    piece.style.top = coords.y + 'px';
    // 使用transform将棋子中心对齐到坐标点
    piece.style.transform = 'translate(-50%, -50%)';

    boardContainer.appendChild(piece);
    gameState.pieceElements[`${color}-${index}`] = piece;

    return piece;
}

// 移动棋子到新位置
function movePieceTo(color, index, animate = true) {
    const piece = gameState.pieces[color][index];
    const coords = getPieceCoordinates(color, index);
    const element = gameState.pieceElements[`${color}-${index}`];

    if (animate) {
        element.classList.add('moving');
    }

    // 直接使用用户标注的坐标，使用transform居中
    element.style.left = coords.x + 'px';
    element.style.top = coords.y + 'px';
    element.style.transform = 'translate(-50%, -50%)';

    if (piece.finished) {
        element.style.background = 'gold';
        element.textContent = '✓';
    }

    setTimeout(() => {
        element.classList.remove('moving');
    }, animate ? 500 : 0);
}

// 初始化所有棋子
function initializePieces() {
    // 只为参与游戏的玩家创建棋子
    gameState.activePlayers.forEach(color => {
        for (let i = 0; i < 4; i++) {
            createPieceElement(color, i);
        }
    });

    // 隐藏未参与玩家的面板
    ALL_COLORS.forEach(color => {
        if (!isPlayerActive(color)) {
            const panel = document.getElementById(`panel-${color}`);
            if (panel) panel.style.display = 'none';
        }
    });
}

// 掷骰子
function rollDice(color) {
    if (gameState.diceRolled || gameState.gameOver) return;

    // 验证是否是当前玩家的色子
    const currentPlayerColor = getCurrentPlayerColor();
    if (color !== currentPlayerColor) return;

    const dice = document.getElementById(`dice-${color}`);
    const rollBtn = document.getElementById(`rollBtn-${color}`);

    dice.classList.add('rolling');
    if (rollBtn) rollBtn.disabled = true;

    setTimeout(() => {
        gameState.diceValue = Math.floor(Math.random() * 6) + 1;
        const diceNumbers = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        dice.textContent = diceNumbers[gameState.diceValue - 1];
        dice.classList.remove('rolling');
        gameState.diceRolled = true;

        updateMessage(`${COLORS[currentPlayerColor].emoji}掷出了 ${gameState.diceValue} 点！`);

        setTimeout(() => checkMovablePieces(), 300);
    }, 500);
}

// 检查可移动的棋子
function checkMovablePieces() {
    const currentColor = getCurrentPlayerColor();
    const pieces = gameState.pieces[currentColor];
    const movable = [];

    document.querySelectorAll('.piece').forEach(p => p.classList.remove('selectable'));

    pieces.forEach((piece, index) => {
        if (piece.finished) return;

        if (piece.position === -1) {
            // 在基地，只有掷出6才能起飞
            if (gameState.diceValue === 6) {
                movable.push(index);
            }
        } else {
            // 在路径上，任何点数都可以移动（弹回规则）
            movable.push(index);
        }
    });

    if (movable.length === 0) {
        updateMessage('没有可移动的棋子');
        setTimeout(nextPlayer, 1500);
    } else if (movable.length === 1) {
        setTimeout(() => movePiece(movable[0]), 500);
    } else {
        updateMessage(`请选择棋子移动 (${movable.length}个可选)`);
        movable.forEach(index => {
            const element = gameState.pieceElements[`${currentColor}-${index}`];
            if (element) element.classList.add('selectable');
        });
    }
}

// 处理棋子点击
function handlePieceClick(color, index) {
    if (!gameState.diceRolled) return;
    if (color !== getCurrentPlayerColor()) return;

    const element = gameState.pieceElements[`${color}-${index}`];
    if (!element || !element.classList.contains('selectable')) return;

    movePiece(index);
}

// 移动棋子
function movePiece(pieceIndex) {
    const currentColor = getCurrentPlayerColor();
    const piece = gameState.pieces[currentColor][pieceIndex];

    document.querySelectorAll('.piece').forEach(p => p.classList.remove('selectable'));

    if (piece.position === -1) {
        piece.position = 0;
        movePieceTo(currentColor, pieceIndex);
        updateMessage('飞机起飞到起点！');
        updatePiecesStatus();

        setTimeout(() => {
            checkCapture(currentColor, pieceIndex);
            if (gameState.diceValue === 6 && !gameState.gameOver) {
                gameState.diceRolled = false;
                enableCurrentPlayerDice();
                updateMessage('掷出6点！再掷一次');
            } else if (!gameState.gameOver) {
                setTimeout(nextPlayer, 500);
            }
        }, 600);
        return;
    }

    piece.position += gameState.diceValue;

    // 到达中心终点（position >= 56）- 走完主路径50步 + 终点通道6格 = 56
    if (piece.position >= 56) {
        // 计算超出终点的步数
        const excess = piece.position - 56;

        if (excess === 0) {
            // 刚好到达终点
            piece.finished = true;
            piece.position = 56;
            movePieceTo(currentColor, pieceIndex);
            updateMessage('到达终点！🎉');
            updatePiecesStatus();
            checkWin(currentColor);

            if (gameState.diceValue === 6 && !gameState.gameOver) {
                gameState.diceRolled = false;
                enableCurrentPlayerDice();
                updateMessage('掷出6点！再掷一次');
            } else if (!gameState.gameOver) {
                setTimeout(nextPlayer, 1000);
            }
            return;
        } else {
            // 超过终点，弹回规则：从终点往回走
            piece.position = 56 - excess;
            movePieceTo(currentColor, pieceIndex);
            updateMessage(`超过终点，弹回${excess}步！↩️`);
            updatePiecesStatus();

            // 弹回后检查击落
            setTimeout(() => {
                checkCapture(currentColor, pieceIndex);

                if (gameState.diceValue === 6 && !gameState.gameOver) {
                    gameState.diceRolled = false;
                    enableCurrentPlayerDice();
                    updateMessage('掷出6点！再掷一次');
                } else if (!gameState.gameOver) {
                    setTimeout(nextPlayer, 500);
                }
            }, 600);
            return;
        }
    }

    movePieceTo(currentColor, pieceIndex);
    updatePiecesStatus();

    setTimeout(() => {
        // 检查是否触发飞行通道或颜色飞跃
        const shortcutResult = checkShortcut(currentColor, pieceIndex);

        if (shortcutResult.shouldFly) {
            // 触发飞行
            if (shortcutResult.flyType === 'shortcut') {
                updateMessage(`${COLORS[currentColor].emoji}触发飞行通道！✈️`);
            } else if (shortcutResult.flyType === 'color') {
                updateMessage(`${COLORS[currentColor].emoji}停在${COLORS[currentColor].name}格子上，飞跃！✈️`);
            }

            setTimeout(() => {
                // 飞行到目的地
                piece.position = shortcutResult.newPosition;
                movePieceTo(currentColor, pieceIndex);
                updatePiecesStatus();

                // 如果是颜色飞跃，需要再次检查是否在飞行通道入口
                // 如果是飞行通道，直接结束
                if (shortcutResult.flyType === 'color') {
                    setTimeout(() => {
                        // 再次检查飞行通道
                        const secondCheck = checkShortcut(currentColor, pieceIndex);
                        if (secondCheck.shouldFly && secondCheck.flyType === 'shortcut') {
                            // 触发飞行通道
                            updateMessage(`${COLORS[currentColor].emoji}触发飞行通道！✈️`);
                            setTimeout(() => {
                                piece.position = secondCheck.newPosition;
                                movePieceTo(currentColor, pieceIndex);
                                updatePiecesStatus();
                                setTimeout(() => {
                                    checkCapture(currentColor, pieceIndex);
                                    if (gameState.diceValue === 6 && !gameState.gameOver) {
                                        gameState.diceRolled = false;
                                        enableCurrentPlayerDice();
                                        updateMessage('掷出6点！再掷一次');
                                    } else if (!gameState.gameOver) {
                                        setTimeout(nextPlayer, 500);
                                    }
                                }, 600);
                            }, 500);
                        } else {
                            // 没有触发飞行通道，正常结束
                            setTimeout(() => {
                                checkCapture(currentColor, pieceIndex);
                                if (gameState.diceValue === 6 && !gameState.gameOver) {
                                    gameState.diceRolled = false;
                                    enableCurrentPlayerDice();
                                    updateMessage('掷出6点！再掷一次');
                                } else if (!gameState.gameOver) {
                                    setTimeout(nextPlayer, 500);
                                }
                            }, 600);
                        }
                    }, 500);
                } else {
                    // 飞行通道到达，直接结束
                    setTimeout(() => {
                        checkCapture(currentColor, pieceIndex);
                        if (gameState.diceValue === 6 && !gameState.gameOver) {
                            gameState.diceRolled = false;
                            enableCurrentPlayerDice();
                            updateMessage('掷出6点！再掷一次');
                        } else if (!gameState.gameOver) {
                            setTimeout(nextPlayer, 500);
                        }
                    }, 600);
                }
            }, 500); // 停顿500ms后飞行
        } else {
            // 正常移动，不飞行
            checkCapture(currentColor, pieceIndex);

            if (gameState.diceValue === 6 && !gameState.gameOver) {
                gameState.diceRolled = false;
                enableCurrentPlayerDice();
                updateMessage('掷出6点！再掷一次');
            } else if (!gameState.gameOver) {
                setTimeout(nextPlayer, 500);
            }
        }
    }, 600);
}

// 检查是否触发飞行通道或颜色飞跃
function checkShortcut(color, pieceIndex) {
    const piece = gameState.pieces[color][pieceIndex];

    // 只有在主路径上且未到达终点通道才能触发飞行
    if (piece.position === -1 || piece.finished || piece.position === 0) {
        return { shouldFly: false };
    }

    // 如果已经在终点通道，不能飞行
    if (isInFinishStretch(color, piece.position)) {
        return { shouldFly: false };
    }

    // 获取当前在主路径上的索引
    const currentIndex = getMainPathIndex(color, piece.position);

    // 【优先级1】首先检查是否触发特殊的飞行通道（SHORTCUTS）
    const shortcut = SHORTCUTS[color];
    if (currentIndex === shortcut.trigger) {
        // 计算飞行目的地的position值
        const startIndex = PATH_START_INDEX[color];
        let destPosition;

        if (shortcut.destination >= startIndex) {
            destPosition = shortcut.destination - startIndex + 1;
        } else {
            // 目的地在循环之前，需要加上52
            destPosition = (52 - startIndex) + shortcut.destination + 1;
        }

        return {
            shouldFly: true,
            newPosition: destPosition,
            flyType: 'shortcut'
        };
    }

    // 【优先级2】检查颜色飞跃 - 停在自己颜色的格子上时，飞到下一个同色格子
    // 但终点通道入口不触发颜色飞跃
    const finishEntry = FINISH_ENTRY_INDEX[color];
    if (currentIndex === finishEntry) {
        return { shouldFly: false };
    }

    const colorPositions = PATH_COLORS[color];
    if (colorPositions.includes(currentIndex)) {
        // 找到当前索引在颜色数组中的位置
        const currentPosInArray = colorPositions.indexOf(currentIndex);

        // 计算下一个同色格子的索引（循环）
        const nextIndexInArray = (currentPosInArray + 1) % colorPositions.length;
        const nextColorIndex = colorPositions[nextIndexInArray];

        // 计算飞行目的地的position值
        const startIndex = PATH_START_INDEX[color];
        let destPosition;

        if (nextColorIndex >= startIndex) {
            destPosition = nextColorIndex - startIndex + 1;
        } else {
            // 目的地在循环之前，需要加上52
            destPosition = (52 - startIndex) + nextColorIndex + 1;
        }

        // 确保不会飞到终点通道内（终点通道不能触发颜色飞跃）
        if (isInFinishStretch(color, destPosition)) {
            return { shouldFly: false };
        }

        return {
            shouldFly: true,
            newPosition: destPosition,
            flyType: 'color'
        };
    }

    return { shouldFly: false };
}

// 检查击落
function checkCapture(color, pieceIndex) {
    const piece = gameState.pieces[color][pieceIndex];
    if (piece.position === -1 || piece.finished) return;

    // 终点通道上的棋子不能被击落
    if (isInFinishStretch(color, piece.position)) return;

    const currentIndex = getMainPathIndex(color, piece.position);

    // 只检查参与游戏的玩家
    gameState.activePlayers.forEach(playerColor => {
        if (playerColor === color) return;

        gameState.pieces[playerColor].forEach((otherPiece, idx) => {
            if (otherPiece.position === -1 || otherPiece.finished) return;

            // 终点通道上的棋子不能被击落
            if (isInFinishStretch(playerColor, otherPiece.position)) return;

            const otherIndex = getMainPathIndex(playerColor, otherPiece.position);

            if (currentIndex === otherIndex) {
                otherPiece.position = -1;
                movePieceTo(playerColor, idx, false);
                updateMessage(`${COLORS[color].emoji}击落了${COLORS[playerColor].emoji}！`);
                updatePiecesStatus();
            }
        });
    });
}

// 检查获胜
function checkWin(color) {
    const allFinished = gameState.pieces[color].every(p => p.finished);
    if (allFinished) {
        gameState.gameOver = true;
        updateMessage(`🎊 ${COLORS[color].emoji}玩家获胜！🎊`);

        // 禁用所有色子按钮
        gameState.activePlayers.forEach(playerColor => {
            const rollBtn = document.getElementById(`rollBtn-${playerColor}`);
            if (rollBtn) rollBtn.disabled = true;
        });

        document.querySelectorAll(`.piece.${color}`).forEach(p => {
            p.style.animation = 'pulse 0.5s infinite';
        });
    }
}

// 启用当前玩家的色子按钮
function enableCurrentPlayerDice() {
    const currentColor = getCurrentPlayerColor();
    const rollBtn = document.getElementById(`rollBtn-${currentColor}`);
    if (rollBtn) rollBtn.disabled = false;
}

// 下一个玩家
function nextPlayer() {
    if (gameState.gameOver) return;

    // 移动到下一个玩家（只在 activePlayers 中循环）
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.activePlayers.length;
    gameState.diceRolled = false;

    updateCurrentPlayer();
    updatePiecesStatus();

    const currentColor = getCurrentPlayerColor();
    updateMessage(`轮到${COLORS[currentColor].emoji}玩家`);

    // 启用当前玩家的色子按钮
    enableCurrentPlayerDice();
}

// 更新当前玩家显示
function updateCurrentPlayer() {
    const currentColor = getCurrentPlayerColor();

    // 移除所有面板的 active 状态
    ALL_COLORS.forEach(color => {
        const panel = document.getElementById(`panel-${color}`);
        if (panel) panel.classList.remove('active');
    });

    // 激活当前玩家的面板
    const currentPanel = document.getElementById(`panel-${currentColor}`);
    if (currentPanel) currentPanel.classList.add('active');
}

// 更新消息
function updateMessage(msg) {
    document.getElementById('gameMessage').textContent = msg;
}

// 更新棋子状态
function updatePiecesStatus() {
    // 只更新参与游戏的玩家
    gameState.activePlayers.forEach(color => {
        const container = document.getElementById(color + 'Pieces');
        if (!container) return;

        const pieces = gameState.pieces[color];
        let html = '';

        pieces.forEach((piece, index) => {
            let statusClass = 'home';
            let statusText = '●';

            if (piece.finished) {
                statusClass = 'finished';
                statusText = '✓';
            } else if (piece.position > -1) {
                statusClass = 'active';
                statusText = '◆';
            }

            html += `<span class="piece-dot ${statusClass}" style="background: ${COLORS[color].main};">${statusText}</span>`;
        });

        container.innerHTML = html;
    });
}

// 初始化游戏
function initGame() {
    initializePieces();
    updateCurrentPlayer();
    updatePiecesStatus();
}

// 玩家选择逻辑
let selectedPlayerConfig = null;

// 初始化玩家选择界面
function initPlayerSelect() {
    const buttons = document.querySelectorAll('.player-option-btn');
    const startBtn = document.getElementById('startGameBtn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除其他按钮的选中状态
            buttons.forEach(b => b.classList.remove('selected'));
            // 添加当前按钮的选中状态
            btn.classList.add('selected');

            // 保存选择的玩家配置
            const colors = btn.dataset.colors.split(',');
            selectedPlayerConfig = {
                count: parseInt(btn.dataset.players),
                colors: colors
            };

            // 启用开始按钮
            startBtn.disabled = false;
        });
    });
}

// 开始游戏
function startGame() {
    if (!selectedPlayerConfig) return;

    // 设置参与游戏的玩家
    gameState.activePlayers = selectedPlayerConfig.colors;

    // 隐藏玩家选择界面
    const overlay = document.getElementById('playerSelectOverlay');
    overlay.style.display = 'none';

    // 初始化游戏
    initGame();
}

// 启动
initPlayerSelect();
