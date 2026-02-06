import { BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, Vector3 } from "three";
import { deltaTime, time } from "../scripts/Time.js";
import { Random } from "../scripts/Random.js";
import { SampleHeight, halfSize } from "./SeaFloor.js";
import { triplanar, kelp } from "../materials/OceanMaterial.js";

const random = new Random(42);

// ── Creature arrays ──
export const animals = [];   // fish + sharks — have hitboxes
const plants = [];            // kelp / seaweed — no hitboxes

// ── Config ──
const FISH_COUNT = 80;
const SHARK_COUNT = 6;
const PLANT_COUNT = 3000;
const SPAWN_RADIUS = 300;
const FISH_MIN_DEPTH = 5;

// ── Material (cloned from ocean triplanar so wildlife gets fog + absorption + spotlight) ──
let wildlifeMat;

// ── Helpers ──
function rng() { return random.Next(); }
function rngRange(a, b) { return a + rng() * (b - a); }

function clampToFloor(x, z, minAbove) {
     const gx = x + halfSize;
     const gz = z + halfSize;
     const floor = SampleHeight(gx, gz);
     return Math.max(floor + minAbove, floor + 2);
}

// ═══════════════════════════════════════
//  Procedural geometry builders
// ═══════════════════════════════════════

function buildFishGeometry(length, height, width) {
     const hl = length / 2;
     const hh = height / 2;
     const hw = width / 2;

     const vertices = new Float32Array([
          // 0  nose tip
          hl * 1.4, 0, 0,
          // 1  upper head
          hl * 0.5, hh * 0.8, 0,
          // 2  lower head
          hl * 0.5, -hh * 0.6, 0,
          // 3  left head
          hl * 0.5, 0, hw * 0.7,
          // 4  right head
          hl * 0.5, 0, -hw * 0.7,
          // 5  upper mid (widest)
          0, hh, 0,
          // 6  lower mid
          0, -hh * 0.8, 0,
          // 7  left mid
          0, 0, hw,
          // 8  right mid
          0, 0, -hw,
          // 9  upper rear
          -hl * 0.5, hh * 0.6, 0,
          // 10 lower rear
          -hl * 0.5, -hh * 0.5, 0,
          // 11 left rear
          -hl * 0.5, 0, hw * 0.5,
          // 12 right rear
          -hl * 0.5, 0, -hw * 0.5,
          // 13 tail root
          -hl * 0.9, 0, 0,
          // 14 tail fin top
          -hl * 1.5, hh * 0.9, 0,
          // 15 tail fin bottom
          -hl * 1.5, -hh * 0.7, 0,
          // 16 left pectoral tip
          hl * 0.1, -hh * 0.7, hw * 1.8,
          // 17 right pectoral tip
          hl * 0.1, -hh * 0.7, -hw * 1.8,
          // 18 dorsal fin tip
          -hl * 0.1, hh * 1.4, 0,
     ]);

     const indices = [
          // head — top
          0, 1, 3, 0, 4, 1,
          // head — bottom
          0, 3, 2, 0, 2, 4,
          // head → mid — top-left, top-right
          1, 5, 7, 1, 7, 3,
          1, 8, 5, 1, 4, 8,
          // head → mid — bottom-left, bottom-right
          2, 7, 6, 2, 3, 7,
          2, 6, 8, 2, 8, 4,
          // mid → rear — top-left, top-right
          5, 9, 11, 5, 11, 7,
          5, 12, 9, 5, 8, 12,
          // mid → rear — bottom-left, bottom-right
          6, 11, 10, 6, 7, 11,
          6, 10, 12, 6, 12, 8,
          // rear → tail root
          9, 13, 11, 9, 12, 13,
          10, 11, 13, 10, 13, 12,
          // tail fin
          13, 14, 15, 13, 15, 14,
          // pectoral fins
          6, 16, 7, 7, 16, 6,
          6, 8, 17, 8, 6, 17,
          // dorsal fin
          5, 18, 9, 9, 18, 5,
     ];

     const geom = new BufferGeometry();
     geom.setAttribute("position", new BufferAttribute(vertices, 3));
     geom.setIndex(indices);
     geom.computeVertexNormals();
     return geom;
}

