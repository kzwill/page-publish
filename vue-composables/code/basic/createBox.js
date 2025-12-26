/**
 * @version 2.0
 * @author ThingJS
 */

const app = new THING.App();

app.camera.position = [7, 7, 7];

const box = new THING.Box(2, 2, 2, {
    pivot: [0, 0, 0]
});

app.helper.grid = true;

const gui = new dat.GUI();
gui.add(box, 'width', 0.1, 10, 0.1)
gui.add(box, 'height', 0.1, 10, 0.1)
gui.add(box, 'depth', 0.1, 10, 0.1)
