/* eslint-disable lines-around-comment */
'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'

// MUI
import Card from '@mui/material/Card'
import TablePagination from '@mui/material/TablePagination'
import type { TextFieldProps } from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  IconButton,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material'

// TanStack Table
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type Row
} from '@tanstack/react-table'
import { rankItem, type RankingInfo } from '@tanstack/match-sorter-utils'
import classnames from 'classnames'

// App
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import tableStyles from '@core/styles/table.module.css'

// --- TanStack module augmentation for fuzzy search metadata
declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

// --- Fuzzy filter helper
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

// --- Debounced input (for global filter)
const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => setValue(initialValue), [initialValue])

  useEffect(() => {
    const t = setTimeout(() => onChange(value), debounce)

    return () => clearTimeout(t)
  }, [value, debounce, onChange])

  return <CustomTextField {...props} value={value} onChange={e => setValue((e.target as HTMLInputElement).value)} />
}

/** ✅ NEW: allow accordionDetails to be node OR per-row renderer */
export type AccordionDetailsRenderer<T extends object> = React.ReactNode | ((row: Row<T>) => React.ReactNode)

// --- Props
export type CustomTableProps<T extends object = any> = {
  data: T[]
  column: ColumnDef<T, any>[]
  searchPlaceholder?: string
  pageSizeOptions?: number[]
  initialPageSize?: number
  pageSize?: number
  rightSection?: React.ReactNode
  leftSection?: React.ReactNode
  isAccordionBody?: boolean

  /** ✅ CHANGED */
  accordionDetails?: AccordionDetailsRenderer<T>

  isRowExpanded?: (row: Row<T>) => boolean
  toggleAccordion?: (row: Row<T>) => void
  withGlobalFilter?: boolean
  withPageSizeSelection?: boolean
  withPrintOptions?: boolean
  onPrint?: () => void
  isPrinting?: boolean
  withHeader?: boolean
  isLoading?: boolean

  /** 🔹 Enable this when data is already paginated by the server */
  serverSidePagination?: boolean
  /** 🔹 Total items in DB (from API pagination.total) */
  serverTotalItems?: number
  /** 🔹 0-based page index (current_page - 1) */
  serverPageIndex?: number
  /** 🔹 Items per page (per_page) */
  serverPageSize?: number
  /** 🔹 Called when user changes page (0-based index) */
  onServerPageChange?: (pageIndex: number) => void
  /** 🔹 Called when user changes page size */
  onServerPageSizeChange?: (pageSize: number) => void
}

// --- Helper: recursively normalize columns and assign ids
function normalizeColumns<T extends object>(cols: ColumnDef<T, any>[], parentPrefix = ''): ColumnDef<T, any>[] {
  return cols.map((col, idx) => {
    const anyCol = col as any
    const accessorKey = anyCol.accessorKey as string | number | undefined
    const idFromAccessor = accessorKey != null && accessorKey !== '' ? String(accessorKey) : undefined
    const finalId = anyCol.id ?? idFromAccessor ?? `${parentPrefix}col_${idx}`

    let childColumns: ColumnDef<T, any>[] | undefined

    if (anyCol.columns && Array.isArray(anyCol.columns)) {
      childColumns = normalizeColumns(anyCol.columns as ColumnDef<T, any>[], `${finalId}_`)
    }

    return {
      ...anyCol,
      id: finalId,
      ...(childColumns ? { columns: childColumns } : {})
    } as ColumnDef<T, any>
  })
}