function buildSharkGeometry(length, height, width) {
     const hl = length / 2;
     const hh = height / 2;
     const hw = width / 2;

     const vertices = new Float32Array([
          // 0  snout tip (slightly below centre – under-slung jaw)
          hl * 1.5, -hh * 0.15, 0,
          // 1  upper head
          hl * 0.6, hh * 0.7, 0,
          // 2  lower head (flat belly)
          hl * 0.6, -hh * 0.6, 0,
          // 3  left head
          hl * 0.6, 0, hw * 0.8,
          // 4  right head
          hl * 0.6, 0, -hw * 0.8,
          // 5  upper mid
          0, hh, 0,
          // 6  lower mid (flat)
          0, -hh * 0.7, 0,
          // 7  left mid (widest)
          0, -hh * 0.1, hw,
          // 8  right mid
          0, -hh * 0.1, -hw,
          // 9  upper rear
          -hl * 0.55, hh * 0.6, 0,
          // 10 lower rear
          -hl * 0.55, -hh * 0.4, 0,
          // 11 left rear
          -hl * 0.55, 0, hw * 0.45,
          // 12 right rear
          -hl * 0.55, 0, -hw * 0.45,
          // 13 tail root (caudal peduncle — narrow)
          -hl, 0, 0,
          // 14 upper tail fin tip
          -hl * 1.65, hh * 1.4, 0,
          // 15 lower tail fin tip
          -hl * 1.4, -hh * 0.5, 0,
          // 16 dorsal fin tip
          hl * 0.05, hh * 2.2, 0,
          // 17 dorsal fin trailing edge
          -hl * 0.35, hh * 0.8, 0,
          // 18 left pectoral tip
          hl * 0.15, -hh * 0.7, hw * 2.2,
          // 19 right pectoral tip
          hl * 0.15, -hh * 0.7, -hw * 2.2,
          // 20 left pectoral root
          hl * 0.05, -hh * 0.55, hw * 0.9,
          // 21 right pectoral root
          hl * 0.05, -hh * 0.55, -hw * 0.9,
     ]);

     const indices = [
          // head — top
          0, 1, 3, 0, 4, 1,
          // head — bottom
          0, 3, 2, 0, 2, 4,
          // head → mid — top
          1, 5, 7, 1, 7, 3,
          1, 8, 5, 1, 4, 8,
          // head → mid — bottom
          2, 7, 6, 2, 3, 7,
          2, 6, 8, 2, 8, 4,
          // mid → rear — top
          5, 9, 11, 5, 11, 7,
          5, 12, 9, 5, 8, 12,
          // mid → rear — bottom
          6, 11, 10, 6, 7, 11,
          6, 10, 12, 6, 12, 8,
          // rear → tail root
          9, 13, 11, 9, 12, 13,
          10, 11, 13, 10, 13, 12,
          // tail fin (double-sided)
          13, 14, 15, 13, 15, 14,
          // dorsal fin (double-sided)
          5, 16, 17, 17, 16, 5,
          // pectoral fins — left (double-sided)
          6, 18, 20, 20, 18, 6,
          // pectoral fins — right (double-sided)
          6, 21, 19, 19, 21, 6,
     ];

     const geom = new BufferGeometry();
     geom.setAttribute("position", new BufferAttribute(vertices, 3));
     geom.setIndex(indices);
     geom.computeVertexNormals();
     return geom;
}

function buildKelpGeometry(height, width) {
     // Stacked quads with organic sway and tapering width
     const segments = 7;
     const verts = [];
     const idxs = [];
     const segH = height / segments;

     for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const y = i * segH;
          const sway = Math.sin(i * 1.0) * width * 0.5;
          // Taper: widest at base, narrows toward tip
          const w = (width / 2) * (1.0 - t * 0.6);
          verts.push(-w + sway, y, 0);
          verts.push(w + sway, y, 0);
     }

     for (let i = 0; i < segments; i++) {
          const bl = i * 2;
          const br = i * 2 + 1;
          const tl = (i + 1) * 2;
          const tr = (i + 1) * 2 + 1;
          idxs.push(bl, br, tl);
          idxs.push(br, tr, tl);
          // back faces
          idxs.push(tl, br, bl);
          idxs.push(tl, tr, br);
     }

     const geom = new BufferGeometry();
     geom.setAttribute("position", new BufferAttribute(new Float32Array(verts), 3));
     geom.setIndex(idxs);
     geom.computeVertexNormals();
     return geom;
}

// ═══════════════════════════════════════
//  Creature class
// ═══════════════════════════════════════

class Creature {
     mesh;
     velocity;
     speed;
     turnSpeed;
     wanderAngle;
     wanderTimer;
     isShark;
     boundingRadius;

     constructor(mesh, speed, turnSpeed, isShark, boundingRadius) {
          this.mesh = mesh;
          this.speed = speed;
          this.turnSpeed = turnSpeed;
          this.isShark = isShark;
          this.boundingRadius = boundingRadius;
          this.wanderAngle = rng() * Math.PI * 2;
          this.wanderTimer = rng() * 3;
          const dir = new Vector3(
               Math.cos(this.wanderAngle),
               rngRange(-0.1, 0.1),
               Math.sin(this.wanderAngle)
          ).normalize();
          this.velocity = dir.multiplyScalar(speed);
     }
}

// ═══════════════════════════════════════
//  Spawning
// ═══════════════════════════════════════

function spawnFish() {
     const length = rngRange(0.4, 1.2);
     const geom = buildFishGeometry(length, length * 0.35, length * 0.25);
     const mesh = new Mesh(geom, wildlifeMat);

     const x = rngRange(-SPAWN_RADIUS, SPAWN_RADIUS);
     const z = rngRange(-SPAWN_RADIUS, SPAWN_RADIUS);
     const floorY = clampToFloor(x, z, 3);
     const y = rngRange(floorY, Math.min(-FISH_MIN_DEPTH, floorY + 40));

     mesh.position.set(x, y, z);

     const creature = new Creature(mesh, rngRange(2, 6), rngRange(1.5, 3), false, length * 0.7);
     animals.push(creature);
     return mesh;
}

