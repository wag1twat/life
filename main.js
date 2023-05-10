class Cell {
    id;
    cell;
    constructor(id) {
        this.id = id;
        this.cell = document.createElement("div");
    }
    static isCell(cells, id) {
        const el = Cell.get(cells, id);
        return el ? el.dataset.type === "cell" : false;
    }
    static destructId(id) {
        const [rowIndex, colIndex] = id.split("-");
        return [+rowIndex, +colIndex];
    }
    static get(cells, id) {
        let item = null;
        const length = cells.length;
        for (let i = 0; i < length; i++) {
            if (cells[i].id === id) {
                item = cells[i];
                break;
            } else {
                continue;
            }
        }
        return item;
    }
    static active(cells, id) {
        const el = Cell.get(cells, id);
        if (el) {
            el.setAttribute("data-value", 1);
        }
    }
    static deactive(cells, id) {
        const el = Cell.get(cells, id);
        if (el) {
            el.setAttribute("data-value", 0);
        }
    }
    create() {
        this.cell.setAttribute("data-type", "cell");
        this.cell.setAttribute("data-value", 0);
        this.cell.id = this.id;
        return this.cell;
    }
}

class Field {
    size;
    matrix = [];
    nextMatrix = [];
    containerId;
    requestTimeout;
    cells = [];
    constructor(size, containerId) {
        this.size = size;
        this.containerId = containerId;
        this.createMatrix = this.createMatrix.bind(this);
        this.computePaint = this.computePaint.bind(this);
        this.computeMatrix = this.computeMatrix.bind(this);
        this.containerEvents = this.containerEvents.bind(this);
        this.install = this.install.bind(this);
        this.start = this.start.bind(this);
        this.initialize = this.initialize.bind(this);
    }
    createMatrix(container) {
        let rowIndex = this.size;
        while (rowIndex--) {
            this.matrix[rowIndex] = [];
            this.nextMatrix[rowIndex] = [];
            let colIndex = this.size;
            while (colIndex--) {
                this.matrix[rowIndex][colIndex] = 0;
                this.nextMatrix[rowIndex][colIndex] = 0;
                const cell = new Cell(`${rowIndex}-${colIndex}`);
                const element = cell.create();
                container.appendChild(element);
            }
        }
        this.cells = container.children;
    }

    computeMatrix() {
        let rowIndex = this.size;
        while (rowIndex--) {
            let colIndex = this.size;
            while (colIndex--) {
                this.matrix[rowIndex][colIndex] =
                    this.nextMatrix[rowIndex][colIndex];
                this.nextMatrix[rowIndex][colIndex] = 0;
            }
        }
    }

    computePaint(id) {
        const [rowIndex, colIndex] = Cell.destructId(id);

        let prevRowIndex = rowIndex - 1;
        let nextRowIndex = rowIndex + 1;
        const prevColIndex = colIndex - 1;
        const nextColIndex = colIndex + 1;
        if (prevRowIndex < 0) {
            prevRowIndex = this.size - 1;
        }
        if (nextRowIndex > this.size - 1) {
            nextRowIndex = 0;
        }

        const prevRow = this.matrix[prevRowIndex];
        const targetRow = this.matrix[rowIndex];
        const nextRow = this.matrix[nextRowIndex];

        let neighbours = [
            prevRow[prevColIndex < 0 ? this.size - 1 : prevColIndex],
            prevRow[colIndex],
            prevRow[nextColIndex > this.size - 1 ? 0 : nextColIndex],
            targetRow[prevColIndex < 0 ? this.size - 1 : prevColIndex],
            targetRow[nextColIndex > this.size - 1 ? 0 : nextColIndex],
            nextRow[prevColIndex < 0 ? this.size - 1 : prevColIndex],
            nextRow[colIndex],
            nextRow[nextColIndex > this.size - 1 ? 0 : nextColIndex]
        ];

        neighbours = neighbours.filter((n) => n === 1).length;

        if (this.matrix[rowIndex][colIndex] === 1) {
            if (neighbours < 2) {
                this.nextMatrix[rowIndex][colIndex] = 0;
                Cell.deactive(this.cells, id);
            } else if (neighbours === 2 || neighbours === 3) {
                this.nextMatrix[rowIndex][colIndex] = 1;
                Cell.active(this.cells, id);
            } else if (neighbours > 3) {
                this.nextMatrix[rowIndex][colIndex] = 0;
                Cell.deactive(this.cells, id);
            }
        } else if (this.matrix[rowIndex][colIndex] === 0) {
            if (neighbours === 3) {
                this.nextMatrix[rowIndex][colIndex] = 1;
                Cell.active(this.cells, id);
            }
        }
    }

    initialize(e) {
        e.stopPropagation();
        if (Cell.isCell(this.cells, e.target.id)) {
            const [rowIndex, colIndex] = Cell.destructId(e.target.id);
            this.matrix[rowIndex][colIndex] = 1;
            Cell.active(this.cells, e.target.id);
        }
    }
    containerEvents(container) {
        container.onclick = this.initialize;
    }

    install() {
        const container = document.getElementById(this.containerId);
        container.setAttribute("data-type", "container");
        container.style.display = "grid";
        container.style.gridTemplateColumns = `repeat(${this.size}, min-content)`;
        while (container.lastElementChild) {
            container.removeChild(container.lastElementChild);
        }
        this.createMatrix(container);
        this.containerEvents(container);
    }

    start() {
        const fps = 12;
        if (this.requestTimeout) {
            clearTimeout(this.requestTimeout);
        }
        // Можно сделать без цикла, через MutationObserver
        this.requestTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
                let rowIndex = this.size;
                while (rowIndex--) {
                    let colIndex = this.size;
                    while (colIndex--) {
                        this.computePaint(`${rowIndex}-${colIndex}`);
                    }
                }
                this.computeMatrix();
                this.start();
            });
        }, 1000 / fps);
    }
    reset() {
        if (this.requestTimeout) {
            clearTimeout(this.requestTimeout);
        }
        this.install();
    }
}

function main() {
    const field = new Field(100, "app");

    field.install();

    const start = document.querySelector("#start");
    const reset = document.querySelector("#reset");

    start.onclick = () => {
        field.start();
    };
    reset.onclick = () => {
        field.reset();
    };
}

main();
