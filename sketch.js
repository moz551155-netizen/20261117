const FRAME_COUNT = 12;
const FRAME_GAP = 5;
const REFERENCE_SIZE = 280;

let sceneBackground;
let characterOne;
let characterOneWalk;
let characterOneJump;
let characterOneAttack;
let characterOneMotion;

let bgX = 0; // 用來記錄背景滾動的 X 軸偏移量

function preload() {
  sceneBackground = loadImage('background/Backgrounds2.png');
  characterOne = loadImage('1/stand/51x106.png');
  characterOneWalk = loadImage('1/walk/61x104.png');
  characterOneJump = loadImage('1/jump/84x88.png');
  characterOneAttack = loadImage('1/attack/88x105.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CORNER);
  frameRate(12);
  // 將角色一固定初始化在畫面的正中央
  characterOneMotion = createCharacterMotion(width / 2);
}

function draw() {
  const scaleFactor = min(width, height) / REFERENCE_SIZE;
  const frameIndex = frameCount % FRAME_COUNT;

  // 更新角色一的移動與動作（固定在畫面中間，由背景捲動模擬位移）
  updateCharacterMotion(
    characterOneMotion,
    keyIsDown(LEFT_ARROW),
    keyIsDown(RIGHT_ARROW),
    61,
    scaleFactor
  );
  updateCharacterJump(characterOneMotion, scaleFactor);
  updateCharacterAttack(characterOneMotion);

  // 繪製無限循環背景
  drawScrollingBackground();

  const characterOneFrameWidth = characterOneMotion.walking ? 61 : 51;
  const characterOneFrameHeight = characterOneMotion.walking ? 104 : 106;
  const characterOneAttacking = characterOneMotion.attacking;
  const characterOneJumping = characterOneMotion.jumping;

  // 繪製角色一（永遠固定在畫面中央）
  drawCharacter(
    characterOneAttacking
      ? characterOneAttack
      : characterOneJumping
        ? characterOneJump
        : characterOneMotion.walking
          ? characterOneWalk
          : characterOne,
    characterOneAttacking ? 88 : characterOneJumping ? 84 : characterOneFrameWidth,
    characterOneAttacking ? 105 : characterOneJumping ? 88 : characterOneFrameHeight,
    width / 2, // 保持在正中央
    scaleFactor,
    characterOneAttacking
      ? characterOneMotion.attackFrameIndex
      : characterOneJumping
        ? characterOneMotion.jumpFrameIndex
        : frameIndex,
    characterOneMotion.facing,
    characterOneMotion.jumpOffset // 修正原本會瞬移回地面的問題
  );
}

function keyPressed() {
  if (keyCode === UP_ARROW && !characterOneMotion.jumping) {
    startCharacterJump(characterOneMotion, 19, 19, 1.2);
    return false;
  }

  if (
    keyCode === LEFT_ARROW ||
    keyCode === RIGHT_ARROW
  ) {
    return false;
  }
}

function mousePressed() {
  if (mouseButton === LEFT) {
    startCharacterAttack(characterOneMotion, 19);
    return false;
  }
}

function startCharacterAttack(motion, spriteFrameCount) {
  if (motion.attacking) {
    return;
  }

  motion.attacking = true;
  motion.attackFrame = 0;
  motion.attackFrameIndex = 0;
  motion.attackFrameCount = spriteFrameCount;
}

function updateCharacterAttack(motion) {
  if (!motion.attacking) {
    return;
  }

  if (motion.attackFrame >= motion.attackFrameCount) {
    motion.attacking = false;
    return;
  }

  motion.attackFrameIndex = motion.attackFrame;
  motion.attackFrame += 1;
}

function createCharacterMotion(x) {
  return {
    x,
    facing: 1,
    walking: false,
    jumping: false,
    jumpFrame: 0,
    jumpFrameIndex: 0,
    jumpFrameCount: 0,
    jumpSpriteFrameCount: 0,
    jumpHeight: 0,
    jumpOffset: 0,
    attacking: false,
    attackFrame: 0,
    attackFrameIndex: 0,
    attackFrameCount: 0
  };
}

function startCharacterJump(motion, frameCount, spriteFrameCount, heightMultiplier) {
  motion.jumping = true;
  motion.jumpFrame = 0;
  motion.jumpFrameCount = frameCount;
  motion.jumpSpriteFrameCount = spriteFrameCount;
  motion.jumpHeight = 88 * heightMultiplier;
}

function updateCharacterJump(motion, scaleFactor) {
  if (!motion.jumping) {
    motion.jumpOffset = 0;
    return;
  }

  if (motion.jumpFrame >= motion.jumpFrameCount) {
    motion.jumping = false;
    motion.jumpOffset = 0;
    return;
  }

  const progress = motion.jumpFrame / (motion.jumpFrameCount - 1);
  motion.jumpFrameIndex = round(
    progress * (motion.jumpSpriteFrameCount - 1)
  );
  motion.jumpOffset = sin(progress * PI) * motion.jumpHeight * scaleFactor;
  motion.jumpFrame += 1;
}

function updateCharacterMotion(motion, leftPressed, rightPressed, frameWidth, scaleFactor) {
  const direction = leftPressed === rightPressed ? 0 : rightPressed ? 1 : -1;

  if (direction !== 0) {
    motion.facing = direction;
    // 當按下左右鍵時，背景依據移動方向反向滾動，製造前進或後退的錯覺
    const moveSpeed = 5 * scaleFactor;
    bgX -= direction * moveSpeed;
  }

  motion.walking = direction !== 0;
}

function drawScrollingBackground() {
  const scaleFactor = max(
    width / sceneBackground.width,
    height / sceneBackground.height
  );
  const backgroundWidth = sceneBackground.width * scaleFactor;
  const backgroundHeight = sceneBackground.height * scaleFactor;

  // 讓背景座標在 0 到 backgroundWidth 之間循環，達成無縫無限滾動
  bgX = bgX % backgroundWidth;
  if (bgX > 0) {
    bgX -= backgroundWidth;
  }

  const yPos = (height - backgroundHeight) / 2;

  // 繪製兩張相鄰的背景圖來實現無縫循環
  image(sceneBackground, bgX, yPos, backgroundWidth, backgroundHeight);
  image(sceneBackground, bgX + backgroundWidth, yPos, backgroundWidth, backgroundHeight);
}

function drawCharacter(spriteSheet, frameWidth, frameHeight, centerX, scaleFactor, frameIndex, facing, verticalOffset) {
  const displayWidth = frameWidth * scaleFactor;
  const displayHeight = frameHeight * scaleFactor;
  const sourceX = frameIndex * (frameWidth + FRAME_GAP);

  push();
  translate(centerX, height - displayHeight - verticalOffset);
  scale(facing, 1);
  image(
    spriteSheet,
    -displayWidth / 2,
    0,
    displayWidth,
    displayHeight,
    sourceX,
    0,
    frameWidth,
    frameHeight
  );
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (characterOneMotion) {
    characterOneMotion.x = width / 2; // 維持在畫面正中央
  }
}