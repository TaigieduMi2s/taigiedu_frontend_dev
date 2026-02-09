import { useState, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
} from '@tanstack/react-table';

// 拖曳功能
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import './AdminDataTable.css';
import dragIcon from '../../assets/adminPage/bars-2.png';

/**
 * 可拖曳的表格行組件
 */
const SortableTableRow = ({ row, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: row.original.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
        zIndex: isDragging ? 10 : 0,
    };

    return (
        <tr ref={setNodeRef} style={style} className={isDragging ? 'dragging-row' : ''}>
            {/* 拖曳句柄 - 整個 cell 都可以拖曳 */}
            <td
                className="drag-handle-column"
                {...listeners}
                {...attributes}
            >
                <img src={dragIcon} alt="拖曳" className="drag-handle-icon" />
            </td>
            {children}
        </tr>
    );
};


SortableTableRow.propTypes = {
    row: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
};

/**
 * 通用管理後台資料表格組件
 * 
 * @param {Array} data - 表格資料
 * @param {Array} columns - 欄位定義
 * @param {boolean} enableSorting - 是否啟用排序功能
 * @param {boolean} enableDragging - 是否啟用拖曳排序功能
 * @param {Function} onDragEnd - 拖曳結束時的回調函數
 * @param {Object} emptyState - 空資料狀態的設定
 * @param {Object} loadingState - 載入中狀態的設定
 * @param {boolean} isLoading - 是否正在載入中
 * @param {string|null} error - 錯誤訊息
 * @param {Function} onRetry - 重試回調函數
 * @param {string} tableClassName - 自訂表格 className
 */
