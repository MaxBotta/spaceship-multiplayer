let player;
let bullets = [];
let asteroids = [];
let planets = [];
let minerals = [];
let stars = [];

let teams = {
  red: 0,
  blue: 0
}

let points = 0;
let gameIsRunning = false;

let playerImg;
let bulletImg;
let asteroidImg;
let mineralImg;
let rocketImg;

let asteroidCooldownTime = 800;
let asteroidTimer = 0;
let asteroidRing = 1000;
let asteroidImages = [];

let screenW = window.innerWidth;
let screenH = window.innerHeight;

let sounds = {
  laser: null,
  explode: null,
  damage: null
}


// WEBSOCKET

var users = [];

var socket = io();

socket.on("connect", () => {

  let id = String(socket.id);

  console.log("Connected to server, ID: " + id);

  socket.on("existing_users", (msg) => {
    for (let u of msg.users) {
      if (u.id !== player.id) {
        let newUser = new User({
          username: u.username,
          team: u.team,
          id: u.id,
          x: u.x,
          y: u.y,
          angle: u.angle,
          life: u.life,
          hide: u.hide
        });
        users.push(newUser);
        console.log(`New user "${newUser.username}" has joined the game`);
      }
    }
  })

  socket.on("add_new_user", (msg) => {
    let u = msg.user;
    if (u.id !== player.id) {
      let newUser = new User({
        username: u.username,
        team: u.team,
        id: u.id,
        x: u.x,
        y: u.y,
        angle: u.angle,
        life: u.life,
        hide: u.hide
      });
      users.push(newUser);
    }
  })

  socket.on("remove_user", (msg) => {
    users = users.filter(user => user.id !== msg.id);
    console.log(`User has left the game`);

  });

  socket.on("update_teams", (msg) => {
    console.log(msg.teams)
    teams = msg.teams;
  })

  socket.on("create_bullet", (msg) => {
    let b = msg.bullet;
    let bullet = new Bullet({
      id: b.id,
      playerId: b.playerId,
      x: b.x,
      y: b.y,
      angle: b.angle,
      lifetime: b.lifetime,
      speed: b.speed
    });
    bullets.push(bullet);
  });
});


function updatePlayer() {
  socket.emit("update_player", {
    user: {
      username: player.username,
      team: player.team,
      id: player.id,
      x: player.x,
      y: player.y,
      life: player.life,
      angle: player.angle,
      shield: player.shield,
      hide: player.hide
    }

  })
}

function createBullet(bullet) {
  socket.emit("new_bullet", {
    bullet: {
      id: bullet.id,
      playerId: bullet.playerId,
      x: bullet.x,
      y: bullet.y,
      angle: bullet.angle,
      lifetime: bullet.lifetime,
      speed: bullet.speed
    }
  });
}

function startGame() {
  let welcomePage = document.getElementById("welcome-page");
  let username = document.getElementById("username").value;
  if (username !== "") {

    player = new Player({ username: username, team: getTeam(), id: String(socket.id) });

    console.log(player);

    socket.emit("new_user_connected", {
      user: {
        username: player.username,
        team: player.team,
        id: player.id,
        x: player.x,
        y: player.y,
        life: player.life,
        angle: player.angle,
        shield: player.shield,
        hide: player.hide
      }

    });

    socket.on('update_users', (msg) => {
      //Update all users
      for (let onlineUser of msg.users) {
        if (onlineUser.id !== player.id) {
          for (let localUser of users) {
            if (localUser.id === onlineUser.id) {
              localUser.x = onlineUser.x;
              localUser.y = onlineUser.y;
              localUser.angle = onlineUser.angle;
              localUser.life = onlineUser.life;
              localUser.shield = onlineUser.shield;
              localUser.hide = onlineUser.hide;
            }
          }
        }
      }
    });

    gameIsRunning = true;
    welcomePage.style.top = "100vh";

    //UPDATE INTERVAL
    setInterval(() => {
      updatePlayer();
    }, 40);
  }
}

let startButton = document.getElementById("start-button");
startButton.addEventListener("click", () => {
  startGame();
});

/////////////

