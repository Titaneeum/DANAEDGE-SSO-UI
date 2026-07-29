const NoResult = ({ searchValue }: { searchValue: string; setOpen: (value: boolean) => void }) => {
  return (
    <div className='flex items-center justify-center grow plb-14 pli-16'>
      <div className='flex flex-col items-center text-center'>
        <i className='tabler-file-alert text-[64px] mbe-2.5' />
        <p className='text-lg font-medium'>{`No result for "${searchValue}"`}</p>
        <p className='text-[15px] text-textDisabled'>More identity management pages can be added here later.</p>
      </div>
    </div>
  )
}

export default NoResult