const AdminDataTable = ({
    data = [],
    columns = [],
    enableSorting = true,
    enableDragging = true,
    onDragEnd,
    emptyState = { message: '目前沒有資料' },
    isLoading = false,
    error = null,
    onRetry,
    tableClassName = '',
}) => {
    const [sorting, setSorting] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [columnWidths, setColumnWidths] = useState([]);
    const tableRef = useRef(null);

    // 拖曳感應器設定
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // TanStack Table 欄位設定
    const tableColumns = useMemo(() => columns, [columns]);

    // TanStack Table 實例
    const table = useReactTable({
        data,
        columns: tableColumns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
        enableSorting,
    });

    // 拖曳事件處理 - 捕獲實際欄寬
    const handleDragStart = useCallback((event) => {
        setActiveId(event.active.id);

        // 捕獲當前表格的實際欄寬
        if (tableRef.current) {
            const headerCells = tableRef.current.querySelectorAll('thead th');
            const widths = Array.from(headerCells).map(cell => cell.getBoundingClientRect().width);
            setColumnWidths(widths);
        }
    }, []);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        if (active.id !== over?.id && onDragEnd) {
            onDragEnd(active.id, over?.id);
        }
        setActiveId(null);
    }, [onDragEnd]);

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
    }, []);

    // 找到正在拖曳的項目
    const activeItem = useMemo(
        () => data.find((item) => item.id === activeId),
        [activeId, data]
    );

    // 載入中狀態
    if (isLoading) {
        return (
            <div className="admin-table-loading">
                <div className="loading-spinner"></div>
                <p>載入中...</p>
            </div>
        );
    }

    // 錯誤狀態
    if (error) {
        return (
            <div className="admin-table-loading">
                <p>載入失敗，請重新整理頁面</p>
                {onRetry && (
                    <button onClick={onRetry} className="btn btn-primary mt-2">
                        重新載入
                    </button>
                )}
            </div>
        );
    }

    // 空資料狀態
    if (data.length === 0) {
        return (
            <div className="admin-table-empty text-center py-5">
                <p>{emptyState.message}</p>
            </div>
        );
    }

    // 渲染表格內容
    const renderTableContent = () => (
        <table ref={tableRef} className={`table admin-data-table ${tableClassName}`}>
            <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                        {/* 拖曳列的空表頭 */}
                        {enableDragging && <th className="drag-handle-column" style={{ width: '40px' }}></th>}
                        {headerGroup.headers.map((header) => {
                            // 獲取目前的欄位 ID
                            const colId = (header.column.id || "").toLowerCase();

                            // 獲取渲染後的內容
                            const renderedHeader = flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                            );

                            // 如果表頭為空，或是特定的操作欄位，且沒有提供實質內容
                            let finalHeader = renderedHeader;
                            const isHeaderEmpty = !renderedHeader ||
                                (typeof renderedHeader === 'string' && renderedHeader.trim() === '') ||
                                (Array.isArray(renderedHeader) && renderedHeader.length === 0);

                            if (isHeaderEmpty) {
                                if (colId.includes('edit')) finalHeader = '修改';
                                else if (colId.includes('delete') || colId.includes('action')) finalHeader = '刪除';
                            }

                            return (
                                <th
                                    key={header.id}
                                    className={`${header.column.getCanSort() ? 'admin-table-header sortable' : 'admin-table-header'} ${colId.includes('edit') || colId.includes('delete') || colId.includes('action') ? 'action-column' : ''}`}
                                    onClick={header.column.getToggleSortingHandler()}
                                    style={{
                                        cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                        width: header.column.columnDef.size !== 150 ? `${header.column.columnDef.size}px` : 'auto',
                                        minWidth: header.column.columnDef.size !== 150 ? `${header.column.columnDef.size}px` : 'auto',
                                    }}
                                >
                                    <div className="header-content">
                                        {finalHeader}
                                        {header.column.getCanSort() && (
                                            <span className="sort-arrow">
                                                {{
                                                    asc: '↑',
                                                    desc: '↓',
                                                }[header.column.getIsSorted()] ?? '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                ))}
            </thead>
            {enableDragging ? (
                <SortableContext
                    items={data.map((item) => item.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <SortableTableRow key={row.id} row={row}>
                                {row.getVisibleCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className={cell.column.id.toLowerCase().includes('edit') || cell.column.id.toLowerCase().includes('delete') || cell.column.id.toLowerCase().includes('action') ? 'action-column' : ''}
                                        style={{
                                            width: cell.column.columnDef.size !== 150 ? `${cell.column.columnDef.size}px` : 'auto',
                                            minWidth: cell.column.columnDef.size !== 150 ? `${cell.column.columnDef.size}px` : 'auto',
                                        }}
                                    >
                                        <div className="cell-content">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </div>
                                    </td>
                                ))}
                            </SortableTableRow>
                        ))}
                    </tbody>
                </SortableContext>
            ) : (
                <tbody>
                    {table.getRowModel().rows.map((row) => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <td
                                    key={cell.id}
                                    className={cell.column.id.toLowerCase().includes('edit') || cell.column.id.toLowerCase().includes('delete') || cell.column.id.toLowerCase().includes('action') ? 'action-column' : ''}
                                    style={{
                                        width: cell.column.columnDef.size !== 150 ? `${cell.column.columnDef.size}px` : 'auto',
                                        minWidth: cell.column.columnDef.size !== 150 ? `${cell.column.columnDef.size}px` : 'auto',
                                    }}
                                >
                                    <div className="cell-content">
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            )}
        </table>
    );

    // 渲染拖曳覆層 - 使用從原始表格捕獲的實際欄寬
    const renderDragOverlay = () => {
        if (!activeItem || columnWidths.length === 0) return null;

        // 使用捕獲的實際欄寬計算總寬度
        const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);

        return (
            <table
                className="table admin-data-table drag-overlay-table"
                style={{ width: `${totalWidth}px`, minWidth: `${totalWidth}px` }}
            >
                <tbody>
                    <tr className="dragging-overlay-row">
                        {/* 拖曳句柄欄 - 使用第一個欄位的寬度 */}
                        <td
                            className="drag-handle-column"
                            style={{
                                width: `${columnWidths[0] || 40}px`,
                                minWidth: `${columnWidths[0] || 40}px`,
                                maxWidth: `${columnWidths[0] || 40}px`
                            }}
                        >
                            <img src={dragIcon} alt="拖曳" className="drag-handle-icon" />
                        </td>
                        {/* 資料欄 - 使用各自捕獲的實際寬度 */}
                        {columns.map((column, index) => {
                            // columnWidths[0] 是拖曳欄，所以資料欄從 index + 1 開始
                            const colWidth = columnWidths[index + 1] || 150;
                            return (
                                <td
                                    key={column.id || column.accessorKey}
                                    style={{
                                        width: `${colWidth}px`,
                                        minWidth: `${colWidth}px`,
                                        maxWidth: `${colWidth}px`,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        padding: '0.5rem 0.75rem',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {flexRender(
                                        column.cell,
                                        {
                                            row: { original: activeItem },
                                            column: column,
                                            getValue: () => activeItem[column.accessorKey || column.id],
                                            table: table
                                        }
                                    ) || activeItem[column.accessorKey || column.id]}
                                </td>
                            );
                        })}
                    </tr>
                </tbody>
            </table>
        );
    };

    return (
        <div className="admin-table-responsive">
            {enableDragging ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    {renderTableContent()}
                    <DragOverlay>
                        {renderDragOverlay()}
                    </DragOverlay>
                </DndContext>
            ) : (
                renderTableContent()
            )}
        </div>
    );
};

AdminDataTable.propTypes = {
    data: PropTypes.array.isRequired,
    columns: PropTypes.array.isRequired,
    enableSorting: PropTypes.bool,
    enableDragging: PropTypes.bool,
    onDragEnd: PropTypes.func,
    emptyState: PropTypes.shape({
        message: PropTypes.string,
    }),
    isLoading: PropTypes.bool,
    error: PropTypes.string,
    onRetry: PropTypes.func,
    tableClassName: PropTypes.string,
};

export default AdminDataTable;