function getTeam() {
  let red = 0;
  let blue = 0;
  if (users.length === 0) {
    let t = ["red", "blue"];
    return t[parseInt(random(0, 2))];
  } else {
    for (let u of users) {
      if (u.team === "red") {
        red++;
      } else if (u.team === "blue") {
        blue++;
      }
    }
    if (red > blue) {
      return "blue";
    } else if (blue > red) {
      return "red";
    } else if (red === blue) {
      let t = ["red", "blue"];
      return t[parseInt(random(0, 2))];
    }
  }

}

function preload() {
  playerImg = {
    red: loadImage('./assets/PNG/playerShip1_red.png'),
    blue: loadImage('./assets/PNG/playerShip1_blue.png')
  }
  bulletImg = loadImage('./assets/PNG/Lasers/laserBlue01.png');
  mineralImg = loadImage('./assets/PNG/mineral.png');
  rocketImg = loadImage('./assets/PNG/Parts/gun08.png');
  let asteroidImgS = loadImage('./assets/PNG/Meteors/meteorBrown_small1.png');
  let asteroidImgM = loadImage('./assets/PNG/Meteors/meteorBrown_med1.png');
  let asteroidImgL = loadImage('./assets/PNG/Meteors/meteorBrown_big1.png');
  asteroidImages = [asteroidImgS, asteroidImgM, asteroidImgL];

  // soundFormats('wav', 'mp3');
  // sounds.laser = loadSound('assets/sounds/laser');
  // sounds.explode = loadSound('assets/sounds/explode');


}

function setup() {
  createCanvas(screenW, screenH);
  imageMode(CENTER);
  rectMode(CENTER)
  angleMode(DEGREES);

  //CREATE RANDOM STARS
  for (let i = 0; i < 1000; i++) {
    let newStar = new Star({ x: parseInt(random(-4000, 4000)), y: parseInt(random(-4000, 4000)) });
    stars.push(newStar);
  }


  //CREATE RANDOM ASTEROIDS
  for (let i = 0; i < 100; i++) {
    let newAsteroid = new Asteroid(
      {
        x: parseInt(random(-4000, 4000)),
        y: parseInt(random(-4000, 4000)),
        size: parseInt(random(0, 3)),
        speed: random(0),
        angle: random(0, 360)
      })
    asteroids.push(newAsteroid);
  }

  // for (let i = 0; i < 6; i++) {
  //   let newPlanet = new Planet({ x: random(-4000, 4000), y: random(-4000, 4000), size: random(400, 1000), angle: random(0, 360), speed: random(0, 2) });
  //   planets.push(newPlanet);
  // }

}

