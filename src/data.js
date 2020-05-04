const w_width = grid(document.body.clientWidth, 1);
const w_height = grid(document.body.clientHeight, 1);
const DPI = window.devicePixelRatio;
var offset_x = 0;
var offset_y = 0;
var offset_z = 1;
var speed = 5;
var PATH = [];
var CACHE_PATH = [];
var MAX_POP = 0;
var MIN_POP = 9999;
var MOUSE_POS = { x: 0, y: 0 };
var OLD_MOUSE_POS = { x: 0, y: 0 };

var city_a = null;
var city_b = null;

var CITIES = {};

let c = document.getElementById('map-canvas');
c.width = w_width * DPI;
c.height = w_height * DPI;
let ctx = c.getContext("2d", { alpha: false, desynchronized: true });
ctx.font = "1em Arial";
ctx.scale(DPI, -DPI);

var lower_y = 99999;
var upper_y = -99999;
var lower_x = 99999;
var upper_x = -99999;

for (var i = 0; i < PLACES.length; i++) {
    var o = PLACES[i];
    if (parseFloat(o.lat) < lower_y)
        lower_y = parseFloat(o.lat);
    if (parseFloat(o.lat) > upper_y)
        upper_y = parseFloat(o.lat);
    if (parseFloat(o.lon) < lower_x)
        lower_x = parseFloat(o.lon);
    if (parseFloat(o.lon) > upper_x)
        upper_x = parseFloat(o.lon);
    if (parseInt(o.pop) > MAX_POP)
        MAX_POP = parseInt(o.pop);
    if (parseInt(o.pop) < MIN_POP)
        MIN_POP = parseInt(o.pop);
    CITIES[o.name + ", " + o.state] = o;
}

autocomplete(document.getElementById("a_input"), Object.keys(CITIES));
autocomplete(document.getElementById("b_input"), Object.keys(CITIES));

offset_z = Math.floor(scale(upper_x * DPI, lower_x * DPI));
offset_x = 130;
offset_y = -50;

console.log(lower_y);
console.log(upper_y);
console.log(lower_x);
console.log(upper_x);
console.log(upper_x - lower_x);

let xdirection = 0; // -1 left, 1 right
let ydirection = 0; // -1 up, 1 down
let zdirection = 0; // -1 up, 1 down
let scrollz = 0;

var myTarget;

document.addEventListener('mousedown', function(event) {
    myTarget = event.target;
}, false);

document.addEventListener('wheel', function(event) {
    if (myTarget != c)
        return;
    event.preventDefault();
    scrollz = event.deltaY;
});

document.addEventListener("keydown", (e) => {
    if (myTarget != c)
        return;
    switch (e.code) {
        case "KeyW":
            ydirection = -1;
            break;
        case "KeyA":
            xdirection = 1;
            break;
        case "KeyS":
            ydirection = 1;
            break;
        case "KeyD":
            xdirection = -1;
            break;
        case "KeyQ":
            zdirection = 1;
            break;
        case "KeyE":
            zdirection = -1;
            break;
    }
});

document.addEventListener("keyup", (e) => {
    if (myTarget != c)
        return;
    switch (e.code) {
        case "KeyW":
        case "KeyS":
            ydirection = 0;
            break;
        case "KeyA":
        case "KeyD":
            xdirection = 0;
            break;
        case "KeyQ":
        case "KeyE":
            zdirection = 0;
            break;
    }
});

var first_render = false;

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

document.addEventListener('mousemove', function(evt) {
    var mousePos = getMousePos(c, evt);
    MOUSE_POS.x = mousePos.x;
    MOUSE_POS.y = mousePos.y;
});

