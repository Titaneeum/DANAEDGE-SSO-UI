'use client'

import CreateModuleDialog from './create-module'
import type { ModuleDialogData } from './create-module'

interface UpdateModuleDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  data: ModuleDialogData | null
}

const UpdateModuleDialog = ({ open, onClose, onSuccess, data }: UpdateModuleDialogProps) => {
  return <CreateModuleDialog open={open} onClose={onClose} onSuccess={onSuccess} mode='update' data={data} />
}

export default UpdateModuleDialog