function draw() {

  if (gameIsRunning) {

    background(0);

    //DRAW STARS
    for (let s of stars) {
      s.draw();
    }

    // CAMERA FOLLOWS PLAYER
    camera.position.x = player.x;
    camera.position.y = player.y;

    stroke(255, 204, 0);
    strokeWeight(2);
    noFill();
    circle(screenW / 2, screenH / 2, asteroidRing);

    // CREATE NEW ASTEROID
    // RANDOM POSITION ON A CIRCLE AND RANDOM SPEED TOWARDS CENTER
    // if (millis() > asteroidCooldownTime + asteroidTimer) {
    //   asteroidTimer = millis();
    //   let a = random(0, 360);
    //   let x = screenW / 2 + (asteroidRing / 2) * cos(a);
    //   let y = screenH / 2 + (asteroidRing / 2) * sin(a);
    //   asteroids.push(new Asteroid({ x: x, y: y, size: parseInt(random(0, 3)), speed: random(1, 3), target: createVector(screenW / 2, screenH / 2) }))
    // }

    // DRAW BULLETS AND CHECK COLLISION AND GIVE POINT ON HIT
    for (let b of bullets) {

      if (b.x > -4000 && b.x < 4000 && b.y > -4000 && b.y < 4000 && b.lifetime > 0) {
        b.draw();
      } else {
        bullets.splice(bullets.indexOf(b), 1);
      }

      //check collision with other players bullets
      if (b.playerId !== player.id) {
        if (checkCollision(b, player)) {
          player.shield -= b.damage;
          if (player.shield < 0) {
            player.life = parseInt(player.life - abs(player.shield));
            player.shield = 0;
          }
        }
      }


      for (let a of asteroids) {
        if (checkCollision(b, a)) {
          // sounds.explode.play();
          a.life -= b.damage;
          bullets.splice(bullets.indexOf(b), 1);
        }
      }
    }

    // DRAW PLANETS
    for (let p of planets) {
      p.draw();

      // GRAVITY
      let d = dist(p.x, p.y, player.x, player.y);
      if (d < 800 && d > 100) {
        let vec = createVector(p.x - player.x, p.y - player.y).normalize();
        player.x += vec.x * (p.gravity / d);
        player.y += vec.y * (p.gravity / d);
      }
    }


    // DRAW ALL OTHER USERS
    for (let u of users) {
      u.draw();
    }

    // DRAW PLAYER
    // player.debug = true;
    player.draw();

    // DRAW ASTEROID
    for (let a of asteroids) {

      if (a.x > -4000 && a.x < 4000 && a.y > -4000 && a.y < 4000) {
        a.draw();
      } else {
        asteroids.splice(asteroids.indexOf(a), 1);
      }


      // CHECK COLLISION WITH PLAYER
      if (checkCollision(a, player)) {
        // let damage = a.size * 10 + 10;
        // player.shield -= damage;
        // if (player.shield < 0) {
        //   player.life = parseInt(player.life - abs(player.shield));
        //   player.shield = 0;
        // }

        // asteroids.splice(asteroids.indexOf(a), 1);
        // a.speed = player.velocity / (a.size * 2 + 1);
        // a.angle = player.angle;
        player.velocity = -(player.velocity / 10) - 6;
      }
    }

    //Draw Minerals
    for (let m of minerals) {
      if (m.x > -4000 && m.x < 4000 && m.y > -4000 && m.y < 4000) {
        m.draw();
      } else {
        minerals.splice(minerals.indexOf(m), 1);
      }

      // CHECK COLLISION WITH PLAYER AND ADD MINERAL TO PLAYER
      if (checkCollision(m, player)) {
        player.minerals += 1;
        minerals.splice(minerals.indexOf(m), 1);
      }
    }



    camera.off();

    // DRAW MAP //////////////
    stroke("rgb(0,0,255)");
    fill("rgba(0,0,255, 0.2)")
    circle(120, screenH - 120, 200);
    strokeWeight(2);
    stroke(player.team);
    point(map(player.x, -4000, 4000, 20, 220), map(player.y, 4000, -4000, (screenH - 20), (screenH - 220)));

    //Draw asteroids on map
    for (let a of asteroids) {
      stroke("rgb(255, 255, 0)");
      point(map(a.x, -4000, 4000, 20, 220), map(a.y, 4000, -4000, (screenH - 20), (screenH - 220)));
    }
    // // Draw planets on map
    // for (let p of planets) {
    //   strokeWeight(10);
    //   stroke("rgb(0, 255, 0)");
    //   point(map(p.x, -4000, 4000, 20, 220), map(p.y, 4000, -4000, (screenH - 20), (screenH - 220)));
    // }

    // //DRAW OTHER USERS
    for (let u of users) {
      strokeWeight(2);
      stroke(u.team);
      point(map(u.x, -4000, 4000, 20, 220), map(u.y, 4000, -4000, (screenH - 20), (screenH - 220)));
    }
    //////////////////////////

    stroke(255, 255, 255);
    strokeWeight(1);
    fill(255);
    textSize(20);
    // text("POINTS: " + points, 10, 25);
    // text("LIFE: " + player.life, 160, 25);
    // text("SHIELD: " + parseInt(player.shield), 300, 25);
    // text("ASTEROIDS: " + asteroids.length, 440, 25);
    // text("BULLETS: " + bullets.length, 640, 25);
    // text("MINERALS: " + player.minerals.length, 800, 25);
    text("TEAM RED: " + teams.red, 10, 25);
    text("TEAM BLUE: " + teams.red, 300, 25);

  }

}

function keyPressed() {
  if (gameIsRunning && keyCode === ENTER) {
    player.life = 100;
    points = 0;
    asteroids = [];
    bullets = [];
    gameIsRunning = false;
  }
}

