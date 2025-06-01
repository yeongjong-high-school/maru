document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const gameArea = document.getElementById('game-area');
    const turtle = document.getElementById('myTurtle');
    const scoreDisplay = document.getElementById('score');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const gameSuccessScreen = document.getElementById('game-success-screen');
    const finalScoreSuccessDisplay = document.getElementById('final-score-success');
    const targetScoreSuccessDisplay = document.getElementById('target-score-success');
    const restartButton = document.getElementById('restart-button');
    const restartButtonSuccess = document.getElementById('restart-button-success');
    const controlsText = document.querySelector('.controls');
    const ribbonOnShell = document.querySelector('.ribbon-on-shell');

    let gameAreaWidth, gameAreaHeight, turtleWidth, turtleHeight;
    let turtleCurrentX, turtleCurrentY;
    let turtleSpeed = 3.5;
    let turtleScaleX = 1;

    const movement = {
        up: false, down: false, left: false, right: false
    };

    let score = 0;
    const TARGET_SCORE = 25;
    let currentRibbon = null;
    let isGameOver = false;
    let animationFrameId = null;

    let obstacles = [];
    const NUM_OBSTACLES = 5;
    const OBSTACLE_MIN_SIZE = 15;
    const OBSTACLE_MAX_SIZE = 30;

    function initializeGame() {
        isGameOver = false;
        gameAreaWidth = gameArea.offsetWidth;
        gameAreaHeight = gameArea.offsetHeight;
        turtleWidth = turtle.offsetWidth;
        turtleHeight = turtle.offsetHeight;

        turtleCurrentX = gameAreaWidth / 2 - turtleWidth / 2;
        turtleCurrentY = gameAreaHeight / 2 - turtleHeight / 2;
        turtle.style.transform = `translate(${turtleCurrentX}px, ${turtleCurrentY}px) scaleX(${turtleScaleX})`;
        turtle.style.display = 'block'; // 거북이 보이도록 설정
        if (ribbonOnShell) ribbonOnShell.classList.add('hidden');

        obstacles.forEach(obstacleEl => {
            if (gameArea.contains(obstacleEl)) gameArea.removeChild(obstacleEl);
        });
        obstacles = [];

        if (currentRibbon && gameArea.contains(currentRibbon)) {
            gameArea.removeChild(currentRibbon);
        }
        currentRibbon = null;

        createObstacles(NUM_OBSTACLES);
        createRibbon();

        score = 0;
        scoreDisplay.textContent = score;
        gameOverScreen.classList.add('hidden');
        gameSuccessScreen.classList.add('hidden');
        controlsText.classList.remove('hidden');

        for (let key in movement) movement[key] = false;

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(gameLoop);

        console.log(`새 게임 시작! (목표 점수: ${TARGET_SCORE})`);
    }

    function isOverlapping(rect1, rect2) {
        return !(rect1.right < rect2.left ||
                 rect1.left > rect2.right ||
                 rect1.bottom < rect2.top ||
                 rect1.top > rect2.bottom);
    }

    function createObstacles(count) {
        for (let i = 0; i < count; i++) {
            const obstacleEl = document.createElement('div');
            obstacleEl.classList.add('obstacle');
            let obstacleWidth, obstacleHeight, obstacleX, obstacleY, newObstacleRect;
            let attempts = 0; let validPosition = false;
            while (!validPosition && attempts < 100) {
                attempts++;
                obstacleWidth = Math.random() * (OBSTACLE_MAX_SIZE - OBSTACLE_MIN_SIZE) + OBSTACLE_MIN_SIZE;
                obstacleHeight = Math.random() * (OBSTACLE_MAX_SIZE - OBSTACLE_MIN_SIZE) + OBSTACLE_MIN_SIZE;
                obstacleX = Math.random() * (gameAreaWidth - obstacleWidth - 20) + 10;
                obstacleY = Math.random() * (gameAreaHeight - obstacleHeight - 20) + 10;
                newObstacleRect = {
                    left: obstacleX, top: obstacleY,
                    right: obstacleX + obstacleWidth, bottom: obstacleY + obstacleHeight
                };
                const turtleStartRect = {
                    left: turtleCurrentX - turtleWidth, top: turtleCurrentY - turtleHeight,
                    right: turtleCurrentX + turtleWidth * 2, bottom: turtleCurrentY + turtleHeight * 2
                };
                if (isOverlapping(newObstacleRect, turtleStartRect)) continue;
                let overlapsWithOtherObstacle = false;
                for (const existingObstacle of obstacles) {
                    const existingObstacleRect = {
                        left: parseFloat(existingObstacle.style.left) - 5,
                        top: parseFloat(existingObstacle.style.top) - 5,
                        right: parseFloat(existingObstacle.style.left) + existingObstacle.offsetWidth + 5,
                        bottom: parseFloat(existingObstacle.style.top) + existingObstacle.offsetHeight + 5
                    };
                    if (isOverlapping(newObstacleRect, existingObstacleRect)) {
                        overlapsWithOtherObstacle = true; break;
                    }
                }
                if (overlapsWithOtherObstacle) continue;
                validPosition = true;
            }
            if (validPosition) {
                obstacleEl.style.width = obstacleWidth + 'px';
                obstacleEl.style.height = obstacleHeight + 'px';
                obstacleEl.style.left = obstacleX + 'px';
                obstacleEl.style.top = obstacleY + 'px';
                gameArea.appendChild(obstacleEl);
                obstacles.push(obstacleEl);
            } else {
                // console.warn("장애물 위치 선정 실패");
            }
        }
    }

    function createRibbon() {
        if (isGameOver) return;
        if (currentRibbon && gameArea.contains(currentRibbon)) gameArea.removeChild(currentRibbon);
        currentRibbon = document.createElement('div');
        currentRibbon.classList.add('ribbon');
        const loopLeft = document.createElement('span'); loopLeft.classList.add('loop-left');
        const loopRight = document.createElement('span'); loopRight.classList.add('loop-right');
        currentRibbon.appendChild(loopLeft); currentRibbon.appendChild(loopRight);
        const ribbonContainerWidth = 48; const ribbonContainerHeight = 30;
        const maxX = gameAreaWidth - ribbonContainerWidth - 10;
        const maxY = gameAreaHeight - ribbonContainerHeight - 10;
        const minPos = 10;
        let ribbonX, ribbonY, newRibbonRect;
        let attempts = 0; let validPosition = false;
        while (!validPosition && attempts < 100) {
            attempts++;
            ribbonX = Math.random() * (maxX - minPos) + minPos;
            ribbonY = Math.random() * (maxY - minPos) + minPos;
            newRibbonRect = {
                left: ribbonX, top: ribbonY,
                right: ribbonX + ribbonContainerWidth, bottom: ribbonY + ribbonContainerHeight
            };
            const turtleRect = {
                left: turtleCurrentX - ribbonContainerWidth, top: turtleCurrentY - ribbonContainerHeight,
                right: turtleCurrentX + turtleWidth + ribbonContainerWidth, bottom: turtleCurrentY + turtleHeight + ribbonContainerHeight
            };
            if (isOverlapping(newRibbonRect, turtleRect)) continue;
            let overlapsWithObstacle = false;
            for (const obstacleEl of obstacles) {
                const obstacleRect = {
                    left: parseFloat(obstacleEl.style.left) - ribbonContainerWidth / 2,
                    top: parseFloat(obstacleEl.style.top) - ribbonContainerHeight / 2,
                    right: parseFloat(obstacleEl.style.left) + obstacleEl.offsetWidth + ribbonContainerWidth / 2,
                    bottom: parseFloat(obstacleEl.style.top) + obstacleEl.offsetHeight + ribbonContainerHeight / 2
                };
                if (isOverlapping(newRibbonRect, obstacleRect)) {
                    overlapsWithObstacle = true; break;
                }
            }
            if (overlapsWithObstacle) continue;
            validPosition = true;
        }
        if (validPosition) {
            currentRibbon.style.left = ribbonX + 'px';
            currentRibbon.style.top = ribbonY + 'px';
            gameArea.appendChild(currentRibbon);
            requestAnimationFrame(() => {
                if (currentRibbon && gameArea.contains(currentRibbon)) {
                    currentRibbon.classList.add('visible');
                }
            });
        } else {
            // console.warn("리본 위치 선정 실패");
        }
    }

    function collectRibbon() {
        if (!currentRibbon) return; // isGameOver는 updateScore에서 체크됨
        // updateScore(); // 여기서 호출하지 않고 gameLoop에서 충돌 시 직접 호출

        const collectedRibbon = currentRibbon;
        currentRibbon = null;
        collectedRibbon.classList.remove('visible');
        collectedRibbon.classList.add('collected');
        setTimeout(() => {
            if (gameArea.contains(collectedRibbon)) {
                gameArea.removeChild(collectedRibbon);
            }
            if (!isGameOver) {
                createRibbon();
            }
        }, 300);
    }

    function updateScore() {
        if (isGameOver) return;
        score++;
        scoreDisplay.textContent = score;
        if (score >= TARGET_SCORE && !isGameOver) { // !isGameOver 추가하여 중복 방지
            gameSuccess();
        }
    }

    function gameSuccess() {
        isGameOver = true;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        // turtle.style.display = 'none'; // 거북이 숨기지 않음
        if (ribbonOnShell) ribbonOnShell.classList.remove('hidden');
        if (currentRibbon && gameArea.contains(currentRibbon)) {
            gameArea.removeChild(currentRibbon);
            currentRibbon = null;
        }
        obstacles.forEach(obstacleEl => { // 성공 시 장애물도 제거
            if (gameArea.contains(obstacleEl)) gameArea.removeChild(obstacleEl);
        });
        obstacles = [];

        finalScoreSuccessDisplay.textContent = score;
        targetScoreSuccessDisplay.textContent = TARGET_SCORE;
        gameSuccessScreen.classList.remove('hidden');
        controlsText.classList.add('hidden');
        console.log(`게임 성공! 최종 점수: ${score}`);
    }

    function endGame() {
        if(isGameOver) return; // 이미 성공 또는 다른 이유로 게임오버 상태면 중복 실행 방지
        isGameOver = true;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        turtle.style.display = 'none';
        if (ribbonOnShell) ribbonOnShell.classList.add('hidden');
        if (currentRibbon && gameArea.contains(currentRibbon)) {
            gameArea.removeChild(currentRibbon);
            currentRibbon = null;
        }
        finalScoreDisplay.textContent = score;
        gameOverScreen.classList.remove('hidden');
        controlsText.classList.add('hidden');
        console.log('게임 오버! 최종 점수:', score);
    }

    function gameLoop() {
        if (isGameOver) return;
        let dx = 0; dy = 0;
        if (movement.up) dy -= turtleSpeed;
        if (movement.down) dy += turtleSpeed;
        if (movement.left) dx -= turtleSpeed;
        if (movement.right) dx += turtleSpeed;
        let nextX = turtleCurrentX + dx;
        let nextY = turtleCurrentY + dy;

        if (nextX < 0 || nextX + turtleWidth > gameAreaWidth ||
            nextY < 0 || nextY + turtleHeight > gameAreaHeight) {
            turtleCurrentX = Math.max(0, Math.min(turtleCurrentX + dx, gameAreaWidth - turtleWidth));
            turtleCurrentY = Math.max(0, Math.min(turtleCurrentY + dy, gameAreaHeight - turtleHeight));
            turtle.style.transform = `translate(${turtleCurrentX}px, ${turtleCurrentY}px) scaleX(${turtleScaleX})`;
            if (!isGameOver) endGame(); return;
        }
        const prospectiveTurtleRect = {
            left: nextX, top: nextY,
            right: nextX + turtleWidth, bottom: nextY + turtleHeight
        };
        for (const obstacleEl of obstacles) {
            const obstacleRect = {
                left: parseFloat(obstacleEl.style.left), top: parseFloat(obstacleEl.style.top),
                right: parseFloat(obstacleEl.style.left) + obstacleEl.offsetWidth, bottom: parseFloat(obstacleEl.style.top) + obstacleEl.offsetHeight
            };
            if (isOverlapping(prospectiveTurtleRect, obstacleRect)) {
                 turtle.style.transform = `translate(${turtleCurrentX}px, ${turtleCurrentY}px) scaleX(${turtleScaleX})`;
                if (!isGameOver) endGame(); return;
            }
        }
        turtleCurrentX = nextX; turtleCurrentY = nextY;
        if (dx > 0) turtleScaleX = 1; else if (dx < 0) turtleScaleX = -1;
        turtle.style.transform = `translate(${turtleCurrentX}px, ${turtleCurrentY}px) scaleX(${turtleScaleX})`;
        if (currentRibbon) {
            const turtleRect = turtle.getBoundingClientRect();
            const ribbonRect = currentRibbon.getBoundingClientRect();
            if (isOverlapping(turtleRect, ribbonRect)) {
                updateScore(); // 점수 업데이트
                if (!isGameOver) { // 성공/오버 상태가 아니면 리본 수집
                    collectRibbon();
                }
            }
        }
        animationFrameId = requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', (event) => {
        if (isGameOver) {
            if (event.key === 'Enter') {
                if (!gameOverScreen.classList.contains('hidden')) restartButton.click();
                if (!gameSuccessScreen.classList.contains('hidden')) restartButtonSuccess.click();
            }
            return;
        }
        let relevantKey = true;
        switch (event.key) {
            case 'ArrowUp': case 'w': case 'W': movement.up = true; break;
            case 'ArrowDown': case 's': case 'S': movement.down = true; break;
            case 'ArrowLeft': case 'a': case 'A': movement.left = true; break;
            case 'ArrowRight': case 'd': case 'D': movement.right = true; break;
            default: relevantKey = false;
        }
        if (relevantKey) event.preventDefault();
    });
    document.addEventListener('keyup', (event) => {
        switch (event.key) {
            case 'ArrowUp': case 'w': case 'W': movement.up = false; break;
            case 'ArrowDown': case 's': case 'S': movement.down = false; break;
            case 'ArrowLeft': case 'a': case 'A': movement.left = false; break;
            case 'ArrowRight': case 'd': case 'D': movement.right = false; break;
        }
    });
    restartButton.addEventListener('click', () => {
        initializeGame();
    });
    restartButtonSuccess.addEventListener('click', () => {
        initializeGame();
    });
    window.addEventListener('resize', () => {
        gameAreaWidth = gameArea.offsetWidth;
        gameAreaHeight = gameArea.offsetHeight;
        if (!isGameOver) {
            turtleCurrentX = Math.max(0, Math.min(turtleCurrentX, gameAreaWidth - turtleWidth));
            turtleCurrentY = Math.max(0, Math.min(turtleCurrentY, gameAreaHeight - turtleHeight));
        }
    });

    initializeGame();
});