// --- Component
function CustomTable<T extends object = any>({
  data: dataProp,
  column,
  searchPlaceholder = 'Search…',
  pageSizeOptions = [10, 25, 50, 100],
  initialPageSize = 10,
  rightSection,
  leftSection,
  isAccordionBody,
  accordionDetails,
  isRowExpanded,
  toggleAccordion,
  withGlobalFilter = true,
  withPageSizeSelection = true,
  withHeader = true,
  withPrintOptions = false,
  onPrint,
  isPrinting,
  isLoading,
  serverSidePagination = false,
  serverTotalItems,
  serverPageIndex,
  serverPageSize,
  onServerPageChange,
  onServerPageSizeChange
}: CustomTableProps<T>) {
  'use no memo'

  // keep a stable local array
  const [data, setData] = useState<T[]>(Array.isArray(dataProp) ? dataProp : [])
  const [globalFilter, setGlobalFilter] = useState('')

  // 🔎 Zoom state (0.6x - 1.4x)
  const [zoom, setZoom] = useState(1)

  const ZOOM_MIN = 0.6
  const ZOOM_MAX = 1.4
  const ZOOM_STEP = 0.1

  const zoomOut = () => setZoom(z => Math.max(ZOOM_MIN, Number((z - ZOOM_STEP).toFixed(2))))
  const zoomIn = () => setZoom(z => Math.min(ZOOM_MAX, Number((z + ZOOM_STEP).toFixed(2))))
  const zoomReset = () => setZoom(1)

  useEffect(() => setData(Array.isArray(dataProp) ? dataProp : []), [dataProp])

  // normalize columns (supports nested header groups via `columns`)
  const columns = useMemo<ColumnDef<T, any>[]>(() => normalizeColumns(column ?? []), [column])

  // table instance
  // TanStack Table intentionally returns mutable functions; this component is opted out of React Compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<T>({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    ...(serverSidePagination
      ? {
          manualPagination: true as const
        }
      : {
          initialState: { pagination: { pageSize: initialPageSize } },
          getPaginationRowModel: getPaginationRowModel()
        }),
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  // rows to render
  const pageRows = serverSidePagination ? table.getRowModel().rows : table.getPaginationRowModel().rows
  const hasRows = table.getFilteredRowModel().rows.length > 0

  // pagination values (client vs server)
  const effectivePageSize =
    serverSidePagination && typeof serverPageSize === 'number' ? serverPageSize : table.getState().pagination.pageSize

  const effectivePageIndex =
    serverSidePagination && typeof serverPageIndex === 'number'
      ? serverPageIndex
      : table.getState().pagination.pageIndex

  const effectiveTotalCount =
    serverSidePagination && typeof serverTotalItems === 'number'
      ? serverTotalItems
      : table.getFilteredRowModel().rows.length

  const handlePageChange = (_: unknown, newPage: number) => {
    if (serverSidePagination && onServerPageChange) onServerPageChange(newPage)
    else table.setPageIndex(newPage)
  }

  const handleRowsPerPageChange = (e: any) => {
    const newSize = Number(e.target.value)

    if (serverSidePagination && onServerPageSizeChange) onServerPageSizeChange(newSize)
    else table.setPageSize(newSize)
  }

  /** ✅ NEW: resolves accordionDetails per row (node OR function) */
  const renderAccordionDetails = React.useCallback(
    (row: Row<T>) => {
      if (!accordionDetails) return null

      return typeof accordionDetails === 'function'
        ? (accordionDetails as (r: Row<T>) => React.ReactNode)(row)
        : accordionDetails
    },
    [accordionDetails]
  )

  return (
    <Card>
      {/* Top bar */}
      <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
        <div className='flex items-center gap-2'>{leftSection}</div>

        <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
          {/* 🔎 Zoom controls */}
          <Box className='flex items-center gap-2'>
            <ToggleButtonGroup
              exclusive
              size='small'
              value={null}
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1,
                  py: 0.75,
                  borderColor: 'divider'
                }
              }}
            >
              <ToggleButton value='zoomOut' onClick={zoomOut} disabled={zoom <= ZOOM_MIN} aria-label='Zoom out'>
                <i className='tabler-zoom-out text-[18px]' />
              </ToggleButton>

              <ToggleButton value='zoomIn' onClick={zoomIn} disabled={zoom >= ZOOM_MAX} aria-label='Zoom in'>
                <i className='tabler-zoom-in text-[18px]' />
              </ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title='Reset zoom'>
              <Chip
                size='small'
                variant='outlined'
                clickable
                onClick={zoomReset}
                label={`${Math.round(zoom * 100)}%`}
                sx={{
                  height: 32,
                  '& .MuiChip-label': { px: 1.25, fontWeight: 600 }
                }}
              />
            </Tooltip>

            {withPrintOptions && (
              <Tooltip title='Print / Export'>
                <span>
                  <IconButton onClick={onPrint}>
                    <i className={`${isPrinting ? 'tabler-loader animate-spin' : 'tabler-printer'}`} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>

          {withPageSizeSelection && (
            <CustomTextField
              select
              value={effectivePageSize}
              onChange={handleRowsPerPageChange}
              className='max-sm:is-full sm:is-[70px]'
            >
              {pageSizeOptions.map(ps => (
                <MenuItem key={ps} value={ps}>
                  {ps}
                </MenuItem>
              ))}
            </CustomTextField>
          )}

          {withGlobalFilter && (
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={v => setGlobalFilter(String(v))}
              placeholder={searchPlaceholder}
              className='max-sm:is-full'
            />
          )}

          {rightSection}
        </div>
      </div>

      {/* Table */}
      <div className='overflow-x-auto'>
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${100 / zoom}%`
          }}
        >
          <table className={tableStyles.table}>
            {withHeader && (
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} colSpan={header.colSpan} className='font-bold'>
                        {header.isPlaceholder
                          ? null
                          : (() => {
                              const content = flexRender(header.column.columnDef.header, header.getContext())
                              const isEmptyHeader = typeof content === 'string' && content.trim() === ''
                              const canSort = header.column.getCanSort() && !isEmptyHeader

                              return (
                                <div
                                  className={classnames({
                                    'flex items-center': header.column.getIsSorted(),
                                    'cursor-pointer select-none': canSort
                                  })}
                                  onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                >
                                  {isEmptyHeader ? <span aria-hidden='true'>&nbsp;</span> : content}
                                  {canSort
                                    ? ({
                                        asc: <i className='tabler-chevron-up text-xl' />,
                                        desc: <i className='tabler-chevron-down text-xl' />
                                      }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null)
                                    : null}
                                </div>
                              )
                            })()}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
            )}

            {/* Body */}
            {isLoading ? (
              <tbody>
                {Array.from({ length: Math.min(5, effectivePageSize) }).map((_, rIdx) => (
                  <tr key={`sk-row-${rIdx}`}>
                    {table.getVisibleLeafColumns().map(col => (
                      <td key={`sk-cell-${rIdx}-${col.id}`}>
                        <Skeleton variant='text' sx={{ fontSize: '1rem' }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : !hasRows ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    No data available
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {pageRows.map(row => {
                  const expanded = isAccordionBody ? (isRowExpanded?.(row) ?? false) : false

                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        className={classnames({
                          selected: row.getIsSelected(),
                          'cursor-pointer': !!toggleAccordion
                        })}
                        onClick={toggleAccordion ? () => toggleAccordion(row) : undefined}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className='text-sm'>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>

                      {isAccordionBody && (
                        <tr aria-hidden={!expanded} className={expanded ? '' : 'hidden'}>
                          <td colSpan={table.getVisibleFlatColumns().length} className='p-0'>
                            <Accordion
                              expanded={expanded}
                              elevation={0}
                              disableGutters
                              square
                              sx={{ '& .MuiAccordionSummary-root': { display: 'none' } }}
                            >
                              <AccordionSummary />
                              <AccordionDetails className='flex items-center p-3'>
                                {renderAccordionDetails(row)}
                              </AccordionDetails>
                            </Accordion>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {serverSidePagination ? (
        <TablePagination
          component={() => (
            <TablePaginationComponent
              serverSide
              page={effectivePageIndex}
              rowsPerPage={effectivePageSize}
              totalItems={effectiveTotalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          )}
          count={effectiveTotalCount}
          rowsPerPage={effectivePageSize}
          page={effectivePageIndex}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      ) : (
        <TablePagination
          component={() => <TablePaginationComponent table={table as any} />}
          count={table.getFilteredRowModel().rows.length}
          rowsPerPage={table.getState().pagination.pageSize}
          page={table.getState().pagination.pageIndex}
          onPageChange={(_, page) => table.setPageIndex(page)}
        />
      )}
    </Card>
  )
}

export default CustomTable