async function prerenderMap(offset_z, raw_x, raw_y) {
    setTimeout(() => {
        var q_lon = raw_x * 10;
        var q_lat = raw_y * 10;
        //console.log("Generating (" + q_lon + ", " + q_lat + ", Z:" + offset_z + ")");
        var canvas = document.createElement('canvas');
        canvas.width = translateX(10, offset_z);
        canvas.height = translateY(10, offset_z);
        var ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });

        ctx.strokeStyle = "white";
        for (o in NODES) {
            var node = NODES[o];
            var n_lon = parseFloat(node.lon);
            var n_lat = parseFloat(node.lat);
            if (n_lon > q_lon && n_lon < q_lon + 10 && n_lat > q_lat && n_lat < q_lat + 10) {
                var x = translateX(n_lon - q_lon, offset_z);
                var y = translateY(n_lat - q_lat, offset_z);
                for (n in node.neighbors) {
                    var n2 = NODES[n];
                    var n2_lon = n2.lon;
                    var n2_lat = n2.lat;
                    if (parseInt(n) > parseInt(o) || !(n2_lon > q_lon && n2_lon < q_lon + 10 && n2_lat > q_lat && n2_lat < q_lat + 10)) {
                        switch (node.neighbors[n][0].type) {
                            case "P--":
                                ctx.lineWidth = 1;
                                break;
                            default:
                                ctx.lineWidth = 0.5;
                        }
                        ctx.beginPath()
                        ctx.moveTo(x, y);
                        ctx.lineTo(translateX(parseFloat(NODES[n].lon) - q_lon, offset_z), translateY(parseFloat(NODES[n].lat) - q_lat, offset_z));
                        ctx.stroke();
                    }
                }
            }
        }

        ctx.fillStyle = "#ff000044";
        for (var i = 0; i < PLACES.length; i++) {
            var o = PLACES[i];
            var o_lon = parseFloat(o.lon);
            var o_lat = parseFloat(o.lat);
            if (o_lon > q_lon && o_lon < q_lon + 10 && o_lat > q_lat && o_lat < q_lat + 10) {
                var scale = ((o.pop + MAX_POP) / (MAX_POP + MAX_POP)) / 2;
                var size = Math.sqrt(Math.sqrt(scale) * offset_z * 0.001 * DPI);
                if (size >= 0.5) {
                    var x = translateX(o_lon - q_lon, offset_z);
                    var y = translateY(o_lat - q_lat, offset_z);
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }

        cache[offset_z][raw_x][raw_y] = canvas;
    }, 0);
}

var cache = {};
for (var i = 20; i <= 200; i++) {
    cache[i] = {};
    for (var x = -18; x <= 18; x++) {
        cache[i][x] = {};
        for (var y = -9; y <= 9; y++)
            cache[i][x][y] = 0;
    }
}