class Player {
  constructor({ id, team, username, x = 0, y = 0, w = 60, h = 50 }) {
    this.id = id;
    this.team = team;
    this.username = username;
    this.img = playerImg[team];
    this.x = x;
    this.y = y;
    this.pos = createVector(x, y);
    this.dir = createVector();
    this.acc = createVector(0, -1);
    this.vel = createVector(0, 0);
    this.w = w;
    this.h = h;
    this.debug = false;
    this.angle = 0;
    this.cooldownTime = 300;
    this.cooldown = 0;
    this.life = 100;
    this.shield = 40;
    this.acceleration = 0.8;
    this.maxSpeed = 20;
    this.velocity = 0;
    this.hide = false;
    this.minerals = [];
    this.credits = [];
    this.rotAcceleration = 0.4;
    this.rotVelocity = 0;
  }

  draw() {

    if (this.life <= 0) {
      this.hide = true
      this.respawn();
      socket.emit("add_team_point", {team: player.team === "blue" ? "red" : "blue"})
    }

    if (!this.hide) {

      this.img.resize(60, 0);

      push();
      translate(this.x, this.y);
      rotate(this.angle);
      image(this.img, 0, 0);
      // translate(-this.x, -this.y);
      pop();


      if (this.debug) {
        noFill();
        stroke(255, 204, 0);
        strokeWeight(2);
        rect(this.x, this.y, this.w, this.h);

      }

      //Draw shield
      if (this.shield > 0) {
        stroke(`rgba(0, 0, 255, ${map(parseInt(this.shield), 0, 40, 0, 1)})`)
        fill(`rgba(0, 0, 255, ${map(parseInt(this.shield), 0, 40, 0, 0.5)})`);
        circle(this.x, this.y, 80);
      }

      if (this.shield < 40) {
        this.shield += 0.1;
      }

      if (keyIsDown(LEFT_ARROW)) {
        // this.rotVelocity -= this.rotAcceleration
        this.angle -= 6;
      }
      if (keyIsDown(RIGHT_ARROW)) {
        // this.rotVelocity += this.rotAcceleration
        this.angle += 6;
      }
      // this.angle += this.rotVelocity;


      this.shoot();

      // this.pos = createVector(0, 0);
      // // this.acc.setMag(this.acceleration);
      // this.acc.x = cos(this.angle - 90);
      // this.acc.y = sin(this.angle - 90);
      // this.acc.setMag(this.acceleration);



      if (keyIsDown(UP_ARROW)) {
        // this.vel.add(this.acc);

        this.velocity += this.acceleration;
        // this.x = parseFloat((this.x + cos(this.angle - 90) * this.velocity).toFixed(2));
        // this.y = parseFloat((this.y + sin(this.angle - 90) * this.velocity).toFixed(2));
      }

      if (keyIsDown(DOWN_ARROW)) {

        // this.vel.sub(this.acc);
        this.velocity -= this.acceleration;
        // this.x = parseFloat((this.x + cos(this.angle - 90) * this.velocity).toFixed(2));
        // this.y = parseFloat((this.y + sin(this.angle - 90) * this.velocity).toFixed(2));
      }

      // line(this.x, this.y, newX, newY);


      // this.vel.limit(this.maxSpeed);
      // this.pos.add(this.vel);

      // this.y = this.y + this.pos.y;
      // this.x = this.x + this.pos.x;

      //Limit forward and backward speed
      if (this.velocity <= -this.maxSpeed) {
        this.velocity = -this.maxSpeed;
      }
      if (this.velocity >= this.maxSpeed) {
        this.velocity = this.maxSpeed;
      }

      //SLOW DOWN FOR BETTER CONTROL
      if (this.velocity > 0) {
        this.velocity -= 0.4;
        if (this.velocity < 0) {
          this.velocity = 0;
        }
      }
      if (this.velocity < 0) {
        this.velocity += 0.4;
        if (this.velocity > 0) {
          this.velocity = 0;
        }
      }

      rectMode(CENTER)
      // Draw name
      stroke(255, 255, 255);
      strokeWeight(1);
      fill(255);
      textSize(12);
      text(this.username, this.x, this.y - this.h);

      //Draw life
      fill(0, 255, 0);
      noStroke();
      rect(this.x, this.y - this.h + 6, map(this.life, 0, 100, 0, 40), 4);
      noFill();
      strokeWeight(1);
      stroke(255);
      rect(this.x, this.y - this.h + 6, 40, 4);

      //Draw shield
      fill(0, 0, 255);
      noStroke();
      rect(this.x, this.y - this.h + 12, map(this.shield, 0, 40, 0, 40), 4);
      noFill();
      strokeWeight(1);
      stroke(255);
      rect(this.x, this.y - this.h + 12, 40, 4);
      rectMode(LEFT)

      this.x = parseFloat((this.x + cos(this.angle - 90) * this.velocity).toFixed(2));
      this.y = parseFloat((this.y + sin(this.angle - 90) * this.velocity).toFixed(2));

    }


  }

