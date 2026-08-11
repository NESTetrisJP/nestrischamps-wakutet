# ArrayView

The `ArrayView` class (`public/views/ArrayView.js`) is an immutable, lightweight proxy over a standard JavaScript array. It is specifically designed to provide memory-efficient, point-in-time snapshots of growing arrays.

## The Problem

In the context of the NESTrisChamps replay system (`BaseGame.js`), the game records states across thousands of frames. Over the course of a game, many core events accumulate in arrays, such as:
- **`points`**: Score events.
- **`pieces`**: Tetromino drop events.
- **`clears`**: Line clear events.

To implement a "seekable" replay without recalculating states, each individual `frame` object requires access to the exact list of point, piece, and clear events that had occurred *up to that frame*.

A naive approach would be to copy these event data arrays into the `frame` object on every frame increment:

```javascript
// Extremely inefficient (Massive RAM consumption)
const frame = {
    idx: this.frames.length,
    raw: data,
    points: [...this.points], // deep or shallow copy duplicating data
    pieces: [...this.pieces]
};
```

Since the game generates thousands of frames (at 60 FPS), copying growing arrays on every frame leads to exponential memory bloat and rapid application crashes.

## The Solution: ArrayView

Instead of duplicating the data, `BaseGame` leverages `ArrayView` to create "length-locked" references to the master arrays.

When initializing the `ArrayView`, it only stores a reference back to the original source array, the start index, and its current length:

```javascript
/* array is the master array, length locks to the array's current size */
constructor(array, start_index = 0, length = null) {
	this._source = array;
	this._start_index = start_index;
	this.length = length === null ? array.length - start_index : length;
    // ...
}
```

### Usage in BaseGame.js

`BaseGame` maintains a single master copy of `this.points`, `this.pieces`, and `this.clears`.

Whenever a *new* event occurs (meaning the length of the master array grows), `BaseGame` instantiates a new `ArrayView`:

```javascript
_recordPointEvent(cleared = 0) {
    // 1. Push new event to the master array
    this.points.push(evt);

    // 2. Create a new length-locked snapshot view
    this.array_views.points = new ArrayView(this.points); 
}
```

As normal tick updates occur without state-changing events, new frames simply hold references to these `ArrayView` snapshot instances:

```javascript
_addFrame(data) {
    const frame = {
        idx: this.frames.length,
        raw: data,
        // Passes the most recently generated snapshot view 
        points: this.array_views.points,  
        pieces: this.array_views.pieces,
        clears: this.array_views.clears,
    };
    this.frames.push(frame);
    return frame;
}
```

### Why This Works

1. **Zero Data Duplication:** Every frame simply holds a pointer to a few `ArrayView` instances. The core event data is never mapped or deep-copied.
2. **Immutability:** Each `ArrayView` is read-only.
3. **Temporal Scoping:** An `ArrayView` created at Frame 150 might have a `length` of 5. Even if the master `this.points` array grows to a length of 200 by the end of the game, the `ArrayView` from Frame 150 still enforces its `length` of 5. It safely blocks access to "future" elements through its `.at()` bound checks:

```javascript
at(idx) {
    if (idx < 0 || idx >= this.length) {
        return undefined; // Safely hides the rest of the growing array
    }
    return this._source[this._start_index + idx];
}
```

This elegant trick allows time-traveling debuggers and replay logic to seek to thousands of individual frames effortlessly with next to zero memory overhead.
