import React, {useState} from 'react';
import bomb from "../resources/img/bomb.svg";
import './App.css';

function Cell(props) {
    if (props.isMined && props.isVisible) {
        return (<button
            className="cell mined-cell"
            onContextMenu={props.onContextMenu}
            onClick={props.onClick}
        />)
    } else if (props.isVisible) {
        return (<button
            className="cell safe-cell"
            onContextMenu={props.onContextMenu}
            onClick={props.onClick}
        >{props.minesAround}
        </button>)
    } else if (props.isFlagged) {
        return (<button
            className="cell flagged-cell"
            onContextMenu={props.onContextMenu}
            onClick={props.onClick}
        />)
    } else {
        return (<button
            className="cell"
            onContextMenu={props.onContextMenu}
            onClick={props.onClick}
        />)
    }

}

class Field extends React.Component {
    renderCell(row, column) {
        let cell = this.props.cells[row][column];
        return (
            <Cell
                key={row * 10 + column}
                isVisible={cell.isVisible}
                isMined={cell.isMined}
                minesAround={cell.minesAround}
                isFlagged={cell.isFlagged}
                onClick={() => this.props.onClick(row, column)}
                onContextMenu={() => this.props.onContextMenu(row, column)}
            />
        );
    }

    renderCells() {
        let field = [];
        for (let i = 0; i < this.props.cells.length; i++) {
            field[i] = [];
            for (let j = 0; j < this.props.cells[i].length; j++) {
                field[i][j] = this.renderCell(i, j)
            }
        }
        return field;
    }

    render() {
        return (
            <div id="field" onContextMenu={(e) => e.preventDefault()}>
                {this.renderCells()}
            </div>
        );
    }
}

function FlagsCounter(props) {
    return (
        <div className="red-text-shadow">
            <img src={bomb} alt="bomb" id="flag-cnt-pic"/>
            {props.value}
        </div>
    );
}

let interval = null;
const timerStatesEnum = Object.freeze({
    RUNNING: "running",
    STOPPED: "stopped",
    RESETED: "reseted"
})

class Timer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            seconds: 0,
        }
    }

    componentDidUpdate() {
        switch (this.props.timerState) {
            case timerStatesEnum.RESETED:
                if (interval) {
                    clearInterval(interval);
                    interval = false;
                    this.setState({
                        seconds: 0,
                    })
                }
                break;
            case timerStatesEnum.RUNNING:
                if (!interval) {
                    interval = setInterval(() => {
                        this.setState({
                            seconds: this.state.seconds + 1,
                        })
                    }, 1000);
                }
                break;
            case timerStatesEnum.STOPPED:
                clearInterval(interval);
        }
    }

    render() {
        let minutes = Math.floor(this.state.seconds / 60);
        let seconds = this.state.seconds % 60;
        if (seconds < 10) {
            seconds = "0" + seconds.toString()
        }
        return (
            <div className="red-text-shadow">
                {minutes}:{seconds}
            </div>
        );
    }
}

function Reset(props) {
    return (
        <button id="reset-button" onClick={props.onClick}>Reset</button>
    );
}