  respawn() {
    this.life = 100;
    this.shield = 40;
    setTimeout(() => {
      this.x = random(-4000, 4000);
      this.y = random(-4000, 4000);
      this.hide = false;
      this.life = 100;
      this.shield = 40;
    }, 2000);
  }

  shoot() {
    if (millis() > this.cooldown + this.cooldownTime) {

      this.cooldown = millis();

      if (keyIsDown(88)) {
        // sounds.laser.play();
        let bullet = new Bullet({ id: uuidv4(), playerId: this.id, x: this.x, y: this.y, angle: player.angle });
        bullets.push(bullet);

        // Emit new bullet to server
        createBullet(bullet);

      }
    }
  }

}

class User {
  constructor({ username, team, id, x = screenW / 2, y = screenH / 2, w = 60, h = 50, angle = 0, hide = false }) {
    this.id = id;
    this.team = team;
    this.username = username;
    this.img = playerImg[team];
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.angle = angle;
    this.cooldownTime = 200;
    this.cooldown = 0;
    this.life = 100;
    this.shield = 40;
    this.speedPower = 0.6;
    this.velocity = 0;
    this.hide = hide;
  }

  draw() {
    if (!this.hide) {
      this.img.resize(60, 0);
      push();
      translate(this.x, this.y);
      rotate(this.angle);
      image(this.img, 0, 0);
      // translate(-this.x, -this.y);
      pop();

      //Draw shield
      if (this.shield > 0) {
        stroke(`rgba(0, 0, 255, ${map(parseInt(this.shield), 0, 40, 0, 1)})`)
        fill(`rgba(0, 0, 255, ${map(parseInt(this.shield), 0, 40, 0, 0.5)})`);
        circle(this.x, this.y, 80);
      }

      // Draw name
      stroke(255, 255, 255);
      strokeWeight(1);
      fill(255);
      textSize(12);
      text(this.username, this.x, this.y - this.h);

      //Draw life
      fill(0, 255, 0);
      noStroke();
      rect(this.x, this.y - this.h + 6, map(this.life, 0, 100, 0, 40), 4);
      noFill();
      strokeWeight(1);
      stroke(255);
      rect(this.x, this.y - this.h + 6, 40, 4);

      //Draw shield
      fill(0, 0, 255);
      noStroke();
      rect(this.x, this.y - this.h + 12, map(this.shield, 0, 40, 0, 40), 4);
      noFill();
      strokeWeight(1);
      stroke(255);
      rect(this.x, this.y - this.h + 12, 40, 4);
    }

  }

}

class Bullet {
  constructor({ id, playerId, x, y, angle }) {
    this.id = id;
    this.playerId = playerId;
    this.x = x;
    this.y = y;
    this.w = 20;
    this.h = 20;
    this.img = bulletImg;
    this.angle = angle
    this.speed = 60;
    this.lifetime = 300;
    this.damage = 10;
  }

  draw() {

    this.lifetime -= 10;

    push();

    translate(this.x, this.y);

    // stroke(255, 204, 0);
    // strokeWeight(2);
    // noFill();
    // rect(0, 0, this.w, this.h);

    this.img.resize(4, 0);
    rotate(this.angle);

    image(this.img, 0, 0);

    pop();

    this.x += cos(this.angle - 90) * this.speed;
    this.y += sin(this.angle - 90) * this.speed;

  }
}

class Rocket {
  constructor({ id, playerId, x, y, target }) {
    this.id = id;
    this.playerId = playerId;
    this.x = x;
    this.y = y;
    this.w = 20;
    this.h = 20;
    this.img = rocketImg;
    this.angle = angle
    this.target = target;
    this.speed = 40;
    this.lifetime = 300;
    this.damage = 10;
  }

