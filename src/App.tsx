import './styles.css';
import { useState, useCallback } from 'react';
import clsx from 'clsx';

const initData = [
  [0, 0, 3, 0, 0, 0, 6, 7, 0],
  [0, 8, 0, 0, 3, 6, 0, 0, 0],
  [0, 0, 2, 0, 5, 7, 8, 0, 0],
  [0, 0, 0, 0, 8, 0, 0, 0, 0],
  [0, 5, 0, 0, 0, 0, 9, 8, 7],
  [7, 0, 0, 5, 4, 0, 0, 0, 0],
  [0, 0, 6, 8, 2, 0, 0, 0, 5],
  [4, 0, 0, 0, 7, 0, 0, 6, 0],
  [0, 3, 0, 0, 0, 0, 7, 0, 0],
];

type Cell = {
  value: number;
  fixed: boolean;
};

type Data = Cell[][];

function copy(data: Data): Data {
  return data.map((row) => row.map((cell) => ({ ...cell })));
}

function reset(data: Data): Data {
  data.forEach((row) =>
    row.forEach((cell) => {
      if (!cell.fixed) {
        cell.value = 0;
      }
    })
  );
  return data;
}

function resolve(data: Data): Data {
  function _checkRow(row: number, col: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (i === col) {
        // self
        continue;
      }
      if (data[row][i].value === data[row][col].value) {
        return false;
      }
    }
    return true;
  }

  function _checkColumn(row: number, col: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (i === row) {
        // self
        continue;
      }
      if (data[i][col].value === data[row][col].value) {
        return false;
      }
    }
    return true;
  }

  function _checkSmallGrid(row: number, col: number): boolean {
    let rowStart = Math.floor(row / 3) * 3;
    let colStart = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let _row = rowStart + i;
        let _col = colStart + j;
        if (_row === row && _col === col) {
          // self
          continue;
        }
        if (data[_row][_col].value === data[row][col].value) {
          return false;
        }
      }
    }
    return true;
  }

  function _guess(row: number, col: number, start: number): boolean {
    //console.log("guess [%d, %d] from %d", row, col, start);
    for (let x = start; x <= 9; x++) {
      data[row][col].value = x;
      if (_checkRow(row, col) && _checkColumn(row, col) && _checkSmallGrid(row, col)) {
        return true;
      }
    }
    // dead
    data[row][col].value = 0;
    return false;
  }

  let blankCells: [number, number][] = [];
  let steps = 0;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (!data[row][col].fixed) {
        blankCells.push([row, col]);
      }
    }
  }

  let pos = 0;
  while (true) {
    let [row, col] = blankCells[pos];
    let x = data[row][col];
    const dead = !_guess(row, col, x.value + 1);
    steps++;
    if (dead) {
      // 死局，回退到上一个位置
      //console.log("dead, go back");
      pos--;
      if (pos < 0) {
        throw new Error("can't resolve this game");
      }
    } else {
      // 移到下一个位置
      pos++;
    }
    if (pos >= blankCells.length) {
      // 完成
      break;
    }
  }
  console.log('steps: %d', steps);

  return data;
}

export default function App() {
  const [selectedCell, setSelectedCell] = useState<[number, number]>();
  const [data, setData] = useState<Data>(
    initData.map((row) =>
      row.map((value) => ({
        value,
        fixed: value > 0,
      }))
    )
  );

  const handleError = (err: any) => {
    console.error(err);
    alert(err.message);
  };

  const clearSelectedCell = () => {
    setSelectedCell(undefined);
  };

  const handleReset = () => {
    try {
      setData(reset(copy(data)));
      clearSelectedCell();
    } catch (err) {
      handleError(err);
    }
  };

  const handleResolve = () => {
    try {
      setData(resolve(reset(copy(data))));
      clearSelectedCell();
    } catch (err) {
      handleError(err);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (data[row][col].fixed) {
      return;
    }
    if (selectedCell && selectedCell[0] === row && selectedCell[1] === col) {
      clearSelectedCell();
    } else {
      setSelectedCell([row, col]);
    }
  };

  const handleNumClick = (x: number) => {
    if (selectedCell) {
      const newData = copy(data);
      const [row, col] = selectedCell;
      newData[row][col].value = x;
      setData(newData);
    }
  };

  return (
    <div className='container'>
      <div className='grid'>
        {data.map((row, rowIndex) => {
          return (
            <div key={rowIndex} className='row'>
              {row.map((cell, colIndex) => {
                return (
                  <div
                    key={colIndex}
                    className={clsx('cell', {
                      'cell-fixed': cell.fixed,
                      'cell-selected': selectedCell && selectedCell[0] === rowIndex && selectedCell[1] === colIndex,
                    })}
                    onClick={(e) => handleCellClick(rowIndex, colIndex)}
                  >
                    {cell.value > 0 ? cell.value : ''}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className='toolbar'>
        <button className='button' onClick={handleReset}>
          重新开始
        </button>
        <button className='button' onClick={handleResolve}>
          求解
        </button>
      </div>
      {selectedCell ? (
        <div className='grid'>
          <div className='row'>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => (
              <div
                key={x}
                className={clsx('cell', {
                  'num-selected': data[selectedCell[0]][selectedCell[1]].value === x,
                })}
                onClick={(e) => handleNumClick(x)}
              >
                {x}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