(function render() {
    window.requestAnimationFrame(render);
    var w_h_scale = (w_height / offset_z);
    var w_w_scale = (w_width / offset_z);

    var new_offset_x = offset_x + (xdirection) * speed * 5 / offset_z;
    var new_offset_y = offset_y + (ydirection) * speed * 5 / offset_z;
    var new_offset_z = Math.max(20, Math.min(200, Math.round(offset_z + zdirection + scrollz)));

    if (new_offset_z != offset_z || new_offset_x != offset_x || new_offset_y != offset_y || MOUSE_POS != OLD_MOUSE_POS || !first_render) {
        first_render = true;
        OLD_MOUSE_POS.x = MOUSE_POS.x;
        OLD_MOUSE_POS.y = MOUSE_POS.y;
        w_h_scale = (w_height / new_offset_z);
        w_w_scale = (w_width / new_offset_z);
        offset_x = new_offset_x;
        offset_y = new_offset_y;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, c.width, -c.height);

        if (new_offset_z != offset_z) {
            offset_z = new_offset_z;
        }

        var min_lon = (-offset_x);
        var min_lat = (-offset_y);
        var max_lon = (-offset_x + w_w_scale);
        var max_lat = (-offset_y - w_h_scale);
        var mid_lon = ((-offset_x + (-offset_x + w_w_scale)) / 2);
        var mid_lat = ((-offset_y + (-offset_y + w_h_scale)) / 2);

        ctx.lineWidth = 1;
        ctx.strokeStyle = "#222";
        for (var i = -9; i < 10; i++) {
            ctx.beginPath()
            ctx.moveTo(translateX(offset_x - 180, offset_z), translateY(offset_y + i * 10, offset_z));
            ctx.lineTo(translateX(offset_x + 180, offset_z), translateY(offset_y + i * 10, offset_z));
            ctx.stroke();
        }
        for (var i = -18; i < 19; i++) {
            ctx.beginPath()
            ctx.moveTo(translateX(offset_x + i * 10, offset_z), translateY(offset_y - 90, offset_z));
            ctx.lineTo(translateX(offset_x + i * 10, offset_z), translateY(offset_y + 90, offset_z));
            ctx.stroke();
        }

        var min_q_x = Math.floor((min_lon) / 10);
        var min_q_y = Math.ceil((min_lat) / 10);
        var max_q_x = Math.ceil((max_lon) / 10);
        var max_q_y = Math.floor((max_lat) / 10);

        if (cache[offset_z] !== undefined) {
            for (var x = min_q_x; x <= max_q_x; x++) {
                if (cache[offset_z][x] !== undefined) {
                    for (var y = min_q_y; y >= max_q_y; y--) {
                        if (cache[offset_z][x][y] !== undefined) {
                            //if (cache[offset_z][x][y] === 1) {
                            //console.log("Replacing", offset_z, x, y);
                            var nearest = 0;
                            var dist = 99999;
                            for (var i in cache) {
                                if (Math.abs(i - offset_z) < dist && cache[i][x][y] !== 0 && cache[i][x][y] !== 1 && cache[i][x][y] !== undefined) {
                                    nearest = i;
                                    dist = Math.abs(i - offset_z);
                                }
                            }
                            //ctx.fillStyle = "#0000dd";
                            //ctx.fillRect(translateX(offset_x + x * 10, offset_z), translateY(offset_y + y * 10, offset_z), translateX(10, offset_z), translateY(10, offset_z));
                            try {
                                ctx.drawImage(cache[nearest][x][y], translateX(offset_x + x * 10, offset_z), translateY(offset_y + y * 10, offset_z), translateX(10, offset_z), translateY(10, offset_z));
                            } catch (err) {
                                //console.log("Tried Replacing", offset_z, x, y, "with", nearest);
                                //console.log(err);
                            }
                            // } else if (cache[offset_z][x][y] !== 0) {
                            //    ctx.drawImage(cache[offset_z][x][y], translateX(offset_x + x * 10, offset_z), translateY(offset_y + y * 10, offset_z));
                            // }
                        }
                    }
                }
            }
        }

        if (PATH.length > 0) {
            var miles = 0;
            var path = "<table>";
            ctx.strokeStyle = "#33ff33";
            ctx.lineWidth = 2.5;
            var last = null;
            var curr_miles = 0;
            var curr_road = "";
            for (var i = 0; i < PATH.length; i++) {
                var p = PATH[i];
                if (last != null) {
                    ctx.beginPath()
                    ctx.moveTo(translateX(parseFloat(last.lon) + offset_x, offset_z), translateY(parseFloat(last.lat) + offset_y, offset_z));
                    ctx.lineTo(translateX(parseFloat(p.lon) + offset_x, offset_z), translateY(parseFloat(p.lat) + offset_y, offset_z));
                    ctx.stroke();
                    var road = p.neighbors[last.id][0];
                    if (road.name == curr_road)
                        curr_miles += parseFloat(road.length);
                    else {
                        if (curr_road != "") {
                            path += "<tr><td><b>" + curr_road + "</b></td><td class=\"right-align\">" + curr_miles.toFixed(2) + " MI</td></tr>";
                        }
                        curr_miles = parseFloat(road.length);
                    }
                    curr_road = road.name;
                    miles += parseFloat(road.length);
                }
                last = p;
            }
            if (PATH != CACHE_PATH) {
                path += "<tr><td><b>" + curr_road + "</b></td><td class=\"right-align\">" + curr_miles.toFixed(2) + " MI</td></tr>";
                CACHE_PATH = PATH;
                document.getElementById("sig").innerHTML = "<i>Length: " + miles.toFixed(2) + " MI</i>";
                document.getElementById("path").innerHTML = path + "</table>";
            }
        }

        if (city_a != null && city_b != null) {
            labelText(CITIES[city_a].lon, CITIES[city_a].lat, city_a);
            labelText(CITIES[city_b].lon, CITIES[city_b].lat, city_b);
        }

        ctx.scale(1, -1);
        var lon = (MOUSE_POS.x / offset_z) - offset_x;
        var lat = -((MOUSE_POS.y / offset_z) + offset_y);
        var closest = getClosest(lon, lat);
        var label = closest.name + ", " + closest.state;
        ctx.fillStyle = "#fff";
        ctx.fillRect(MOUSE_POS.x, MOUSE_POS.y - 22, ctx.measureText(label).width + 10, 22);
        ctx.fillStyle = "#333";
        ctx.fillRect(MOUSE_POS.x + 1, MOUSE_POS.y - 21, ctx.measureText(label).width + 8, 20);
        ctx.fillStyle = "#fff";
        ctx.fillText(label, MOUSE_POS.x + 5, MOUSE_POS.y - 5);
        ctx.scale(1, -1);
        ctx.fillStyle = "#6666ff";
        ctx.beginPath();
        ctx.arc(translateX(parseFloat(closest.lon) + offset_x, offset_z), translateY(parseFloat(closest.lat) + offset_y, offset_z), offset_z / 20, 0, Math.PI * 2);
        ctx.fill();
    }

    var min_q_x = Math.floor((min_lon) / 10);
    var min_q_y = Math.ceil((min_lat) / 10);
    var max_q_x = Math.ceil((max_lon) / 10);
    var max_q_y = Math.floor((max_lat) / 10);

    if (cache[offset_z] !== undefined) {
        for (var x = min_q_x; x <= max_q_x; x++) {
            if (cache[offset_z][x] !== undefined) {
                for (var y = min_q_y; y >= max_q_y; y--) {
                    if (cache[offset_z][x][y] !== undefined) {
                        if (cache[offset_z][x][y] === 0 && zdirection == 0 && Math.abs(scrollz) < 0.5) {
                            cache[offset_z][x][y] = 1;
                            prerenderMap(offset_z, x, y);
                        }
                    }
                }
            }
        }
    }
})();