  draw() {

    this.lifetime -= 10;

    push();

    translate(this.x, this.y);

    // stroke(255, 204, 0);
    // strokeWeight(2);
    // noFill();
    // rect(0, 0, this.w, this.h);

    this.img.resize(4, 0);
    rotate(this.angle);

    image(this.img, 0, 0);

    pop();

    this.x += cos(this.angle - 90) * this.speed;
    this.y += sin(this.angle - 90) * this.speed;

  }
}


class Asteroid {
  constructor({ x, y, size = 1, speed = 0, angle = 0 }) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.img = asteroidImages[size];
    this.w = size * 30 + 20;
    this.h = size * 30 + 20;
    this.angle = angle;
    this.life = size * 20 + 20;
  }

  draw() {
    rectMode(CORNER);
    imageMode(CORNER);
    stroke(255, 204, 0);
    strokeWeight(2);
    noFill();
    // rect(this.x, this.y, this.w, this.h);
    // // translate(this.x, this.y);
    image(this.img, this.x, this.y);
    this.x += cos(this.angle - 90) * this.speed;
    this.y += sin(this.angle - 90) * this.speed;

    stroke(255, 0, 0)
    point(this.x, this.y);


    //Remove Asteroid if 
    if (this.life <= 0) {
      let aX = this.x;
      let aY = this.y;

      // SPLIT ASTEROID IN MINERALS
      // if (this.size === 2) {
      //   for (let i = 0; i < 6; i++) {
      //     minerals.push(new Mineral({ x: aX, y: aY, size: 0, speed: random(1, 3), angle: random(0, 360) }));
      //   }
      // } else if (this.size === 1) {
      //   for (let i = 0; i < 3; i++) {
      //     minerals.push(new Mineral({ x: aX, y: aY, size: 0, speed: random(1, 3), angle: random(0, 360) }));
      //   }
      // } else if (this.size === 0) {
      //   minerals.push(new Mineral({ x: aX, y: aY, size: 0, speed: random(1, 3), angle: random(0, 360) }));
      // }
      if (this.size === 2) {
        for (let i = 0; i < 6; i++) {
          asteroids.push(new Asteroid({ x: aX, y: aY, size: 0, speed: random(1, 3), angle: random(0, 360) }));
        }
      } else if (this.size === 1) {
        for (let i = 0; i < 3; i++) {
          asteroids.push(new Asteroid({ x: aX, y: aY, size: 0, speed: random(1, 3), angle: random(0, 360) }));
        }
      }

      asteroids.splice(asteroids.indexOf(this), 1);
    }

    imageMode(CENTER);
    rectMode(CENTER)
  }

}

class Star {
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
    this.size = parseInt(random(1, 4));
  }

  draw() {
    stroke(255);
    strokeWeight(this.size);
    point(this.x, this.y);
  }
}

class Mineral {
  constructor({ x, y, size = 0, speed = 0, angle = 0 }) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.speed = speed;
    this.img = mineralImg;
    this.w = size * 30 + 20;
    this.h = size * 30 + 20;
    this.angle = angle;
  }

  draw() {
    push();
    translate(this.x, this.y);
    this.img.resize(30, 0);
    rotate(this.angle);
    image(this.img, 0, 0);
    pop();

    this.x += cos(this.angle) * this.speed;
    this.y += sin(this.angle) * this.speed;
  }
}

class Planet {
  constructor({ x, y, size = 200 }) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = `rgb(${parseInt(random(0, 255))}, ${parseInt(random(0, 255))}, ${parseInt(random(0, 255))})`;
    this.ressources = {
      minerals: 0
    }
    this.gravity = 1000;
  }

  draw() {
    noStroke();
    fill(this.color);
    circle(this.x, this.y, this.size);
  }

}


function checkCollision(first, second) {
  if (first.x + first.w > second.x && first.x < second.x + second.w && first.y < second.y + second.h && first.y + first.h > second.y) {
    return true;
  }
  return false;
}

function round(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function uuidv4() {
  return '00-0-4-1-000'.replace(/[^-]/g,
    s => ((Math.random() + ~~s) * 0x10000 >> s).toString(16).padStart(4, '0')
  );
}