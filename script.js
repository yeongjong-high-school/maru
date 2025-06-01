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
    let turtleScaleX = 1;
    let turtleSpeed = 3.5;

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
        if (!turtleWidth) turtleWidth = turtle.offsetWidth;
        if (!turtleHeight) turtleHeight = turtle.offsetHeight;

        turtleCurrentX = gameAreaWidth / 2 - turtleWidth / 2;
        turtleCurrentY = gameAreaHeight / 2 - turtleHeight / 2;
        turtleScaleX = 1;

        turtle.style.position = 'absolute';
        turtle.style.left = '';
        turtle.style.top = '';
        turtle.style.transform = `translate(${turtleCurrentX}px, ${turtleCurrentY}px) scaleX(${turtleScaleX}) scale(1)`;
        turtle.style.zIndex = ''; // 성공/오버 화면에서 zIndex가 변경될 수 있으므로 초기화
        turtle.style.display = 'block';

        if (ribbonOnShell) {
            ribbonOnShell.classList.add('hidden');
        }

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
            const turtleRectForRibbon = {
                left: turtleCurrentX - ribbonContainerWidth, top: turtleCurrentY - ribbonContainerHeight,
                right: turtleCurrentX + turtleWidth + ribbonContainerWidth, bottom: turtleCurrentY + turtleHeight + ribbonContainerHeight
            };
            if (isOverlapping(newRibbonRect, turtleRectForRibbon)) continue;
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
        }
    }

    function collectRibbon() {
        if (!currentRibbon) return;
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
        if (score >= TARGET_SCORE && !isGameOver) {
            gameSuccess();
        }
    }

    function gameSuccess() {
        isGameOver = true;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;

        turtle.style.display = 'block';
        if (ribbonOnShell) {
            ribbonOnShell.classList.remove('hidden');
        }

        const gameContainerRect = gameContainer.getBoundingClientRect();
        // gameSuccessScreen의 CSS에서 width, height가 고정되어 있다고 가정.
        // 만약 가변적이라면, getBoundingClientRect()를 사용해야 하지만,
        // 이 함수는 요소가 화면에 렌더링된 후에 정확한 값을 반환합니다.
        // 여기서는 CSS에 정의된 값을 사용합니다.
        const successScreenWidth = 350; // CSS #game-success-screen width
        const successScreenHeight = gameSuccessScreen.offsetHeight; // 실제 높이 가져오기 (padding 포함)
                                                                  // 또는 CSS에서 height가 고정이라면 해당 값 사용

        // 성공 화면의 gameContainer 내 상대적 top 위치 계산
        // (컨테이너 높이 / 2) - (성공화면 높이 / 2)
        const successScreenTopRelativeToContainer = (gameContainer.offsetHeight / 2) - (successScreenHeight / 2);

        turtle.style.position = 'absolute'; // gameContainer 기준
        turtle.style.left = '50%';
        // 성공화면 상단보다 (거북이 높이 * 축소비율) 만큼 위 + 약간의 여유
        // CSS에서 #game-success-screen padding-top: 80px;을 사용하고 있으므로, 이 공간 내에 위치.
        // 패딩 영역의 중앙에 오도록 계산
        const successScreenPaddingTop = 80; // CSS에서 설정한 값
        turtle.style.top = (successScreenTopRelativeToContainer + (successScreenPaddingTop / 2) - (turtleHeight * 0.7 / 2)) + 'px';
        turtle.style.transform = `translateX(-50%) scaleX(${turtleScaleX}) scale(0.7)`;
        turtle.style.zIndex = '101';


        if (currentRibbon && gameArea.contains(currentRibbon)) {
            gameArea.removeChild(currentRibbon);
            currentRibbon = null;
        }
        obstacles.forEach(obstacleEl => {
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
        if(isGameOver) return;
        isGameOver = true;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        turtle.style.display = 'none';
        if (ribbonOnShell) {
            ribbonOnShell.classList.add('hidden');
        }
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
            if (gameSuccessScreen.classList.contains('hidden')) { // 성공 화면이 아닐 때만
                turtle.style.transform = `translate(${turtleCurrentX}px, ${turtleCurrentY}px) scaleX(${turtleScaleX}) scale(1)`;
            }
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
                if (gameSuccessScreen.classList.contains('hidden')) { // 성공 화면이 아닐 때만
                    turtle.style.transform = `translate(${turtleCurrentX}px, ${turtleCurrentY}px) scaleX(${turtleScaleX}) scale(1)`;
                }
                if (!isGameOver) endGame(); return;
            }
        }
        turtleCurrentX = nextX; turtleCurrentY = nextY;

        if (dx > 0) {
            turtleScaleX = 1;
        } else if (dx < 0) {
            turtleScaleX = -1;
        }

        if (gameSuccessScreen.classList.contains('hidden')) { // 성공 화면이 아닐 때만
            turtle.style.transform = `translate(${turtleCurrentX}px, ${turtleCurrentY}px) scaleX(${turtleScaleX}) scale(1)`;
        }

        if (currentRibbon) {
            const turtleRect = turtle.getBoundingClientRect();
            const ribbonRect = currentRibbon.getBoundingClientRect();
            if (isOverlapping(turtleRect, ribbonRect)) {
                updateScore();
                if (!isGameOver) {
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
        } else if (!gameSuccessScreen.classList.contains('hidden')) { // 성공 화면이 표시된 상태에서 리사이즈
            const gameContainerRect = gameContainer.getBoundingClientRect();
            const successScreenHeight = gameSuccessScreen.offsetHeight; // 실제 높이 사용
            const successScreenPaddingTop = 80; // CSS 값
            const successScreenTopRelativeToContainer = (gameContainer.offsetHeight / 2) - (successScreenHeight / 2);
            turtle.style.top = (successScreenTopRelativeToContainer + (successScreenPaddingTop / 2) - (turtleHeight * 0.7 / 2)) + 'px';
        }
    });

    initializeGame();
});