function spawnShark() {
     const length = rngRange(3, 6);
     const geom = buildSharkGeometry(length, length * 0.3, length * 0.2);
     const mesh = new Mesh(geom, wildlifeMat);

     const x = rngRange(-SPAWN_RADIUS, SPAWN_RADIUS);
     const z = rngRange(-SPAWN_RADIUS, SPAWN_RADIUS);
     const floorY = clampToFloor(x, z, 5);
     const y = rngRange(floorY, Math.min(-10, floorY + 60));

     mesh.position.set(x, y, z);

     const creature = new Creature(mesh, rngRange(3, 7), rngRange(0.8, 1.5), true, length * 0.6);
     animals.push(creature);
     return mesh;
}

function spawnPlant() {
     const height = rngRange(2, 10);
     const width = rngRange(0.3, 1.0);
     const geom = buildKelpGeometry(height, width);
     const mesh = new Mesh(geom, kelp);

     const x = rngRange(-SPAWN_RADIUS, SPAWN_RADIUS);
     const z = rngRange(-SPAWN_RADIUS, SPAWN_RADIUS);
     const gx = x + halfSize;
     const gz = z + halfSize;
     const floorY = SampleHeight(gx, gz);

     mesh.position.set(x, floorY, z);
     // Random Y rotation so they don't all face same direction
     mesh.rotation.y = rng() * Math.PI * 2;

     plants.push(mesh);
     return mesh;
}

// ═══════════════════════════════════════
//  Public API
// ═══════════════════════════════════════

export const wildlifeGroup = new Group();

export function Start() {
     // Clone the ocean triplanar material so wildlife gets full
     // underwater rendering (fog, absorption, spotlight) like the seafloor.
     wildlifeMat = triplanar.clone();
     wildlifeMat.side = DoubleSide;

     for (let i = 0; i < FISH_COUNT; i++) {
          wildlifeGroup.add(spawnFish());
     }

     for (let i = 0; i < SHARK_COUNT; i++) {
          wildlifeGroup.add(spawnShark());
     }

     for (let i = 0; i < PLANT_COUNT; i++) {
          wildlifeGroup.add(spawnPlant());
     }
}

export function Update() {
     const dt = deltaTime;
     const t = time;

     for (let i = 0; i < animals.length; i++) {
          const c = animals[i];
          const pos = c.mesh.position;

          // Wander behaviour
          c.wanderTimer -= dt;
          if (c.wanderTimer <= 0) {
               c.wanderAngle += rngRange(-1.5, 1.5);
               c.wanderTimer = rngRange(1.5, 4);

               // Slight vertical tendency
               c.velocity.y = rngRange(-0.3, 0.3) * c.speed;
          }

          // Steer towards wander angle
          const targetX = Math.cos(c.wanderAngle) * c.speed;
          const targetZ = Math.sin(c.wanderAngle) * c.speed;
          c.velocity.x += (targetX - c.velocity.x) * c.turnSpeed * dt;
          c.velocity.z += (targetZ - c.velocity.z) * c.turnSpeed * dt;

          // Keep within bounds
          if (pos.x > SPAWN_RADIUS) c.wanderAngle = Math.PI;
          if (pos.x < -SPAWN_RADIUS) c.wanderAngle = 0;
          if (pos.z > SPAWN_RADIUS) c.wanderAngle = -Math.PI / 2;
          if (pos.z < -SPAWN_RADIUS) c.wanderAngle = Math.PI / 2;

          // Keep underwater
          if (pos.y > -FISH_MIN_DEPTH) c.velocity.y = -Math.abs(c.velocity.y) - 0.5;

          // Keep above floor
          const gx = pos.x + halfSize;
          const gz = pos.z + halfSize;
          if (gx > 0 && gx < halfSize * 2 && gz > 0 && gz < halfSize * 2) {
               const floor = SampleHeight(gx, gz);
               if (pos.y < floor + 2) c.velocity.y = Math.abs(c.velocity.y) + 0.5;
          }

          // Move
          pos.x += c.velocity.x * dt;
          pos.y += c.velocity.y * dt;
          pos.z += c.velocity.z * dt;

          // Face movement direction
          const hVel = Math.sqrt(c.velocity.x * c.velocity.x + c.velocity.z * c.velocity.z);
          if (hVel > 0.1) {
               c.mesh.rotation.y = Math.atan2(c.velocity.x, c.velocity.z);
          }
          // Slight pitch
          c.mesh.rotation.x = Math.atan2(c.velocity.y, hVel) * 0.3;

          // Tail wiggle via slight Z oscillation for liveliness
          c.mesh.rotation.z = Math.sin(t * (c.isShark ? 3 : 8) + i) * 0.05;
     }

     // Kelp sway
     for (let i = 0; i < plants.length; i++) {
          const p = plants[i];
          p.rotation.z = Math.sin(t * 0.5 + i * 0.7) * 0.08;
          p.rotation.x = Math.cos(t * 0.3 + i * 1.1) * 0.04;
     }
}