function App() {
    const [field, setField] = useState(createField())
    const [availableFLagsAmount, setAvailableFlagsAmount] = useState(10);
    const [timerState, setTimer] = useState(timerStatesEnum.RESETED);
    const [isFirstClick, setFirstClick] = useState(true);

    function handleClickOnReset() {
        setField(createField());
        setAvailableFlagsAmount(10);
        setTimer(timerStatesEnum.RESETED);
        setFirstClick(true);
    }

    function handleLeftClick(row, col) {
        let newField = field.slice(); // created to force rerender
        let pickedCell = newField[row][col];
        if (timerState === timerStatesEnum.RESETED) {
            setTimer(timerStatesEnum.RUNNING)
        }

        if (isFirstClick) {
            putMines(newField, row, col);
            setFirstClick(false);
            showSafeCellsAround(newField, row, col);
        } else if (!pickedCell.isFlagged && !pickedCell.isMined) {
            showSafeCellsAround(newField, row, col);
        } else if (pickedCell.isMined || isWin(newField)) {
            showAllMines(newField);
            setTimer(timerStatesEnum.STOPPED);
        }
        setField(newField);
    }

    function handleRightClick(row, col) {
        let clickedCell = field[row][col];
        if (!clickedCell.isVisible && availableFLagsAmount > 0) {
            clickedCell.isFlagged = !clickedCell.isFlagged;
            setAvailableFlagsAmount(clickedCell.isFlagged ? availableFLagsAmount - 1
                : availableFLagsAmount + 1);
        }
    }

    return (
        <div className="App">
            <div className="game">
                <header className="App-header">
                    <div className="logo">
                        <h2 className="red-text-shadow">Minesweeper</h2>
                        <img src={bomb} className="App-logo red-text-shadow" alt="logo"/>
                    </div>
                    <div className="control-panel">
                        <FlagsCounter
                            value={availableFLagsAmount}
                        />
                        <Reset
                            onClick={handleClickOnReset}
                        />
                        <Timer
                            timerState={timerState}
                        />
                    </div>
                </header>
                <div>
                    <Field
                        cells={field}
                        onClick={(row, column) => handleLeftClick(row, column)}
                        onContextMenu={(row, column) => handleRightClick(row, column)}
                    />
                </div>
            </div>
        </div>
    )
}

function createField() {
    let field = [];
    for (let i = 0; i < 9; i++) {
        field[i] = []
        for (let j = 0; j < 8; j++) {
            field[i][j] = {
                isVisible: false,
                isMined: false,
                isFlagged: false,
                minesAround: ''
            };
        }
    }
    return field;
}

function putMines(field, rowFirst, colFirst) {
    for (let i = 0; i < 10; i++) {
        let random = Math.floor(Math.random() * (72));
        let row = Math.floor(random / 8);
        let col = random % 8;
        if (!field[row][col].isMined && !field[row][col].isVisible && (row !== rowFirst && col !== colFirst)) {
            field[row][col].isMined = true;
        } else {
            i--;
        }
    }
    assignNumberOfMinesAround(field);
}

function assignNumberOfMinesAround(field) {
    for (let row = 0; row < field.length; row++) {
        for (let col = 0; col < field[row].length; col++) {
            let minesAround = countMinesAround(field, row, col);
            if (minesAround > 0 && !field[row][col].isMined) {
                field[row][col].minesAround = minesAround;
            }
        }
    }
}

function countMinesAround(field, row, col) {
    let minesAround = 0;

    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (isOnField(field, row + i, col + j,) && field[row + i][col + j].isMined) {
                minesAround++;
            }
        }
    }
    return minesAround;
}

function isOnField(field, i, j) {
    return i >= 0 && i < field.length && j >= 0 && j < field[i].length;
}

function showSafeCellsAround(field, row, col) {
    if (!isOnField(field, row, col) || field[row][col].isMined || field[row][col].isVisible) {
        return;
    }
    field[row][col].isVisible = true;

    if (field[row][col].minesAround !== '') {
        return;
    }
    showSafeCellsAround(field, row - 1, col);
    showSafeCellsAround(field, row + 1, col);
    showSafeCellsAround(field, row, col - 1);
    showSafeCellsAround(field, row, col + 1);
}

function isWin(field) {
    let flaggedBombs = 0;
    let visibleCells = 0;
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 8; j++) {
            if (field[i][j].isVisible) {
                visibleCells++;
            } else if (field[i][j].isFlagged && field[i][j].isMined) {
                flaggedBombs++;
            }
        }
    }
    return flaggedBombs === 10 && visibleCells === 62;
}

function showAllMines(field) {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 8; j++) {
            if (field[i][j].isMined) {
                field[i][j].isFlagged = false;
                field[i][j].isVisible = true;
            }
        }
    }
}

export default App;
