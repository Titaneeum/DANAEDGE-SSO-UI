// MUI Imports
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'

// Third Party Imports
import type { useReactTable } from '@tanstack/react-table'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ClientModeProps = {
  serverSide?: false
  table: ReturnType<typeof useReactTable>
}

type ServerModeProps = {
  serverSide: true
  page: number // 0-based page index from server
  rowsPerPage: number // page size
  totalItems: number // total items in DB

  // 👇 same signature as MUI TablePagination / Pagination
  onPageChange: (event: React.ChangeEvent<unknown> | null, page: number) => void
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

type TablePaginationProps = ClientModeProps | ServerModeProps

const TablePaginationComponent = (props: TablePaginationProps) => {
  // ───────────────────────────────────────────
  // SERVER-SIDE MODE
  // ───────────────────────────────────────────
  if (props.serverSide) {
    const { page, rowsPerPage, totalItems, onPageChange } = props

    const start = totalItems === 0 ? 0 : page * rowsPerPage + 1
    const end = Math.min((page + 1) * rowsPerPage, totalItems)
    const pageCount = Math.max(1, Math.ceil(totalItems / rowsPerPage))

    return (
      <div className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
        <Typography color='text.disabled'>{`Showing ${start} to ${end} of ${totalItems} entries`}</Typography>

        <Pagination
          shape='rounded'
          color='primary'
          variant='tonal'
          count={pageCount} // total pages
          page={page + 1} // Pagination is 1-based
          onChange={(event, newPage) => {
            // convert back to 0-based for TablePagination / your handlers
            onPageChange(event, newPage - 1)
          }}
          showFirstButton
          showLastButton
        />
      </div>
    )
  }

  // ───────────────────────────────────────────
  // CLIENT-SIDE MODE (old behaviour)
  // ───────────────────────────────────────────
  const { table } = props

  const total = table.getFilteredRowModel().rows.length
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize

  const start = total === 0 ? 0 : pageIndex * pageSize + 1
  const end = Math.min((pageIndex + 1) * pageSize, total)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className='flex justify-between items-center flex-wrap pli-6 border-bs bs-auto plb-[12.5px] gap-2'>
      <Typography color='text.disabled'>{`Showing ${start} to ${end} of ${total} entries`}</Typography>

      <Pagination
        shape='rounded'
        color='primary'
        variant='tonal'
        count={pageCount}
        page={pageIndex + 1}
        onChange={(_, page) => table.setPageIndex(page - 1)}
        showFirstButton
        showLastButton
      />
    </div>
  )
}

export default TablePaginationComponent
