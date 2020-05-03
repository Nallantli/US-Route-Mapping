function findPath(start, end, nodes) {
    const distance = (a, b) => {
        return Math.sqrt(Math.pow(a.lon - b.lon, 2) + Math.pow(a.lat - b.lat, 2));
    }

    var g_score = {};
    var f_score = {};
    var prev = {};
    var close_set = [];
    var open_set = [start];

    for (var n in nodes) {
        g_score[n] = Number.MAX_VALUE;
        f_score[n] = Number.MAX_VALUE;
        prev[n] = null;
    }
    g_score[start] = 0.0;
    f_score[start] = distance(nodes[start], nodes[end]);

    var loop = () => {
        var c = 0
        for (var i = 0; i < open_set.length; i++) {
            if (c == 0)
                c = open_set[i];
            else if (f_score[open_set[i]] < f_score[c])
                c = open_set[i];
        }
        if (c != 0) {
            close_set.push(c);
            open_set = open_set.filter(n => n != c);
            for (var id in nodes[c].neighbors) {
                var tent_g = g_score[c] + distance(nodes[c], nodes[id]);
                if (tent_g < g_score[id]) {
                    g_score[id] = tent_g;
                    f_score[id] = tent_g + distance(nodes[id], nodes[end]);
                    prev[id] = c;
                    if (!close_set.includes(id)) {
                        open_set.push(id);
                    }
                }
            }
        }
    };

    while (open_set.length > 0) {
        loop();
    }

    var path = [];

    var c = end;
    while (c != null) {
        path.push(nodes[c]);
        c = prev[c];
    }

    path = path.reverse();

    return path;
}

self.addEventListener('message', function(e) {
    self.postMessage(findPath(e.data.start, e.data.end, e.data.nodes));
}, false);