function labelText(lon, lat, label) {
    ctx.scale(1, -1);
    var x = translateX(parseFloat(lon) + offset_x, offset_z);
    var y = -translateY(parseFloat(lat) + offset_y, offset_z);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x, y - 22, ctx.measureText(label).width + 10, 22);
    ctx.fillStyle = "#333";
    ctx.fillRect(x + 1, y - 21, ctx.measureText(label).width + 8, 20);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, x + 6, y - 6);
    ctx.scale(1, -1);
}

function getClosest(lon, lat) {
    var closest = null;
    for (var i = 0; i < PLACES.length; i++) {
        if (closest == null) {
            closest = PLACES[i];
        } else if (Math.sqrt(Math.pow(lon - closest.lon, 2) + Math.pow(lat - closest.lat, 2)) > Math.sqrt(Math.pow(lon - PLACES[i].lon, 2) + Math.pow(lat - PLACES[i].lat, 2))) {
            closest = PLACES[i];
        }
    }
    return closest;
}

function translateX(x, offset_z) {
    return (x * offset_z);
}

function translateY(y, offset_z) {
    return (y * offset_z);
}

function grid(x, size) {
    return size * Math.floor(x / size);
}

function scale(upper_x, lower_x) {
    var d = c.width / Math.abs(upper_x - lower_x);
    return d;
}

var pathWorker = new Worker('src/worker.js');

pathWorker.addEventListener('message', function(e) {
    console.log(e.data);
    PATH = e.data;
}, false);

function onClick() {
    city_a = document.getElementById("a_input").value;
    city_b = document.getElementById("b_input").value;

    if (Object.keys(CITIES).includes(city_a) && Object.keys(CITIES).includes(city_b)) {
        document.getElementById("sig").innerHTML = "<i>Searching for Path...</i>";
        PATH = [];
        pathWorker.postMessage({
            start: CITIES[city_a].intersection,
            end: CITIES[city_b].intersection,
            nodes: NODES
        });
    }
}

function pulloutNav() {
    var navbar = document.getElementById("navbar");
    var navbutton = document.getElementById("pullout");
    if (navbar.classList.contains("hidden")) {
        navbar.classList.remove("hidden");
        navbar.classList.add("shown");
        navbutton.classList.remove("hidden-b");
        navbutton.classList.add("shown-b");
        document.getElementById("navbutton").innerHTML = "⇒";
    } else {
        navbar.classList.remove("shown");
        navbar.classList.add("hidden");
        navbutton.classList.remove("shown-b");
        navbutton.classList.add("hidden-b");
        document.getElementById("navbutton").innerHTML = "⇐";
    }
}